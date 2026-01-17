'use server'

import { requireProfile } from '@/lib/auth'
import prisma from '@/lib/prisma'

export interface MonthlySummary {
    month: number // 0-11
    income: number
    expense: number
    balance: number
}

export interface CategorySummary {
    id: string
    name: string
    amount: number
    color?: string
}

export interface CurrencyTotals {
    income: number
    expense: number
    balance: number
    savingsRate: number
}

export interface CurrencyData {
    totals: CurrencyTotals
    monthly: MonthlySummary[]
    expensesByCategory: CategorySummary[]
    incomeByCategory: CategorySummary[]
}

export interface AnnualSummaryData {
    year: number
    ars: CurrencyData
    usd: CurrencyData
}

export async function getAnnualSummary(year: number): Promise<AnnualSummaryData> {
    const profile = await requireProfile()
    const startDate = new Date(year, 0, 1)
    const endDate = new Date(year + 1, 0, 1)

    const transactions = await prisma.transaction.findMany({
        where: {
            organizationId: profile.organizationId,
            date: {
                gte: startDate,
                lt: endDate
            }
        },
        include: {
            category: true
        }
    })

    const createEmptyMonthlyData = () => Array.from({ length: 12 }, (_, i) => ({
        month: i,
        income: 0,
        expense: 0,
        balance: 0
    }))

    const monthlyDataARS = createEmptyMonthlyData()
    const monthlyDataUSD = createEmptyMonthlyData()

    const expenseCategoryMapARS = new Map<string, { name: string; amount: number }>()
    const incomeCategoryMapARS = new Map<string, { name: string; amount: number }>()

    const expenseCategoryMapUSD = new Map<string, { name: string; amount: number }>()
    const incomeCategoryMapUSD = new Map<string, { name: string; amount: number }>()

    const totalsARS = { income: 0, expense: 0 }
    const totalsUSD = { income: 0, expense: 0 }

    transactions.forEach(tx => {
        const month = tx.date.getMonth()
        const amount = Number(tx.amount)
        const isARS = tx.currency === 'ARS'
        const isUSD = tx.currency === 'USD'

        if (isARS) {
            if (tx.type === 'INCOME') {
                monthlyDataARS[month].income += amount
                monthlyDataARS[month].balance += amount
                totalsARS.income += amount

                const currentCat = incomeCategoryMapARS.get(tx.category.name) || { name: tx.category.name, amount: 0 }
                currentCat.amount += amount
                incomeCategoryMapARS.set(tx.category.name, currentCat)

            } else if (tx.type === 'EXPENSE') {
                monthlyDataARS[month].expense += amount
                monthlyDataARS[month].balance -= amount
                totalsARS.expense += amount

                const currentCat = expenseCategoryMapARS.get(tx.category.name) || { name: tx.category.name, amount: 0 }
                currentCat.amount += amount
                expenseCategoryMapARS.set(tx.category.name, currentCat)
            }
        } else if (isUSD) {
            if (tx.type === 'INCOME') {
                monthlyDataUSD[month].income += amount
                monthlyDataUSD[month].balance += amount
                totalsUSD.income += amount

                const currentCat = incomeCategoryMapUSD.get(tx.category.name) || { name: tx.category.name, amount: 0 }
                currentCat.amount += amount
                incomeCategoryMapUSD.set(tx.category.name, currentCat)

            } else if (tx.type === 'EXPENSE') {
                monthlyDataUSD[month].expense += amount
                monthlyDataUSD[month].balance -= amount
                totalsUSD.expense += amount

                const currentCat = expenseCategoryMapUSD.get(tx.category.name) || { name: tx.category.name, amount: 0 }
                currentCat.amount += amount
                expenseCategoryMapUSD.set(tx.category.name, currentCat)
            }
        }
    })

    const processCategoryMap = (map: Map<string, { name: string; amount: number }>) => {
        return Array.from(map.entries())
            .map(([name, data]) => ({
                id: name,
                name: data.name,
                amount: data.amount,
            }))
            .sort((a, b) => b.amount - a.amount)
            .slice(0, 10)
    }

    const calculateMetrics = (income: number, expense: number) => ({
        income,
        expense,
        balance: income - expense,
        savingsRate: income > 0 ? ((income - expense) / income) * 100 : 0
    })

    return {
        year,
        ars: {
            totals: calculateMetrics(totalsARS.income, totalsARS.expense),
            monthly: monthlyDataARS,
            expensesByCategory: processCategoryMap(expenseCategoryMapARS),
            incomeByCategory: processCategoryMap(incomeCategoryMapARS)
        },
        usd: {
            totals: calculateMetrics(totalsUSD.income, totalsUSD.expense),
            monthly: monthlyDataUSD,
            expensesByCategory: processCategoryMap(expenseCategoryMapUSD),
            incomeByCategory: processCategoryMap(incomeCategoryMapUSD)
        }
    }
}

export interface CategoryBreakdownItem {
    id: string
    name: string
    total: number
    subcategories: {
        id: string
        name: string
        total: number
    }[]
}

export async function getAnnualCategoryBreakdown(year: number, type: 'INCOME' | 'EXPENSE' = 'EXPENSE', currency: 'ARS' | 'USD' = 'ARS'): Promise<CategoryBreakdownItem[]> {
    const profile = await requireProfile()
    const startDate = new Date(year, 0, 1)
    const endDate = new Date(year + 1, 0, 1)

    const transactions = await prisma.transaction.findMany({
        where: {
            organizationId: profile.organizationId,
            type: type,
            currency: currency,
            date: {
                gte: startDate,
                lt: endDate
            }
        },
        include: {
            category: {
                include: {
                    parent: true
                }
            }
        }
    })

    const groups = new Map<string, CategoryBreakdownItem>()

    for (const tx of transactions) {
        const amount = Number(tx.amount)
        const category = tx.category

        // Determine parent (if category has parent, use it; otherwise category itself is parent)
        const parentId = category.parentId || category.id
        const parentName = category.parent?.name || category.name

        if (!groups.has(parentId)) {
            groups.set(parentId, {
                id: parentId,
                name: parentName,
                total: 0,
                subcategories: []
            })
        }

        const group = groups.get(parentId)!
        group.total += amount

        // specialized logic: distinct subcategory logic
        // If the transaction is on a subcategory (category.parentId exists)
        // OR if we want to track the category itself as a "subcategory" bucket within the parent

        const subId = category.id
        const subName = category.name

        let subItem = group.subcategories.find(s => s.id === subId)
        if (!subItem) {
            subItem = { id: subId, name: subName, total: 0 }
            group.subcategories.push(subItem)
        }
        subItem.total += amount
    }

    return Array.from(groups.values())
        .map(g => ({
            ...g,
            subcategories: g.subcategories.sort((a, b) => b.total - a.total)
        }))
        .sort((a, b) => b.total - a.total)
}

'use server'

import { requireProfile } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { getStartOfYearArgentina, getEndOfYearArgentina } from '@/lib/dateUtils'

export interface TransactionSummary {
    date: Date
    description: string
    categoryName: string
    amount: number
    type: 'INCOME' | 'EXPENSE'
}

export interface MonthlySummary {
    month: number // 0-11
    income: number
    expense: number
    balance: number
    initialBalance: number
    expensesByCategory: CategorySummary[]
    incomeByCategory: CategorySummary[]
    transactions: TransactionSummary[]
}

export interface CategorySummary {
    id: string
    name: string
    amount: number
    color?: string
    subcategories?: CategorySummary[]
}

export interface CurrencyTotals {
    income: number
    expense: number
    balance: number
    initialBalance: number
    savingsRate: number
}

export interface CurrencyData {
    totals: CurrencyTotals
    monthly: MonthlySummary[]
    expensesByCategory: CategorySummary[]
    incomeByCategory: CategorySummary[]
}

export interface ExchangeEvent {
    date: Date
    description: string
    currencyOut: string
    amountOut: number
    currencyIn: string
    amountIn: number
    rate: string
}

export interface AnnualSummaryData {
    year: number
    ars: CurrencyData
    usd: CurrencyData
    exchanges: ExchangeEvent[]
}

export async function getAnnualSummary(year: number): Promise<AnnualSummaryData> {
    const profile = await requireProfile()
    const startDate = getStartOfYearArgentina(year)
    const endDate = getEndOfYearArgentina(year)

    const transactions = await prisma.transaction.findMany({
        where: {
            organizationId: profile.organizationId,
            date: {
                gte: startDate,
                lt: endDate
            }
        },
        include: {
            category: {
                include: { parent: true }
            }
        },
        orderBy: {
            date: 'desc'
        }
    })

    // 2. Fetch Opening Balance Transactions (OPENING_BALANCE)
    // We look for transactions of type OPENING_BALANCE for this year
    const openingBalances = await prisma.transaction.findMany({
        where: {
            organizationId: profile.organizationId,
            type: 'OPENING_BALANCE' as any,
            date: {
                gte: startDate,
                lt: endDate
            }
        }
    })

    const initialBalanceARS = openingBalances
        .filter(t => t.currency === 'ARS')
        .reduce((sum, t) => sum + Number(t.amount), 0)

    const initialBalanceUSD = openingBalances
        .filter(t => t.currency === 'USD')
        .reduce((sum, t) => sum + Number(t.amount), 0)


    const createEmptyMonthlyData = (): MonthlySummary[] => Array.from({ length: 12 }, (_, i) => ({
        month: i,
        income: 0,
        expense: 0,
        balance: 0,
        initialBalance: 0,
        expensesByCategory: [],
        incomeByCategory: [],
        transactions: []
    }))

    const monthlyDataARS = createEmptyMonthlyData()
    const monthlyDataUSD = createEmptyMonthlyData()

    // Monthly Category Maps [MonthIndex -> Map<parentId, CategorySummary>]
    const monthlyExpenseCategoryMapARS = Array.from({ length: 12 }, () => new Map<string, CategorySummary>())
    const monthlyIncomeCategoryMapARS = Array.from({ length: 12 }, () => new Map<string, CategorySummary>())

    const monthlyExpenseCategoryMapUSD = Array.from({ length: 12 }, () => new Map<string, CategorySummary>())
    const monthlyIncomeCategoryMapUSD = Array.from({ length: 12 }, () => new Map<string, CategorySummary>())

    const expenseCategoryMapARS = new Map<string, CategorySummary>()
    const incomeCategoryMapARS = new Map<string, CategorySummary>()

    const expenseCategoryMapUSD = new Map<string, CategorySummary>()
    const incomeCategoryMapUSD = new Map<string, CategorySummary>()

    const totalsARS = { income: 0, expense: 0 }
    const totalsUSD = { income: 0, expense: 0 }

    // Logic for Currency Exchanges
    const exchangeTxs = transactions.filter(t => t.category.name === 'Intercambio de Moneda')
    // Group by date (ISO string) + description to pair them
    const exchangeGroups = new Map<string, typeof transactions>()

    exchangeTxs.forEach(tx => {
        // Use ISO string of date (which includes time from creation) + description as key
        // In createExchange they share 'date' object exactly, so .toISOString() should match.
        const key = `${tx.date.toISOString()}|${tx.description}`
        if (!exchangeGroups.has(key)) {
            exchangeGroups.set(key, [])
        }
        exchangeGroups.get(key)!.push(tx)
    })

    const exchanges: ExchangeEvent[] = []

    for (const [key, group] of exchangeGroups.entries()) {
        const expenseTx = group.find(t => t.type === 'EXPENSE')
        const incomeTx = group.find(t => t.type === 'INCOME')

        if (expenseTx && incomeTx) {
            // Extract rate from description or just display description
            // Description format: "TC: 1 USD = 1200,00 ARS"
            // Let's optimize description display - maybe just keep the rate part?
            // User requested "tipo de cambio". The description ALREADY contains it.
            // Let's use the description as is or simplify.
            // Actually, description is "TC: ..."

            exchanges.push({
                date: expenseTx.date,
                description: expenseTx.description || '',
                currencyOut: expenseTx.currency,
                amountOut: Number(expenseTx.amount),
                currencyIn: incomeTx.currency,
                amountIn: Number(incomeTx.amount),
                rate: expenseTx.description || '' // Or we can parse it if needed
            })
        }
    }

    // Sort exchanges by date desc
    exchanges.sort((a, b) => b.date.getTime() - a.date.getTime())

    transactions.forEach(tx => {
        const month = tx.date.getMonth()
        const amount = Number(tx.amount)
        const isARS = tx.currency === 'ARS'
        const isUSD = tx.currency === 'USD'

        const txSummary: TransactionSummary = {
            date: tx.date,
            description: tx.description || '',
            categoryName: tx.category.name,
            amount: amount,
            type: tx.type === 'INCOME' ? 'INCOME' : 'EXPENSE'
        }

        const updateCategoryMap = (map: Map<string, CategorySummary>, cat: typeof tx.category, amt: number) => {
            const parentId = cat.parentId || cat.id
            const parentName = cat.parent?.name || cat.name

            if (!map.has(parentId)) {
                map.set(parentId, { id: parentId, name: parentName, amount: 0, subcategories: [] })
            }
            const parent = map.get(parentId)!
            parent.amount += amt

            // Add to subcategory (even if it's the same as parent, strict layout prefers explicit sub items if we want detailed breakdwon)
            // Or we only add to subcategories if cat.id !== parentId
            // Let's treat the category itself as a sub entry so we don't lose the breakdown
            let sub = parent.subcategories?.find(s => s.id === cat.id)
            if (!sub) {
                sub = { id: cat.id, name: cat.name, amount: 0 }
                parent.subcategories?.push(sub)
            }
            sub.amount += amt
        }

        if (isARS) {
            monthlyDataARS[month].transactions.push(txSummary)
            if (tx.type === 'INCOME') {
                monthlyDataARS[month].income += amount
                monthlyDataARS[month].balance += amount
                totalsARS.income += amount

                updateCategoryMap(incomeCategoryMapARS, tx.category, amount)
                updateCategoryMap(monthlyIncomeCategoryMapARS[month], tx.category, amount)

            } else if (tx.type === 'EXPENSE') {
                monthlyDataARS[month].expense += amount
                monthlyDataARS[month].balance -= amount
                totalsARS.expense += amount

                updateCategoryMap(expenseCategoryMapARS, tx.category, amount)
                updateCategoryMap(monthlyExpenseCategoryMapARS[month], tx.category, amount)
            }
        } else if (isUSD) {
            monthlyDataUSD[month].transactions.push(txSummary)
            if (tx.type === 'INCOME') {
                monthlyDataUSD[month].income += amount
                monthlyDataUSD[month].balance += amount
                totalsUSD.income += amount

                updateCategoryMap(incomeCategoryMapUSD, tx.category, amount)
                updateCategoryMap(monthlyIncomeCategoryMapUSD[month], tx.category, amount)

            } else if (tx.type === 'EXPENSE') {
                monthlyDataUSD[month].expense += amount
                monthlyDataUSD[month].balance -= amount
                totalsUSD.expense += amount

                updateCategoryMap(expenseCategoryMapUSD, tx.category, amount)
                updateCategoryMap(monthlyExpenseCategoryMapUSD[month], tx.category, amount)
            }
        }
    })

    const processCategoryMap = (map: Map<string, CategorySummary>) => {
        return Array.from(map.values())
            .map(cat => ({
                ...cat,
                subcategories: cat.subcategories?.sort((a, b) => b.amount - a.amount)
            }))
            .sort((a, b) => b.amount - a.amount)
    }

    // Process Monthly Metrics and Categories
    let currentBalanceARS = initialBalanceARS
    let currentBalanceUSD = initialBalanceUSD

    for (let i = 0; i < 12; i++) {
        // ARS
        monthlyDataARS[i].initialBalance = currentBalanceARS
        monthlyDataARS[i].expensesByCategory = processCategoryMap(monthlyExpenseCategoryMapARS[i])
        monthlyDataARS[i].incomeByCategory = processCategoryMap(monthlyIncomeCategoryMapARS[i])
        currentBalanceARS = monthlyDataARS[i].initialBalance + monthlyDataARS[i].income - monthlyDataARS[i].expense

        // USD
        monthlyDataUSD[i].initialBalance = currentBalanceUSD
        monthlyDataUSD[i].expensesByCategory = processCategoryMap(monthlyExpenseCategoryMapUSD[i])
        monthlyDataUSD[i].incomeByCategory = processCategoryMap(monthlyIncomeCategoryMapUSD[i])
        currentBalanceUSD = monthlyDataUSD[i].initialBalance + monthlyDataUSD[i].income - monthlyDataUSD[i].expense
    }


    const calculateMetrics = (income: number, expense: number, initial: number) => ({
        income,
        expense,
        balance: initial + income - expense, // Correct formula including initial
        initialBalance: initial,
        savingsRate: income > 0 ? ((income - expense) / income) * 100 : 0
    })

    return {
        year,
        ars: {
            totals: calculateMetrics(totalsARS.income, totalsARS.expense, initialBalanceARS),
            monthly: monthlyDataARS,
            expensesByCategory: processCategoryMap(expenseCategoryMapARS),
            incomeByCategory: processCategoryMap(incomeCategoryMapARS)
        },
        usd: {
            totals: calculateMetrics(totalsUSD.income, totalsUSD.expense, initialBalanceUSD),
            monthly: monthlyDataUSD,
            expensesByCategory: processCategoryMap(expenseCategoryMapUSD),
            incomeByCategory: processCategoryMap(incomeCategoryMapUSD)
        },
        exchanges
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
    const startDate = getStartOfYearArgentina(year)
    const endDate = getEndOfYearArgentina(year)

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

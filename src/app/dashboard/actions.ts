'use server'

import { requireProfile } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { getFinanceSummary } from './finance/actions'

export async function getDashboardData(year?: number, month?: number) {
    const profile = await requireProfile()

    // Build date filter for the specified month or current month
    const now = new Date()
    const targetYear = year ?? now.getFullYear()
    const targetMonth = month ?? now.getMonth() + 1

    const firstDay = new Date(targetYear, targetMonth - 1, 1)
    const lastDay = new Date(targetYear, targetMonth, 0, 23, 59, 59, 999)

    // Get financial summary for the specified month
    const financeSummary = await getFinanceSummary({
        dateFrom: firstDay.toISOString().split('T')[0],
        dateTo: lastDay.toISOString().split('T')[0],
    })

    // Get recent transactions for the specified month
    const recentTransactions = await prisma.transaction.findMany({
        where: {
            organizationId: profile.organizationId,
            date: {
                gte: firstDay,
                lte: lastDay,
            }
        },
        include: {
            category: {
                include: { parent: true }
            },
            member: true,
        },
        orderBy: { date: 'desc' },
        take: 5,
    })

    // Get expenses grouped by category (ARS only to match KPIs, excluding currency exchanges)
    const expenseTransactions = await prisma.transaction.findMany({
        where: {
            organizationId: profile.organizationId,
            type: 'EXPENSE',
            currency: 'ARS',
            NOT: {
                category: {
                    name: 'Cambio de Moneda'
                }
            },
            date: {
                gte: firstDay,
                lte: lastDay,
            }
        },
        include: {
            category: {
                include: { parent: true }
            }
        },
    })

    // Group expenses by parent category and subcategory
    const expensesByCategory = expenseTransactions.reduce((acc, transaction) => {
        const parentCategory = transaction.category.parent || transaction.category
        const isSubcategory = !!transaction.category.parent

        if (!acc[parentCategory.id]) {
            acc[parentCategory.id] = {
                category: parentCategory,
                total: 0,
                subcategories: {}
            }
        }

        const amount = Number(transaction.amount)
        acc[parentCategory.id].total += amount

        if (isSubcategory) {
            const subId = transaction.category.id
            if (!acc[parentCategory.id].subcategories[subId]) {
                acc[parentCategory.id].subcategories[subId] = {
                    category: transaction.category,
                    total: 0
                }
            }
            acc[parentCategory.id].subcategories[subId].total += amount
        }

        return acc
    }, {} as Record<string, {
        category: any
        total: number
        subcategories: Record<string, { category: any, total: number }>
    }>)

    // Get incomes grouped by category (ARS only to match KPIs, excluding currency exchanges)
    const incomeTransactions = await prisma.transaction.findMany({
        where: {
            organizationId: profile.organizationId,
            type: 'INCOME',
            currency: 'ARS',
            NOT: {
                category: {
                    name: 'Cambio de Moneda'
                }
            },
            date: {
                gte: firstDay,
                lte: lastDay,
            }
        },
        include: {
            category: {
                include: { parent: true }
            }
        },
    })

    // Group incomes by parent category and subcategory
    const incomesByCategory = incomeTransactions.reduce((acc, transaction) => {
        const parentCategory = transaction.category.parent || transaction.category
        const isSubcategory = !!transaction.category.parent

        if (!acc[parentCategory.id]) {
            acc[parentCategory.id] = {
                category: parentCategory,
                total: 0,
                subcategories: {}
            }
        }

        const amount = Number(transaction.amount)
        acc[parentCategory.id].total += amount

        if (isSubcategory) {
            const subId = transaction.category.id
            if (!acc[parentCategory.id].subcategories[subId]) {
                acc[parentCategory.id].subcategories[subId] = {
                    category: transaction.category,
                    total: 0
                }
            }
            acc[parentCategory.id].subcategories[subId].total += amount
        }

        return acc
    }, {} as Record<string, {
        category: any
        total: number
        subcategories: Record<string, { category: any, total: number }>
    }>)

    // Get currency exchange transactions
    const currencyExchanges = await prisma.transaction.findMany({
        where: {
            organizationId: profile.organizationId,
            category: {
                name: {
                    contains: 'cambio',
                    mode: 'insensitive'
                }
            },
            date: {
                gte: firstDay,
                lte: lastDay,
            }
        },
        include: {
            category: true,
        },
        orderBy: { date: 'desc' },
    })

    return {
        financeSummary,
        recentTransactions,
        expensesByCategory: Object.values(expensesByCategory).sort((a, b) => b.total - a.total),
        incomesByCategory: Object.values(incomesByCategory).sort((a, b) => b.total - a.total),
        currencyExchanges: currencyExchanges.map(exchange => ({
            ...exchange,
            amount: Number(exchange.amount)
        })),
    }
}

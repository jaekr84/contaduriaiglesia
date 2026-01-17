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

    console.time('getDashboardData')
    const start = performance.now()

    const firstDay = new Date(targetYear, targetMonth - 1, 1)
    const lastDay = new Date(targetYear, targetMonth, 0, 23, 59, 59, 999)

    // Parallelize all data fetching
    const [
        financeSummary,
        recentTransactions,
        currencyExchanges,
        expenseGroups,
        incomeGroups
    ] = await Promise.all([
        getFinanceSummary({
            dateFrom: firstDay.toISOString().split('T')[0],
            dateTo: lastDay.toISOString().split('T')[0],
        }),
        prisma.transaction.findMany({
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
        }),
        prisma.transaction.findMany({
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
        }),
        // Optimized Aggregation for Expenses
        prisma.transaction.groupBy({
            by: ['categoryId'],
            where: {
                organizationId: profile.organizationId,
                type: 'EXPENSE',
                currency: 'ARS',
                category: {
                    name: { not: 'Cambio de Moneda' }
                },
                date: {
                    gte: firstDay,
                    lte: lastDay,
                }
            },
            _sum: { amount: true }
        }),
        // Optimized Aggregation for Incomes
        prisma.transaction.groupBy({
            by: ['categoryId'],
            where: {
                organizationId: profile.organizationId,
                type: 'INCOME',
                currency: 'ARS',
                category: {
                    name: { not: 'Cambio de Moneda' }
                },
                date: {
                    gte: firstDay,
                    lte: lastDay,
                }
            },
            _sum: { amount: true }
        })
    ])

    // Fetch category details for all referenced categories (Expenses + Incomes)
    // We need this to reconstruct the parent/child structure
    const allCategoryIds = [
        ...new Set([
            ...expenseGroups.map(g => g.categoryId),
            ...incomeGroups.map(g => g.categoryId)
        ])
    ].filter(id => id !== null) as string[]

    const categories = await prisma.category.findMany({
        where: { id: { in: allCategoryIds } },
        include: { parent: true }
    })

    const categoryMap = new Map(categories.map(c => [c.id, c]))

    // Helper to process groups into the expected format
    const processGroups = (groups: typeof expenseGroups) => {
        const result: Record<string, {
            category: any
            total: number
            subcategories: Record<string, { category: any, total: number }>
        }> = {}

        groups.forEach(group => {
            const categoryId = group.categoryId
            if (!categoryId) return // Should not happen due to filter but strict safety
            const amount = Number(group._sum.amount || 0)
            const category = categoryMap.get(categoryId)

            if (!category) return

            const parentCategory = category.parent || category
            const isSubcategory = !!category.parent

            if (!result[parentCategory.id]) {
                result[parentCategory.id] = {
                    category: parentCategory,
                    total: 0,
                    subcategories: {}
                }
            }

            result[parentCategory.id].total += amount

            if (isSubcategory) {
                if (!result[parentCategory.id].subcategories[categoryId]) {
                    result[parentCategory.id].subcategories[categoryId] = {
                        category: category,
                        total: 0
                    }
                }
                result[parentCategory.id].subcategories[categoryId].total += amount
            }
        })

        return Object.values(result).sort((a, b) => b.total - a.total)
    }

    console.timeEnd('getDashboardData')
    console.log(`getDashboardData took ${performance.now() - start}ms`)

    return {
        financeSummary,
        recentTransactions,
        expensesByCategory: processGroups(expenseGroups),
        incomesByCategory: processGroups(incomeGroups),
        currencyExchanges: currencyExchanges.map(exchange => ({
            ...exchange,
            amount: Number(exchange.amount)
        })),
    }
}

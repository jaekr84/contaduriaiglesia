'use server'

import { requireProfile } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function getFinancialStatement(year?: number) {
    const profile = await requireProfile()
    const targetYear = year ?? new Date().getFullYear()

    console.time('getFinancialStatement')
    const start = performance.now()

    // 1. Calculate the start of the 12-month window
    const now = new Date()
    const windowStart = new Date(now.getFullYear(), now.getMonth() - 11, 1)

    // 2. Base Balance Query: Sum of all transactions BEFORE the window
    const baseGroups = await prisma.transaction.groupBy({
        by: ['currency', 'type'],
        where: {
            organizationId: profile.organizationId,
            date: { lt: windowStart },
            cancelledAt: null
        },
        _sum: { amount: true }
    })

    // Initialize running balance with base
    const runningBalances: Record<string, number> = {}
    baseGroups.forEach(g => {
        const curr = g.currency || 'ARS'
        if (!runningBalances[curr]) runningBalances[curr] = 0
        const amount = Number(g._sum.amount || 0)
        if (g.type === 'INCOME') runningBalances[curr] += amount
        if (g.type === 'EXPENSE') runningBalances[curr] -= amount
    })

    // 3. Window Query: Fetch all transactions WITHIN the window
    const windowTransactions = await prisma.transaction.findMany({
        where: {
            organizationId: profile.organizationId,
            date: { gte: windowStart },
            cancelledAt: null
        },
        orderBy: { date: 'asc' },
        select: {
            date: true,
            amount: true,
            currency: true,
            type: true
        }
    })

    // 4. In-Memory Rollup for Monthly Evolution
    const monthlyData = []
    let transactionIndex = 0

    for (let i = 11; i >= 0; i--) {
        const dateIterator = new Date()
        dateIterator.setMonth(dateIterator.getMonth() - i)
        const monthEnd = new Date(dateIterator.getFullYear(), dateIterator.getMonth() + 1, 0, 23, 59, 59, 999)

        // Process transactions up to this month end
        while (transactionIndex < windowTransactions.length) {
            const t = windowTransactions[transactionIndex]
            if (t.date > monthEnd) break // Stop if transaction is in future months

            const curr = t.currency || 'ARS'
            if (!runningBalances[curr]) runningBalances[curr] = 0
            const amount = Number(t.amount)
            if (t.type === 'INCOME') runningBalances[curr] += amount
            if (t.type === 'EXPENSE') runningBalances[curr] -= amount

            transactionIndex++
        }

        monthlyData.push({
            month: dateIterator.toLocaleDateString('es-AR', { month: 'short', year: 'numeric' }),
            ARS: runningBalances.ARS || 0,
            USD: runningBalances.USD || 0,
        })
    }

    // 5. Current Balance: Use the final running balance from the loop (which is "now")
    // NOTE: If there are future transactions (beyond "now"?? Unlikely in this app context but possible),
    // they would be in windowTransactions but maybe skipped by the loop if we stop at "now"?
    // Actually the loop goes up to current month end.
    // Let's ensure we process ALL remaining transactions for the absolute "Current Balance" just in case
    // there are transactions dated tomorrow etc.
    while (transactionIndex < windowTransactions.length) {
        const t = windowTransactions[transactionIndex]
        const curr = t.currency || 'ARS'
        if (!runningBalances[curr]) runningBalances[curr] = 0
        const amount = Number(t.amount)
        if (t.type === 'INCOME') runningBalances[curr] += amount
        if (t.type === 'EXPENSE') runningBalances[curr] -= amount
        transactionIndex++
    }

    const currentBalance = {
        ARS: runningBalances.ARS || 0,
        USD: runningBalances.USD || 0
    }

    // 6. Annual Summary for Target Year (optimized with groupBy)
    const yearStart = new Date(targetYear, 0, 1)
    const yearEnd = new Date(targetYear, 11, 31, 23, 59, 59, 999)

    const annualGroups = await prisma.transaction.groupBy({
        by: ['currency', 'type'],
        where: {
            organizationId: profile.organizationId,
            date: {
                gte: yearStart,
                lte: yearEnd,
            },
            cancelledAt: null
        },
        _sum: { amount: true }
    })

    const annualSummary: Record<string, { income: number, expense: number, balance: number }> = {
        ARS: { income: 0, expense: 0, balance: 0 },
        USD: { income: 0, expense: 0, balance: 0 }
    }

    annualGroups.forEach(g => {
        const curr = g.currency || 'ARS'
        const amount = Number(g._sum.amount || 0)

        if (!annualSummary[curr]) annualSummary[curr] = { income: 0, expense: 0, balance: 0 }

        if (g.type === 'INCOME') {
            annualSummary[curr].income += amount
            annualSummary[curr].balance += amount
        }
        if (g.type === 'EXPENSE') {
            annualSummary[curr].expense += amount
            annualSummary[curr].balance -= amount
        }
    })

    console.timeEnd('getFinancialStatement')
    console.log(`getFinancialStatement took ${performance.now() - start}ms`)

    return {
        currentBalance,
        monthlyEvolution: monthlyData,
        annualSummary,
        lastUpdated: new Date(),
    }
}

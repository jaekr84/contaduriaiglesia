'use server'

import { requireProfile } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function getFinancialStatement(year?: number) {
    const profile = await requireProfile()
    const targetYear = year ?? new Date().getFullYear()

    // Get current balance by currency
    const transactions = await prisma.transaction.findMany({
        where: {
            organizationId: profile.organizationId,
        },
        select: {
            amount: true,
            currency: true,
            type: true,
        }
    })

    const balances = transactions.reduce((acc, t) => {
        const curr = t.currency
        if (!acc[curr]) acc[curr] = 0
        const amount = Number(t.amount)
        if (t.type === 'INCOME') acc[curr] += amount
        if (t.type === 'EXPENSE') acc[curr] -= amount
        return acc
    }, {} as Record<string, number>)

    // Get monthly evolution for the last 12 months
    const monthlyData = []
    for (let i = 11; i >= 0; i--) {
        const date = new Date()
        date.setMonth(date.getMonth() - i)
        const month = date.getMonth() + 1
        const year = date.getFullYear()

        const firstDay = new Date(year, month - 1, 1)
        const lastDay = new Date(year, month, 0, 23, 59, 59, 999)

        const monthTransactions = await prisma.transaction.findMany({
            where: {
                organizationId: profile.organizationId,
                date: {
                    lte: lastDay,
                }
            },
            select: {
                amount: true,
                currency: true,
                type: true,
            }
        })

        const monthBalance = monthTransactions.reduce((acc, t) => {
            const curr = t.currency
            if (!acc[curr]) acc[curr] = 0
            const amount = Number(t.amount)
            if (t.type === 'INCOME') acc[curr] += amount
            if (t.type === 'EXPENSE') acc[curr] -= amount
            return acc
        }, {} as Record<string, number>)

        monthlyData.push({
            month: date.toLocaleDateString('es-AR', { month: 'short', year: 'numeric' }),
            ARS: monthBalance.ARS || 0,
            USD: monthBalance.USD || 0,
        })
    }

    // Get annual summary for the target year
    const yearStart = new Date(targetYear, 0, 1)
    const yearEnd = new Date(targetYear, 11, 31, 23, 59, 59, 999)

    const yearTransactions = await prisma.transaction.findMany({
        where: {
            organizationId: profile.organizationId,
            date: {
                gte: yearStart,
                lte: yearEnd,
            }
        },
        select: {
            amount: true,
            currency: true,
            type: true,
        }
    })

    const annualSummary = yearTransactions.reduce((acc, t) => {
        const curr = t.currency
        if (!acc[curr]) acc[curr] = { income: 0, expense: 0, balance: 0 }
        const amount = Number(t.amount)
        if (t.type === 'INCOME') {
            acc[curr].income += amount
            acc[curr].balance += amount
        }
        if (t.type === 'EXPENSE') {
            acc[curr].expense += amount
            acc[curr].balance -= amount
        }
        return acc
    }, {} as Record<string, { income: number, expense: number, balance: number }>)

    return {
        currentBalance: {
            ARS: balances.ARS || 0,
            USD: balances.USD || 0,
        },
        monthlyEvolution: monthlyData,
        annualSummary: {
            ARS: annualSummary.ARS || { income: 0, expense: 0, balance: 0 },
            USD: annualSummary.USD || { income: 0, expense: 0, balance: 0 },
        },
        lastUpdated: new Date(),
    }
}

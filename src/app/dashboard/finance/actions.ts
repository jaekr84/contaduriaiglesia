'use server'

import { revalidatePath } from 'next/cache'
import prisma from '@/lib/prisma'
import { requireProfile } from '@/lib/auth'
import { Prisma, TransactionType, PaymentMethod, Currency } from '@prisma/client'

interface FinanceFilters {
    dateFrom?: string
    dateTo?: string
    type?: string
    categoryId?: string
    memberId?: string
    query?: string
}

async function buildWhereClause(profile: any, filters?: FinanceFilters): Promise<Prisma.TransactionWhereInput> {
    const where: Prisma.TransactionWhereInput = {
        organizationId: profile.organizationId,
    }

    if (filters?.dateFrom || filters?.dateTo) {
        where.date = {}
        if (filters.dateFrom) where.date.gte = new Date(filters.dateFrom)
        if (filters.dateTo) {
            // Add time to include the full end day
            const endDate = new Date(filters.dateTo)
            endDate.setHours(23, 59, 59, 999)
            where.date.lte = endDate
        }
    }

    if (filters?.type && filters.type !== '') {
        where.type = filters.type as TransactionType
    }

    if (filters?.categoryId && filters.categoryId !== '') {
        // If filtering by a category, we want to include its subcategories too
        // 1. Fetch subcategories
        const subcategories = await prisma.category.findMany({
            where: {
                parentId: filters.categoryId,
                organizationId: profile.organizationId
            },
            select: { id: true }
        })

        const categoryIds = [filters.categoryId, ...subcategories.map(c => c.id)]

        where.categoryId = { in: categoryIds }
    }

    if (filters?.memberId && filters.memberId !== '') {
        where.memberId = filters.memberId
    }

    if (filters?.query) {
        where.OR = [
            { description: { contains: filters.query, mode: 'insensitive' } },
            { category: { name: { contains: filters.query, mode: 'insensitive' } } },
            {
                member: {
                    OR: [
                        { firstName: { contains: filters.query, mode: 'insensitive' } },
                        { lastName: { contains: filters.query, mode: 'insensitive' } }
                    ]
                }
            }
        ]
    }

    return where
}

export async function getTransactions(filters?: FinanceFilters) {
    const profile = await requireProfile()
    let where = await buildWhereClause(profile, filters)

    // Apply default month filter ONLY if no date range is specified in filters
    if (!filters?.dateFrom && !filters?.dateTo) {
        const now = new Date()
        const firstDay = new Date(now.getFullYear(), now.getMonth(), 1)
        const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)

        where.date = {
            gte: firstDay,
            lte: lastDay,
        }
    }

    const transactions = await prisma.transaction.findMany({
        where,
        include: {
            category: {
                include: { parent: true }
            },
            member: true,
            createdBy: true,
        },
        orderBy: { date: 'desc' },
        take: 200, // Increased from 50 to 200 for better coverage within a month
    })

    return transactions
}

export async function getCategories() {
    const profile = await requireProfile()

    // Fetch all categories including subcategories
    return await prisma.category.findMany({
        where: { organizationId: profile.organizationId },
        orderBy: { name: 'asc' },
        include: { subcategories: true }
    })
}

export async function getFinanceSummary(filters?: FinanceFilters) {
    const profile = await requireProfile()

    // If no specific date filter is provided, default to current month for the summary
    // BUT if other filters are present (e.g. category), we might want to respect that without date?
    // User expectation: "If I select 'Tithing', show me total tithing ever?" or "Total tithing this month?"
    // Usually dashboards default to "This Month" unless specified.

    let where = await buildWhereClause(profile, filters)

    // Apply default month filter ONLY if no date range is specified in filters
    if (!filters?.dateFrom && !filters?.dateTo) {
        const now = new Date()
        const firstDay = new Date(now.getFullYear(), now.getMonth(), 1)
        const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0)

        where.date = {
            gte: firstDay,
            lte: lastDay,
        }
    }

    const transactions = await prisma.transaction.findMany({
        where
    })

    const totals = {
        ARS: { income: 0, expense: 0 },
        USD: { income: 0, expense: 0 }
    }

    transactions.forEach(t => {
        const curr = t.currency || 'ARS' // Default to ARS for old data if any
        if (t.type === 'INCOME') totals[curr].income += Number(t.amount)
        if (t.type === 'EXPENSE') totals[curr].expense += Number(t.amount)
    })

    return {
        ARS: {
            income: totals.ARS.income,
            expense: totals.ARS.expense,
            balance: totals.ARS.income - totals.ARS.expense
        },
        USD: {
            income: totals.USD.income,
            expense: totals.USD.expense,
            balance: totals.USD.income - totals.USD.expense
        }
    }
}

export async function createTransaction(formData: FormData) {
    const profile = await requireProfile()

    const amount = parseFloat(formData.get('amount') as string)
    const description = (formData.get('description') as string)?.trim() || null
    // Handle both date formats: "YYYY-MM-DD" (date input) or "YYYY-MM-DDTHH:mm" (datetime-local input)
    const dateStr = formData.get('date') as string
    let date: Date
    if (dateStr.includes('T')) {
        // Has time component
        date = new Date(dateStr + '-03:00')
    } else {
        // Only date, use current time in Argentina timezone
        const now = new Date()
        const argTime = new Date(now.toLocaleString('en-US', { timeZone: 'America/Argentina/Buenos_Aires' }))
        const hours = argTime.getHours().toString().padStart(2, '0')
        const minutes = argTime.getMinutes().toString().padStart(2, '0')
        const seconds = argTime.getSeconds().toString().padStart(2, '0')
        date = new Date(`${dateStr}T${hours}:${minutes}:${seconds}-03:00`)
    }
    const type = formData.get('type') as TransactionType
    const categoryId = formData.get('categoryId') as string
    const memberId = (formData.get('memberId') as string) || null
    const paymentMethod = formData.get('paymentMethod') as PaymentMethod
    const currency = (formData.get('currency') as Currency) || 'ARS'

    if (isNaN(amount) || amount <= 0) {
        return { error: 'El monto debe ser mayor a 0' }
    }

    try {
        await prisma.transaction.create({
            data: {
                amount,
                description,
                date,
                type,
                paymentMethod,
                categoryId,
                memberId: memberId === 'none' ? null : memberId,
                createdById: profile.id,
                organizationId: profile.organizationId,
                currency,
            },
        })
        revalidatePath('/dashboard/finance')
        return { success: true }
    } catch (error) {
        console.error(error)
        return { error: 'Error al crear transacción' }
    }
}

export async function createCategory(formData: FormData) {
    const profile = await requireProfile()
    const rawName = (formData.get('name') as string)
    const type = formData.get('type') as TransactionType
    const parentId = (formData.get('parentId') as string) || null

    // Split by comma and clean up
    const names = rawName.split(',').map(n => n.trim()).filter(n => n.length > 0)

    if (names.length === 0) return { error: 'Nombre inválido' }

    try {
        const newCategories = await prisma.$transaction(
            names.map(name => prisma.category.create({
                data: {
                    name,
                    type,
                    parentId: parentId === 'none' ? null : parentId,
                    organizationId: profile.organizationId
                }
            }))
        )
        revalidatePath('/dashboard/finance')
        revalidatePath('/dashboard/finance/categories')
        return { success: true, category: newCategories[0] }
    } catch (e) {
        console.error(e)
        return { error: 'Error al crear categoría(s)' }
    }
}

export async function deleteCategory(id: string) {
    const profile = await requireProfile()

    try {
        // Check if used in transactions
        const usageCount = await prisma.transaction.count({ where: { categoryId: id } })
        if (usageCount > 0) return { error: 'Tiene movimientos asociados.' }

        // Check if has subcategories
        const subCount = await prisma.category.count({ where: { parentId: id } })
        if (subCount > 0) return { error: 'Tiene subcategorías.' }

        await prisma.category.delete({
            where: { id, organizationId: profile.organizationId }
        })

        revalidatePath('/dashboard/finance')
        revalidatePath('/dashboard/finance/categories')
        return { success: true }
    } catch (e) {
        return { error: 'Error al eliminar' }
    }
}

export async function bulkDeleteCategories(ids: string[]) {
    const profile = await requireProfile()

    try {
        // 1. Check usage for ALL
        const usageCount = await prisma.transaction.count({
            where: { categoryId: { in: ids }, organizationId: profile.organizationId }
        })
        if (usageCount > 0) return { error: 'Algunas categorías tienen movimientos y no pueden eliminarse.' }

        // 2. Check subcategories for ALL (orphaning)
        // If we delete a parent that is in the list, we must ensure its children are ALSO in the list or handle them.
        // For simplicity: Fail if any selected category has children NOT in the list?
        // Actually, Prisma might error on FK constraint if we delete parent first.
        // Let's just check if ANY has children.
        // If we delete parent and child together, order matters, but `deleteMany` usually handles simple cases or errors.
        // Safer: Check if any of these have children that are NOT in the list.
        const childrenCount = await prisma.category.count({
            where: { parentId: { in: ids }, id: { notIn: ids } }
        })
        if (childrenCount > 0) return { error: 'Algunas categorías tienen subcategorías que no se están eliminando.' }

        // Delete
        await prisma.category.deleteMany({
            where: { id: { in: ids }, organizationId: profile.organizationId }
        })

        revalidatePath('/dashboard/finance')
        revalidatePath('/dashboard/finance/categories')
        return { success: true }
    } catch (e) {
        return { error: 'Error al eliminar categorías' }
    }
}

export async function updateCategory(id: string, formData: FormData) {
    const profile = await requireProfile()
    const name = (formData.get('name') as string).trim()

    try {
        await prisma.category.update({
            where: { id, organizationId: profile.organizationId },
            data: { name }
        })
        revalidatePath('/dashboard/finance')
        revalidatePath('/dashboard/finance/categories')
        return { success: true }
    } catch (e) {
        return { error: 'Error al actualizar' }
    }
}

export async function createExchange(formData: FormData) {
    const profile = await requireProfile()

    const amountOut = parseFloat(formData.get('amountOut') as string)
    const currencyOut = formData.get('currencyOut') as Currency
    const amountIn = parseFloat(formData.get('amountIn') as string)
    const currencyIn = formData.get('currencyIn') as Currency
    const dateStr = formData.get('date') as string
    const date = new Date(dateStr + '-03:00')

    if (isNaN(amountOut) || amountOut <= 0 || isNaN(amountIn) || amountIn <= 0) {
        return { error: 'Los montos deben ser mayores a 0' }
    }
    if (currencyOut === currencyIn) {
        return { error: 'Las monedas deben ser diferentes' }
    }

    // Validate bounds: Cannot exchange more than available balance
    const incomeSum = await prisma.transaction.aggregate({
        where: {
            organizationId: profile.organizationId,
            currency: currencyOut,
            type: 'INCOME'
        },
        _sum: { amount: true }
    })
    const expenseSum = await prisma.transaction.aggregate({
        where: {
            organizationId: profile.organizationId,
            currency: currencyOut,
            type: 'EXPENSE'
        },
        _sum: { amount: true }
    })

    const totalIncome = Number(incomeSum._sum.amount || 0)
    const totalExpense = Number(expenseSum._sum.amount || 0)
    const currentBalance = totalIncome - totalExpense

    if (amountOut > currentBalance) {
        return { error: `Fondos insuficientes en ${currencyOut}. Disponible: ${currentBalance.toLocaleString('es-AR')}` }
    }

    try {
        await prisma.$transaction(async (tx) => {
            const catName = 'Intercambio de Moneda'

            let expenseCat = await tx.category.findFirst({
                where: { name: catName, type: 'EXPENSE', organizationId: profile.organizationId }
            })
            if (!expenseCat) {
                expenseCat = await tx.category.create({
                    data: { name: catName, type: 'EXPENSE', organizationId: profile.organizationId }
                })
            }

            let incomeCat = await tx.category.findFirst({
                where: { name: catName, type: 'INCOME', organizationId: profile.organizationId }
            })
            if (!incomeCat) {
                incomeCat = await tx.category.create({
                    data: { name: catName, type: 'INCOME', organizationId: profile.organizationId }
                })
            }

            const description = `Cambio: ${amountOut} ${currencyOut} -> ${amountIn} ${currencyIn}`

            await tx.transaction.create({
                data: {
                    amount: amountOut,
                    currency: currencyOut,
                    type: 'EXPENSE',
                    categoryId: expenseCat.id,
                    date: date,
                    description: description,
                    paymentMethod: 'CASH',
                    organizationId: profile.organizationId,
                    createdById: profile.id,
                }
            })

            await tx.transaction.create({
                data: {
                    amount: amountIn,
                    currency: currencyIn,
                    type: 'INCOME',
                    categoryId: incomeCat.id,
                    date: date,
                    description: description,
                    paymentMethod: 'CASH',
                    organizationId: profile.organizationId,
                    createdById: profile.id,
                }
            })
        })

        revalidatePath('/dashboard/finance')
        return { success: true }
    } catch (error) {
        console.error(error)
        return { error: 'Error al registrar el cambio' }
    }
}

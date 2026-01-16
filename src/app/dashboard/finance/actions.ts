'use server'

import { revalidatePath } from 'next/cache'
import prisma from '@/lib/prisma'
import { requireProfile } from '@/lib/auth'
import { Prisma, TransactionType, PaymentMethod } from '@prisma/client'

export async function getTransactions(query?: string) {
    const profile = await requireProfile()

    const where: Prisma.TransactionWhereInput = {
        organizationId: profile.organizationId,
        ...(query
            ? {
                OR: [
                    { description: { contains: query, mode: 'insensitive' } },
                    { category: { name: { contains: query, mode: 'insensitive' } } },
                    {
                        member: {
                            OR: [
                                { firstName: { contains: query, mode: 'insensitive' } },
                                { lastName: { contains: query, mode: 'insensitive' } }
                            ]
                        }
                    }
                ],
            }
            : {}),
    }

    const transactions = await prisma.transaction.findMany({
        where,
        include: {
            category: true,
            member: true,
        },
        orderBy: { date: 'desc' },
        take: 50, // Limit for now
    })

    return transactions
}

export async function getCategories() {
    const profile = await requireProfile()

    const count = await prisma.category.count({
        where: { organizationId: profile.organizationId }
    })

    if (count === 0) {
        // Seed default categories
        const defaults = [
            { name: 'Diezmos', type: 'INCOME' },
            { name: 'Ofrendas', type: 'INCOME' },
            { name: 'Donaciones', type: 'INCOME' },
            { name: 'Eventos', type: 'INCOME' },
            { name: 'Alquiler', type: 'EXPENSE' },
            { name: 'Servicios (Luz/Agua/Gas)', type: 'EXPENSE' },
            { name: 'Mantenimiento', type: 'EXPENSE' },
            { name: 'Ayuda Social', type: 'EXPENSE' },
            { name: 'Sueldos/Honorarios', type: 'EXPENSE' },
            { name: 'Otros', type: 'EXPENSE' },
        ]

        await prisma.$transaction(
            defaults.map(cat => prisma.category.create({
                data: {
                    name: cat.name,
                    type: cat.type as TransactionType,
                    organizationId: profile.organizationId
                }
            }))
        )
    }

    // Fetch all categories including subcategories
    return await prisma.category.findMany({
        where: { organizationId: profile.organizationId },
        orderBy: { name: 'asc' },
        include: { subcategories: true }
    })
}

export async function getFinanceSummary() {
    const profile = await requireProfile()

    // This month's date range
    const now = new Date()
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1)
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0)

    const transactions = await prisma.transaction.findMany({
        where: {
            organizationId: profile.organizationId,
            date: {
                gte: firstDay,
                lte: lastDay,
            }
        }
    })

    let income = 0;
    let expense = 0;

    transactions.forEach(t => {
        if (t.type === 'INCOME') income += Number(t.amount)
        if (t.type === 'EXPENSE') expense += Number(t.amount)
    })

    return {
        income,
        expense,
        balance: income - expense
    }
}

export async function createTransaction(formData: FormData) {
    const profile = await requireProfile()

    const amount = parseFloat(formData.get('amount') as string)
    const description = (formData.get('description') as string)?.trim() || null
    const date = new Date(formData.get('date') as string)
    const type = formData.get('type') as TransactionType
    const categoryId = formData.get('categoryId') as string
    const memberId = (formData.get('memberId') as string) || null
    const paymentMethod = formData.get('paymentMethod') as PaymentMethod

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
        await prisma.$transaction(
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
        return { success: true }
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

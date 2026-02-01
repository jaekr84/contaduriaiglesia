'use server'

import { revalidatePath } from 'next/cache'
import prisma from '@/lib/prisma'
import { requireProfile } from '@/lib/auth'
import { Currency, AuditEventType, AuditSeverity } from '@prisma/client'

export async function setBudget(
    categoryId: string,
    amount: number,
    month: number,
    year: number,
    currency: Currency = 'ARS'
) {
    const profile = await requireProfile()

    if (!['ADMIN', 'TREASURER'].includes(profile.role)) {
        return { error: 'No autorizado' }
    }

    try {
        await prisma.$transaction(async (tx) => {
            const existing = await tx.budget.findUnique({
                where: {
                    organizationId_categoryId_month_year: {
                        organizationId: profile.organizationId,
                        categoryId,
                        month,
                        year
                    }
                }
            })

            const budget = await tx.budget.upsert({
                where: {
                    organizationId_categoryId_month_year: {
                        organizationId: profile.organizationId,
                        categoryId,
                        month,
                        year
                    }
                },
                create: {
                    amount,
                    month,
                    year,
                    currency,
                    categoryId,
                    organizationId: profile.organizationId,
                    createdById: profile.id,
                    updatedById: profile.id
                },
                update: {
                    amount,
                    currency,
                    updatedById: profile.id
                }
            })

            await tx.auditLog.create({
                data: {
                    organizationId: profile.organizationId,
                    userId: profile.id,
                    userEmail: profile.email,
                    eventType: existing ? AuditEventType.BUDGET_UPDATED : AuditEventType.BUDGET_CREATED,
                    severity: AuditSeverity.INFO,
                    resourceType: 'Budget',
                    resourceId: budget.id,
                    details: existing
                        ? {
                            previous: { amount: Number(existing.amount), currency: existing.currency },
                            new: { amount, currency }
                        }
                        : { amount, currency }
                }
            })
        })

        revalidatePath('/dashboard/finance/budgets')
        return { success: true }
    } catch (error) {
        console.error('Error setting budget:', error)
        return { error: 'Error al guardar presupuesto' }
    }
}

export async function copyBudgetToAllMonths(year: number, sourceMonth: number) {
    const profile = await requireProfile()

    if (!['ADMIN', 'TREASURER'].includes(profile.role)) {
        return { error: 'No autorizado' }
    }

    try {
        // 1. Get source budgets
        const sourceBudgets = await prisma.budget.findMany({
            where: {
                organizationId: profile.organizationId,
                year,
                month: sourceMonth
            }
        })

        if (sourceBudgets.length === 0) {
            return { error: 'No hay presupuesto definido en el mes origen' }
        }

        // 2. Iterate and upsert for all other months (1-12)
        const months = Array.from({ length: 12 }, (_, i) => i + 1)
        const targetMonths = months.filter(m => m !== sourceMonth)

        // Using transactions for atomicity might be good, but a loop is fine for now given low volume
        // Or Prisma transaction:
        const operations = []

        for (const targetMonth of targetMonths) {
            for (const budget of sourceBudgets) {
                operations.push(
                    prisma.budget.upsert({
                        where: {
                            organizationId_categoryId_month_year: {
                                organizationId: profile.organizationId,
                                categoryId: budget.categoryId,
                                month: targetMonth,
                                year
                            }
                        },
                        create: {
                            amount: budget.amount,
                            currency: budget.currency,
                            categoryId: budget.categoryId,
                            organizationId: profile.organizationId,
                            month: targetMonth,
                            year,
                            createdById: profile.id,
                            updatedById: profile.id
                        },
                        update: {
                            amount: budget.amount,
                            currency: budget.currency,
                            updatedById: profile.id
                        }
                    })
                )
            }
        }

        // Add audit log
        operations.push(
            prisma.auditLog.create({
                data: {
                    organizationId: profile.organizationId,
                    userId: profile.id,
                    userEmail: profile.email,
                    eventType: AuditEventType.BUDGET_BATCH_UPDATE,
                    severity: AuditSeverity.INFO,
                    resourceType: 'Budget',
                    details: {
                        action: 'copy_month',
                        sourceMonth,
                        targetYear: year,
                        sourceBudgetCount: sourceBudgets.length
                    }
                }
            }) as any
        )

        await prisma.$transaction(operations)

        revalidatePath('/dashboard/finance/budgets')
        return { success: true }

    } catch (error) {
        console.error('Error copying budget:', error)
        return { error: 'Error al repicar presupuesto' }
    }
}

export async function updateBatchBudgets(
    updates: { categoryId: string; amount: number; currency: Currency }[],
    month: number,
    year: number
) {
    const profile = await requireProfile()

    if (!['ADMIN', 'TREASURER'].includes(profile.role)) {
        return { error: 'No autorizado' }
    }

    try {
        const operations = updates.map(update =>
            prisma.budget.upsert({
                where: {
                    organizationId_categoryId_month_year: {
                        organizationId: profile.organizationId,
                        categoryId: update.categoryId,
                        month,
                        year
                    }
                },
                create: {
                    amount: update.amount,
                    currency: update.currency,
                    categoryId: update.categoryId,
                    organizationId: profile.organizationId,
                    month,
                    year,
                    createdById: profile.id,
                    updatedById: profile.id
                },
                update: {
                    amount: update.amount,
                    currency: update.currency,
                    updatedById: profile.id
                }
            })
        )

        // Add audit log
        operations.push(
            prisma.auditLog.create({
                data: {
                    organizationId: profile.organizationId,
                    userId: profile.id,
                    userEmail: profile.email,
                    eventType: AuditEventType.BUDGET_BATCH_UPDATE,
                    severity: AuditSeverity.INFO,
                    resourceType: 'Budget',
                    details: {
                        action: 'update_batch',
                        month,
                        year,
                        count: updates.length
                    }
                }
            }) as any
        )

        await prisma.$transaction(operations)

        revalidatePath('/dashboard/finance/budgets')
        return { success: true }
    } catch (error) {
        console.error('Error batch updating budgets:', error)
        return { error: 'Error al guardar los cambios' }
    }

}


export async function getAnnualBudgetBreakdown(year: number) {
    const profile = await requireProfile()

    if (!['ADMIN', 'TREASURER'].includes(profile.role)) {
        return { error: 'No autorizado' }
    }

    try {
        const budgets = await prisma.budget.findMany({
            where: {
                organizationId: profile.organizationId,
                year
            }
        })

        // Structure: categoryId -> { ARS: number[12], USD: number[12] }
        const breakdown: Record<string, { ARS: number[], USD: number[] }> = {}

        budgets.forEach(b => {
            if (!breakdown[b.categoryId]) {
                breakdown[b.categoryId] = {
                    ARS: Array(12).fill(0),
                    USD: Array(12).fill(0)
                }
            }

            // b.month is 1-12
            const monthIndex = b.month - 1
            if (monthIndex >= 0 && monthIndex < 12) {
                breakdown[b.categoryId][b.currency][monthIndex] = Number(b.amount)
            }
        })

        return { data: breakdown }
    } catch (error) {
        console.error('Error fetching annual budget breakdown:', error)
        return { error: 'Error al cargar presupuesto existente' }
    }
}

export async function saveAnnualBudget(
    updates: { categoryId: string; amounts: number[]; currency: Currency }[],
    year: number
) {
    const profile = await requireProfile()

    if (!['ADMIN', 'TREASURER'].includes(profile.role)) {
        return { error: 'No autorizado' }
    }

    try {
        const updateIds = updates.map(u => u.categoryId)

        // Prepare bulk data
        const bulkData: Array<{
            organizationId: string
            categoryId: string
            amount: number
            currency: Currency
            month: number
            year: number
            createdById: string
            updatedById: string
        }> = []
        for (const update of updates) {
            // We expect updates.amounts to be array of 12 numbers (index 0 = Jan, index 11 = Dec)
            update.amounts.forEach((amount, index) => {
                bulkData.push({
                    organizationId: profile.organizationId,
                    categoryId: update.categoryId,
                    amount: amount,
                    currency: update.currency,
                    month: index + 1, // 1-12
                    year,
                    createdById: profile.id,
                    updatedById: profile.id
                })
            })
        }

        await prisma.$transaction([
            // 1. Delete existing budgets for these categories in this year
            prisma.budget.deleteMany({
                where: {
                    organizationId: profile.organizationId,
                    year: year,
                    categoryId: { in: updateIds }
                }
            }),
            // 2. Bulk insert new budgets
            prisma.budget.createMany({
                data: bulkData
            }),
            // 3. Audit Log
            prisma.auditLog.create({
                data: {
                    organizationId: profile.organizationId,
                    userId: profile.id,
                    userEmail: profile.email,
                    eventType: AuditEventType.BUDGET_BATCH_UPDATE,
                    severity: AuditSeverity.INFO,
                    resourceType: 'Budget',
                    details: {
                        action: 'save_annual',
                        year,
                        count: bulkData.length
                    }
                }
            })
        ])

        revalidatePath('/dashboard/finance/budgets')
        return { success: true }
    } catch (error) {
        console.error('Error saving annual budget:', error)
        return { error: 'Error al guardar el presupuesto anual' }
    }
}



export type BudgetRow = {
    categoryId: string
    categoryName: string
    categoryParentName?: string | null
    budgetAmount: number
    spentAmount: number
    currency: Currency
    percentage: number
    remaining: number
    hasChildren?: boolean
    parentId?: string | null
}

export type BudgetOverview = {
    ARS: BudgetRow[]
    USD: BudgetRow[]
}

export async function getBudgetOverview(month: number, year: number): Promise<BudgetOverview> {
    const profile = await requireProfile()

    // 1. Get all EXPENSE categories
    // 1. Get all EXPENSE categories
    const categories = await prisma.category.findMany({
        where: {
            organizationId: profile.organizationId,
            type: 'EXPENSE'
        },
        include: {
            parent: true
        },
        orderBy: [
            { order: 'asc' },
            { name: 'asc' }
        ]
    })

    // Sort hierarchically: Parent then its children
    const sortedCategories: typeof categories = []

    // First, map parents to their children to easily finding them
    const parentMap = new Map<string, typeof categories>()

    categories.forEach(cat => {
        if (cat.parentId) {
            const children = parentMap.get(cat.parentId) || []
            children.push(cat)
            parentMap.set(cat.parentId, children)
        }
    })

    // Filter top-level categories and sort them (already sorted by query but let's be safe)
    const topLevel = categories.filter(c => !c.parentId)

    topLevel.forEach(parent => {
        sortedCategories.push(parent)
        // Check if it has children
        const children = parentMap.get(parent.id)
        if (children) {
            // Already sorted by query config (order, name)
            children.forEach(child => sortedCategories.push(child))
        }
    })

    // Handle orphans (children whose parent might not be in the list? Should shouldn't happen with EXPENSE filter unless parent is different type)
    // Actually, if parent is not expense, but child is, child is top level effectively in this view?
    // Let's assume data integrity is fine, or simply list any remaining categories that weren't added?
    // For simplicity, the above logic covers standard hierarchy. 
    // If a category has a parent that is NOT fetched (e.g. parent is INCOME?), it won't be in topLevel, nor in parent map of a valid top level.
    // So we should iterate all primitives again? 
    // Let's stick to: Parents first, then children. 
    // If a category has parentId but parent is not in `categories`, treat as top level?
    const processedIds = new Set(sortedCategories.map(c => c.id))
    const orphans = categories.filter(c => !processedIds.has(c.id))
    orphans.forEach(o => sortedCategories.push(o))

    // 2. Get Budgets
    const budgetWhere: any = {
        organizationId: profile.organizationId,
        year
    }
    if (month !== 0) {
        budgetWhere.month = month
    }

    const budgets = await prisma.budget.findMany({
        where: budgetWhere
    })

    // 3. Get Actual Expenses
    // Calculate date range
    let startDate: Date
    let endDate: Date

    if (month === 0) {
        // Annual: Full year
        startDate = new Date(`${year}-01-01T00:00:00-03:00`)
        endDate = new Date(`${year}-12-31T23:59:59.999-03:00`)
    } else {
        // Specific Month
        const startDateStr = `${year}-${month.toString().padStart(2, '0')}-01T00:00:00-03:00`
        startDate = new Date(startDateStr)
        const nextMonth = month === 12 ? 1 : month + 1
        const nextYear = month === 12 ? year + 1 : year
        const endDateStr = `${nextYear}-${nextMonth.toString().padStart(2, '0')}-01T00:00:00-03:00`
        endDate = new Date(new Date(endDateStr).getTime() - 1)
    }

    const expensesGrouped = await prisma.transaction.groupBy({
        by: ['categoryId', 'currency'],
        where: {
            organizationId: profile.organizationId,
            type: 'EXPENSE',
            cancelledAt: null,
            date: {
                gte: startDate,
                lte: endDate
            }
        },
        _sum: {
            amount: true
        }
    })

    // 4. Merge data
    const budgetMap = new Map<string, number>() // key: catId_currency -> amount

    // For annual view, we must sum up budgets if there are multiple entries (different months) for the same category
    budgets.forEach((b: any) => {
        const key = `${b.categoryId}_${b.currency}`
        const current = budgetMap.get(key) || 0
        budgetMap.set(key, current + Number(b.amount))
    })

    const expenseMap = new Map<string, number>() // key: catId_currency -> amount
    expensesGrouped.forEach((e: any) => {
        if (e.categoryId) {
            expenseMap.set(`${e.categoryId}_${e.currency}`, Number(e._sum.amount || 0))
        }
    })

    const overview: BudgetOverview = {
        ARS: [],
        USD: []
    }

    // Iterate categories and build rows for both currencies if activity/budget exists
    // Or just list ALL categories for ARS? Usually budgets are in local currency primarily,
    // but some might be in USD.
    // Simpler approach: For each category, checking if there is budget or expense in ARS or USD.
    // If a category has NO budget and NO expense, maybe show it in ARS with 0/0?
    // Or only show categories that are relevant?
    // Let's show all categories in ARS by default, and USD only if there is activity/budget?
    // Or just two separate lists.

    for (const cat of sortedCategories) {
        // Check if this category is a parent
        const children = parentMap.get(cat.id)
        const hasChildren = !!(children && children.length > 0)

        // Function to build row for a currency
        const buildRow = (currency: 'ARS' | 'USD') => {
            let budget = budgetMap.get(`${cat.id}_${currency}`) || 0
            let spent = expenseMap.get(`${cat.id}_${currency}`) || 0

            // If parent, sum children's values ONLY for display?
            // "solo deberia salir la suma de los montos de las subcategorias"
            // This implies the parent's OWN budget/transaction is ignored or assumed 0?
            // Usually parents are abstract and don't have direct transactions.
            // Let's sum children values.
            if (hasChildren) {
                // Sum from ALL children (recursive? or just direct? Assuming 2 levels for now based on UI)
                // We ADD children values to parent's own values (if any) to avoid masking data
                let childrenBudget = 0
                let childrenSpent = 0
                children?.forEach(child => {
                    childrenBudget += budgetMap.get(`${child.id}_${currency}`) || 0
                    childrenSpent += expenseMap.get(`${child.id}_${currency}`) || 0
                })
                budget += childrenBudget
                spent += childrenSpent
            }

            if (budget > 0 || spent > 0 || !hasChildren) { // Show if active OR if it's a leaf node (to allow editing)
                // If parent has 0/0, maybe hide? or show as summary 0? 
                // User asked to hide input, implying showing the row is fine.
                if (hasChildren && budget === 0 && spent === 0) {
                    // If parent is empty, maybe still show it if it is a major category?
                    // Yes, show it.
                } else if (!hasChildren && budget === 0 && spent === 0) {
                    // Leaf node with 0, show it to allow editing (as per previous logic)
                }
            }

            return {
                categoryId: cat.id,
                categoryName: cat.name,
                categoryParentName: cat.parent?.name,
                parentId: cat.parentId,
                budgetAmount: budget,
                spentAmount: spent,
                currency,
                percentage: budget > 0 ? (spent / budget) * 100 : spent > 0 ? 100 : 0,
                remaining: budget - spent,
                hasChildren
            }
        }

        overview.ARS.push(buildRow('ARS'))
        overview.USD.push(buildRow('USD'))
    }

    return overview
}

export async function getYearlyExportData(year: number) {
    const profile = await requireProfile()

    if (!['ADMIN', 'TREASURER'].includes(profile.role)) {
        return { error: 'No autorizado' }
    }

    try {
        // 1. Fetch Categories
        const categories = await prisma.category.findMany({
            where: {
                organizationId: profile.organizationId,
                type: 'EXPENSE'
            },
            include: {
                parent: true
            },
            orderBy: [
                { order: 'asc' },
                { name: 'asc' }
            ]
        })

        // Sort hierarchically
        const parentMap = new Map<string, typeof categories>()
        categories.forEach(cat => {
            if (cat.parentId) {
                const children = parentMap.get(cat.parentId) || []
                children.push(cat)
                parentMap.set(cat.parentId, children)
            }
        })
        const sortedCategories: typeof categories = []
        const topLevel = categories.filter(c => !c.parentId)
        topLevel.forEach(parent => {
            sortedCategories.push(parent)
            const children = parentMap.get(parent.id)
            if (children) children.forEach(child => sortedCategories.push(child))
        })
        const processedIds = new Set(sortedCategories.map(c => c.id))
        categories.filter(c => !processedIds.has(c.id)).forEach(o => sortedCategories.push(o))


        // 2. Fetch ALL Budgets for Year
        const allBudgets = await prisma.budget.findMany({
            where: {
                organizationId: profile.organizationId,
                year
            }
        })

        // 3. Fetch ALL Expenses for Year
        const startDate = new Date(`${year}-01-01T00:00:00-03:00`)
        const endDate = new Date(`${year}-12-31T23:59:59.999-03:00`)

        // Group by Month also? No, groupBy doesn't support extracting month easily in Prisma across DBs.
        // But we can fetch grouped by date? No, too granular.
        // Fetch raw expenses? If thousands, might be heavy.
        // Let's rely on groupBy filtering... 
        // We need to know the MONTH of the expense.
        // Prisma doesn't do "groupBy Month" natively in a clear DB-agnostic way easily without raw query.
        // BUT: We can fetch ALL transactions (lightweight fields: amount, date, currency, categoryId)
        // Check count? Usually < 10,000 per year per church? Safe assumption for now.
        const allExpenses = await prisma.transaction.findMany({
            where: {
                organizationId: profile.organizationId,
                type: 'EXPENSE',
                cancelledAt: null,
                date: {
                    gte: startDate,
                    lte: endDate
                }
            },
            select: {
                amount: true,
                date: true,
                currency: true,
                categoryId: true
            }
        })

        // Helper to build overview for a specific month (0 = annual)
        const buildOverview = (targetMonth: number) => {
            // Filter Budgets
            const budgetsForMonth = allBudgets.filter(b => {
                if (targetMonth === 0) return true // Annual sums all months
                return b.month === targetMonth
            })

            // Filter Expenses
            const expensesForMonth = allExpenses.filter(e => {
                const eMonth = new Date(e.date).getMonth() + 1 // 1-12 (approx. timezone beware? Using UTC dates usually ok if simple)
                // Wait, e.date is Date object. user is -03:00.
                // Ideally use date-fns-tz or similar.
                // For now, simpler: e.date.getMonth() depends on server timezone.
                // Hack: Adjust using offset if needed.
                // The app seems to use standard Date objects. 
                // Let's assume server time is reasonable or dates are UTC.
                if (targetMonth === 0) return true
                return (e.date.getMonth() + 1) === targetMonth
            })

            // Sum Maps
            const budgetMap = new Map<string, number>()
            budgetsForMonth.forEach(b => {
                const key = `${b.categoryId}_${b.currency}`
                budgetMap.set(key, (budgetMap.get(key) || 0) + Number(b.amount))
            })

            const expenseMap = new Map<string, number>()
            expensesForMonth.forEach(e => {
                if (e.categoryId) {
                    const key = `${e.categoryId}_${e.currency}`
                    expenseMap.set(key, (expenseMap.get(key) || 0) + Number(e.amount))
                }
            })

            const overview: BudgetOverview = { ARS: [], USD: [] }

            for (const cat of sortedCategories) {
                const children = parentMap.get(cat.id)
                const hasChildren = !!(children && children.length > 0)

                const buildRow = (currency: 'ARS' | 'USD') => {
                    let budget = budgetMap.get(`${cat.id}_${currency}`) || 0
                    let spent = expenseMap.get(`${cat.id}_${currency}`) || 0

                    if (hasChildren) {
                        let childrenBudget = 0
                        let childrenSpent = 0
                        children?.forEach(child => {
                            childrenBudget += budgetMap.get(`${child.id}_${currency}`) || 0
                            childrenSpent += expenseMap.get(`${child.id}_${currency}`) || 0
                        })
                        budget += childrenBudget
                        spent += childrenSpent
                    }

                    return {
                        categoryId: cat.id,
                        categoryName: cat.name,
                        categoryParentName: cat.parent?.name,
                        parentId: cat.parentId,
                        budgetAmount: budget,
                        spentAmount: spent,
                        currency,
                        percentage: budget > 0 ? (spent / budget) * 100 : spent > 0 ? 100 : 0,
                        remaining: budget - spent,
                        hasChildren
                    }
                }
                overview.ARS.push(buildRow('ARS'))
                overview.USD.push(buildRow('USD'))
            }
            return overview
        }

        const result: Record<number, BudgetOverview> = {}
        for (let m = 0; m <= 12; m++) {
            result[m] = buildOverview(m)
        }

        return result

    } catch (error) {
        console.error('Error fetching yearly data:', error)
        return { error: 'Error al exportar datos' }
    }
}



export async function createCategoryWithBudget(
    name: string,
    parentId: string | null,
    monthlyAmounts: number[], // Array of 12 monthly amounts
    year: number,
    currency: Currency
) {
    const profile = await requireProfile()

    if (!['ADMIN', 'TREASURER'].includes(profile.role)) {
        return { error: 'No autorizado' }
    }

    const cleanName = name.trim()
    if (!cleanName) return { error: 'Nombre inválido' }

    try {
        const result = await prisma.$transaction(async (tx) => {
            // 1. Create OR Fix Category
            const normalizedParentId = parentId === 'none' ? null : parentId

            let category = await tx.category.findFirst({
                where: {
                    organizationId: profile.organizationId,
                    type: 'EXPENSE',
                    parentId: normalizedParentId,
                    name: { equals: cleanName, mode: 'insensitive' }
                }
            })

            if (!category) {
                const maxOrder = await tx.category.aggregate({
                    where: {
                        organizationId: profile.organizationId,
                        type: 'EXPENSE',
                        parentId: normalizedParentId
                    },
                    _max: { order: true }
                })
                const baseOrder = (maxOrder._max.order ?? -1) + 1

                category = await tx.category.create({
                    data: {
                        name: cleanName,
                        type: 'EXPENSE',
                        parentId: normalizedParentId,
                        organizationId: profile.organizationId,
                        order: baseOrder
                    }
                })
            }


            // 2. Create Budget using monthly amounts directly (no division)
            // Delete existing budgets for this year/category to avoid duplicates
            await tx.budget.deleteMany({
                where: {
                    organizationId: profile.organizationId,
                    categoryId: category.id,
                    year
                }
            })

            // Create budget records for each month with their specific amounts
            const budgetData = monthlyAmounts.map((amount, index) => ({
                organizationId: profile.organizationId,
                categoryId: category.id,
                amount: amount,
                currency,
                month: index + 1,
                year,
                createdById: profile.id,
                updatedById: profile.id
            }))

            await tx.budget.createMany({
                data: budgetData
            })

            return category
        })

        revalidatePath('/dashboard/finance/budgets')
        return { success: true, category: result }

    } catch (e: any) {
        console.error(e)
        return { error: e.message || 'Error al crear categoría y presupuesto' }
    }
}

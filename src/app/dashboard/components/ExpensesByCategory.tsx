'use client'

import React from 'react'

interface ExpenseCategory {
    category: {
        id: string
        name: string
    }
    total: number
    subcategories: Record<string, {
        category: {
            id: string
            name: string
        }
        total: number
    }>
}

interface Props {
    expensesByCategory: ExpenseCategory[]
}

export function ExpensesByCategory({ expensesByCategory }: Props) {

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('es-AR', {
            style: 'currency',
            currency: 'ARS',
        }).format(amount)
    }

    const totalExpenses = expensesByCategory.reduce((sum, cat) => sum + cat.total, 0)

    if (expensesByCategory.length === 0) {
        return (
            <div className="rounded-lg border border-red-200 bg-red-50 p-8 shadow-sm dark:border-red-900/50 dark:bg-red-950/20">
                <p className="text-center text-zinc-500">No hay gastos registrados en este período.</p>
            </div>
        )
    }

    return (
        <div className="rounded-lg border border-red-200 bg-red-50 shadow-sm dark:border-red-900/50 dark:bg-red-950/20">
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead className="border-b border-zinc-200 dark:border-zinc-800">
                        <tr>
                            <th className="px-4 py-3 text-left text-sm font-medium text-zinc-500 dark:text-zinc-400">
                                Categoría
                            </th>
                            <th className="px-4 py-3 text-right text-sm font-medium text-zinc-500 dark:text-zinc-400">
                                Total
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                        {expensesByCategory.map((item) => {
                            const hasSubcategories = Object.keys(item.subcategories).length > 0

                            return (
                                <React.Fragment key={item.category.id}>
                                    {/* Parent Category Row */}
                                    <tr className="group">
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-2">
                                                <div className="w-4" />
                                                <span className="font-medium text-zinc-900 dark:text-zinc-50">
                                                    {item.category.name}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-right font-bold text-zinc-900 dark:text-zinc-50">
                                            {formatCurrency(item.total)}
                                        </td>
                                    </tr>
                                    {/* Subcategory Rows */}
                                    {hasSubcategories && Object.values(item.subcategories).map((sub) => (
                                        <tr key={sub.category.id} className="bg-zinc-50 dark:bg-zinc-900/30">
                                            <td className="px-4 py-2 pl-12">
                                                <span className="text-sm text-zinc-600 dark:text-zinc-400">
                                                    {sub.category.name}
                                                </span>
                                            </td>
                                            <td className="px-4 py-2 text-right text-sm font-medium text-zinc-900 dark:text-zinc-50">
                                                {formatCurrency(sub.total)}
                                            </td>
                                        </tr>
                                    ))}
                                </React.Fragment>
                            )
                        })}
                        {/* Total Row */}
                        <tr className="bg-zinc-50 dark:bg-zinc-900/50 font-bold">
                            <td className="px-4 py-3 text-zinc-900 dark:text-zinc-50">
                                Total General
                            </td>
                            <td className="px-4 py-3 text-right text-zinc-900 dark:text-zinc-50">
                                {formatCurrency(totalExpenses)}
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    )
}

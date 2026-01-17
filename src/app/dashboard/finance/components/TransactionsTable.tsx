'use client'

import { useState } from 'react'
import { formatDateTime } from '@/lib/utils'
import { formatCurrency } from '@/lib/dateUtils'
import { X, Plus } from 'lucide-react'
import { CancelTransactionDialog } from './CancelTransactionDialog'
import { QuickTransactionRow } from './QuickTransactionRow'
import { Category, Member } from '@prisma/client'
import { CreateCategoryDialog } from './CreateCategoryDialog'
import { CreateMemberDialog } from '../../members/components/CreateMemberDialog'

interface Transaction {
    id: string
    amount: number
    currency: string
    type: string
    description: string | null
    date: Date
    cancelledAt: Date | null
    category: {
        name: string
        parent: { name: string } | null
    }
    member: {
        firstName: string
        lastName: string
    } | null
    createdBy: {
        fullName: string | null
        email: string
    } | null
}

interface Props {
    transactions: Transaction[]
    userRole: string
    categories: Category[]
    members: Member[]
}

export function TransactionsTable({ transactions, userRole, categories, members }: Props) {
    const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null)

    const canCancel = userRole === 'ADMIN' || userRole === 'TREASURER'

    return (
        <>
            <div className="rounded-md border border-zinc-200 dark:border-zinc-800 overflow-hidden">
                <div className="relative w-full overflow-auto max-h-[600px]">
                    <table className="w-full caption-bottom text-sm text-left">
                        <thead className="sticky top-0 z-10 [&_tr]:border-b">
                            <tr className="border-b border-zinc-200 bg-zinc-50 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900">
                                <th className="h-12 px-4 align-middle font-medium text-zinc-600 dark:text-zinc-300">Fecha</th>
                                <th className="h-12 px-4 align-middle font-medium text-zinc-600 dark:text-zinc-300">Tipo</th>
                                <th className="h-12 px-4 align-middle font-medium text-zinc-600 dark:text-zinc-300">Categoría</th>
                                <th className="h-12 px-4 align-middle font-medium text-zinc-600 dark:text-zinc-300">Subcategoría</th>
                                <th className="h-12 px-4 align-middle font-medium text-zinc-600 dark:text-zinc-300 text-right">Monto</th>
                                <th className="h-12 px-4 align-middle font-medium text-zinc-600 dark:text-zinc-300">Descripción</th>
                                <th className="h-12 px-4 align-middle font-medium text-zinc-600 dark:text-zinc-300">Miembro</th>
                                <th className="h-12 px-4 align-middle font-medium text-zinc-600 dark:text-zinc-300">Registrado Por</th>
                                {canCancel && (
                                    <th className="h-12 px-4 align-middle font-medium text-zinc-600 dark:text-zinc-300 text-center">Acciones</th>
                                )}
                            </tr>
                            <QuickTransactionRow
                                categories={categories}
                                members={members}
                                userRole={userRole}
                            />
                        </thead>
                        <tbody className="[&_tr:last-child]:border-0">
                            {transactions.length === 0 ? (
                                <tr>
                                    <td colSpan={canCancel ? 9 : 8} className="p-8 text-center text-zinc-500">
                                        No hay movimientos registrados este mes.
                                    </td>
                                </tr>
                            ) : (
                                transactions.map((t) => (
                                    <tr
                                        key={t.id}
                                        className={`border-b border-zinc-200 transition-colors dark:border-zinc-800 ${t.cancelledAt
                                            ? 'bg-red-50 hover:bg-red-100/70 dark:bg-red-950/20 dark:hover:bg-red-950/30'
                                            : 'hover:bg-zinc-100/50 dark:hover:bg-zinc-800/50'
                                            }`}
                                    >
                                        <td className="p-4 align-middle text-zinc-600 dark:text-zinc-400">
                                            {formatDateTime(t.date)}
                                        </td>
                                        <td className="p-4 align-middle">
                                            <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium rings-1 ring-inset ${t.type === 'INCOME'
                                                ? 'bg-green-50 text-green-700 ring-green-600/20 dark:bg-green-900/20 dark:text-green-400 dark:ring-green-500/20'
                                                : 'bg-red-50 text-red-700 ring-red-600/20 dark:bg-red-900/20 dark:text-red-400 dark:ring-red-500/20'
                                                }`}>
                                                {t.type === 'INCOME' ? 'Ingreso' : 'Gasto'}
                                            </span>
                                        </td>
                                        <td className="p-4 align-middle text-zinc-600 dark:text-zinc-400">
                                            {t.category.parent ? t.category.parent.name : t.category.name}
                                        </td>
                                        <td className="p-4 align-middle">
                                            <span className="text-zinc-600 dark:text-zinc-400 text-sm">
                                                {t.category.parent ? t.category.name : '-'}
                                            </span>
                                        </td>
                                        <td className={`p-4 align-middle text-right font-bold ${t.type === 'INCOME' ? 'text-green-600 dark:text-green-500' : 'text-red-600 dark:text-red-500'
                                            }`}>
                                            {t.type === 'INCOME' ? '+' : '-'}{formatCurrency(Number(t.amount), t.currency as 'ARS' | 'USD')}
                                        </td>
                                        <td className="p-4 align-middle font-medium text-zinc-900 dark:text-zinc-50">
                                            {t.description || '-'}
                                        </td>
                                        <td className="p-4 align-middle text-zinc-600 dark:text-zinc-400">
                                            {t.member ? `${t.member.firstName} ${t.member.lastName}` : '-'}
                                        </td>
                                        <td className="p-4 align-middle text-zinc-600 dark:text-zinc-400">
                                            {t.createdBy?.fullName || t.createdBy?.email || '-'}
                                        </td>
                                        {canCancel && (
                                            <td className="p-4 align-middle text-center">
                                                {t.cancelledAt ? (
                                                    <span className="inline-flex items-center justify-center rounded-md px-2 py-1 text-xs font-medium text-red-700 dark:text-red-300">
                                                        Anulada
                                                    </span>
                                                ) : (
                                                    <button
                                                        onClick={() => setSelectedTransaction(t)}
                                                        className="inline-flex items-center justify-center rounded-md p-2 text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20 transition-colors"
                                                        title="Anular transacción"
                                                    >
                                                        <X className="h-4 w-4" />
                                                    </button>
                                                )}
                                            </td>
                                        )}
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {selectedTransaction && (
                <CancelTransactionDialog
                    transaction={selectedTransaction}
                    isOpen={!!selectedTransaction}
                    onClose={() => setSelectedTransaction(null)}
                />
            )}
        </>
    )
}

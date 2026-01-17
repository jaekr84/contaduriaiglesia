'use client'

import { Category, Member } from '@prisma/client'
import { TransactionForm } from './TransactionForm'

interface NewTransactionCardProps {
    categories: Category[]
    members: Member[]
}

export function NewTransactionCard({ categories, members }: NewTransactionCardProps) {
    return (
        <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50 mb-4">Registrar Nuevo Movimiento</h2>
            <TransactionForm categories={categories} members={members} />
        </div>
    )
}

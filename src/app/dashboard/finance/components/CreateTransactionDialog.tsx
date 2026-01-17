'use client'

import { useState } from 'react'
import { Plus, X } from 'lucide-react'
import { Category, Member } from '@prisma/client'
import { TransactionForm } from './TransactionForm'

interface Props {
    categories: Category[]
    members: Member[]
}

export function CreateTransactionDialog({ categories, members }: Props) {
    const [isOpen, setIsOpen] = useState(false)

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                className="inline-flex items-center justify-center gap-2 rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-zinc-50 shadow hover:bg-zinc-900/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-950 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
                <Plus className="h-4 w-4" />
                Nuevo Movimiento
            </button>

            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-200">
                    <div className="relative w-full max-w-md rounded-xl bg-white p-6 shadow-lg animate-in zoom-in-95 duration-200 dark:bg-zinc-950 dark:border dark:border-zinc-800">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">Registrar Movimiento</h2>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="rounded-full p-2 text-zinc-500 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>

                        <TransactionForm
                            categories={categories}
                            members={members}
                            onSuccess={() => setIsOpen(false)}
                            onCancel={() => setIsOpen(false)}
                            isModal={true}
                        />
                    </div>
                </div>
            )}
        </>
    )
}

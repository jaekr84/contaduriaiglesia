'use client'

import { useState } from 'react'
import { Plus, X } from 'lucide-react'
import { Category } from '@prisma/client'
import { TransactionForm } from './TransactionForm'

interface Props {
    categories: Category[]
}

export function CreateTransactionDialog({ categories }: Props) {
    const [isOpen, setIsOpen] = useState(false)

    return (
        <>

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

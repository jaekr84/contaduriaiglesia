'use client'

import { useState, useTransition } from 'react'
import { Plus, X, Loader2, ArrowUpCircle, ArrowDownCircle } from 'lucide-react'
import { createTransaction, createCategory } from '../actions'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { Category, Member } from '@prisma/client'

interface Props {
    categories: Category[]
    members: Member[]
}

export function CreateTransactionDialog({ categories, members }: Props) {
    const [isOpen, setIsOpen] = useState(false)
    const [isPending, startTransition] = useTransition()
    const [type, setType] = useState<'INCOME' | 'EXPENSE'>('INCOME')
    const [isNewCategory, setIsNewCategory] = useState(false)
    const router = useRouter()

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault()
        const formData = new FormData(event.currentTarget)
        formData.set('type', type) // Ensure correct type context

        startTransition(async () => {
            let result;
            if (isNewCategory) {
                // Quick logic to create category first if user wants to
                // This part is a bit tricky in one go, so simplifing for now:
                // We assume the user creates it separately or uses existing.
                // Ideally we'd have a nested action or separate endpoint.
                // Revamped: "New Category" just toggles a different form action? No, let's keep it simple.
                // Users select from existing. Adding new category is a separate small flow inside or dedicated button.
            }

            result = await createTransaction(formData)

            if (result?.error) {
                toast.error(result.error)
            } else {
                toast.success('Movimiento registrado correctamente')
                setIsOpen(false)
                router.refresh()
            }
        })
    }

    // Filter categories by type
    const filteredCategories = categories.filter(c => c.type === type)

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                className="inline-flex items-center justify-center gap-2 rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-zinc-50 shadow hover:bg-zinc-900/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-950 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-50/90"
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

                        {/* Type Toggles */}
                        <div className="grid grid-cols-2 gap-2 mb-6 p-1 bg-zinc-100 rounded-lg dark:bg-zinc-900">
                            <button
                                type="button"
                                onClick={() => setType('INCOME')}
                                className={`flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-md transition-all ${type === 'INCOME'
                                    ? 'bg-white text-green-700 shadow-sm dark:bg-zinc-800 dark:text-green-400'
                                    : 'text-zinc-500 hover:text-zinc-700 dark:text-zinc-400'
                                    }`}
                            >
                                <ArrowUpCircle className="h-4 w-4" />
                                Ingreso
                            </button>
                            <button
                                type="button"
                                onClick={() => setType('EXPENSE')}
                                className={`flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-md transition-all ${type === 'EXPENSE'
                                    ? 'bg-white text-red-700 shadow-sm dark:bg-zinc-800 dark:text-red-400'
                                    : 'text-zinc-500 hover:text-zinc-700 dark:text-zinc-400'
                                    }`}
                            >
                                <ArrowDownCircle className="h-4 w-4" />
                                Gasto
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-zinc-900 dark:text-zinc-50">Monto</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-2 text-zinc-500">$</span>
                                    <input
                                        name="amount"
                                        type="number"
                                        step="0.01"
                                        min="0.01"
                                        required
                                        placeholder="0.00"
                                        className="flex h-9 w-full rounded-md border border-zinc-200 bg-white pl-7 pr-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-zinc-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-950 dark:border-zinc-800 dark:bg-zinc-950 dark:placeholder:text-zinc-400 dark:focus-visible:ring-zinc-300"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-zinc-900 dark:text-zinc-50">Descripción (Opcional)</label>
                                <input
                                    name="description"
                                    placeholder="Detalles adicionales (ej. Mes Enero)"
                                    className="flex h-9 w-full rounded-md border border-zinc-200 bg-white px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-zinc-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-950 dark:border-zinc-800 dark:bg-zinc-950 dark:placeholder:text-zinc-400 dark:focus-visible:ring-zinc-300"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-zinc-900 dark:text-zinc-50">Fecha</label>
                                    <input
                                        name="date"
                                        type="date"
                                        required
                                        defaultValue={new Date().toISOString().split('T')[0]}
                                        className="flex h-9 w-full rounded-md border border-zinc-200 bg-white px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-950 dark:border-zinc-800 dark:bg-zinc-950 dark:focus-visible:ring-zinc-300"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-zinc-900 dark:text-zinc-50">Categoría</label>
                                    <select
                                        name="categoryId"
                                        required
                                        className="flex h-9 w-full rounded-md border border-zinc-200 bg-white px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-950 dark:border-zinc-800 dark:bg-zinc-950 dark:focus-visible:ring-zinc-300"
                                    >
                                        <option value="">Seleccionar...</option>

                                        {filteredCategories.filter(c => !c.parentId).map(parent => {
                                            const subcategories = filteredCategories.filter(c => c.parentId === parent.id)
                                            return (
                                                <optgroup key={parent.id} label={parent.name}>
                                                    <option value={parent.id}>{parent.name} (General)</option>
                                                    {subcategories.map(sub => (
                                                        <option key={sub.id} value={sub.id}>
                                                            &nbsp;&nbsp;&nbsp;↳ {sub.name}
                                                        </option>
                                                    ))}
                                                </optgroup>
                                            )
                                        })}

                                        {/* Handle orphans/others just in case logic acts up, although above covers trees */}
                                    </select>
                                </div>
                            </div>

                            {type === 'INCOME' && (
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-zinc-900 dark:text-zinc-50">Miembro (Opcional)</label>
                                    <select
                                        name="memberId"
                                        className="flex h-9 w-full rounded-md border border-zinc-200 bg-white px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-950 dark:border-zinc-800 dark:bg-zinc-950 dark:focus-visible:ring-zinc-300"
                                    >
                                        <option value="none">-- Anónimo / General --</option>
                                        {members.map(m => (
                                            <option key={m.id} value={m.id}>{m.lastName}, {m.firstName}</option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            <input type="hidden" name="paymentMethod" value="CASH" /> {/* Default for now */}

                            <div className="flex justify-end gap-2 mt-6">
                                <button
                                    type="button"
                                    onClick={() => setIsOpen(false)}
                                    className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors border border-zinc-200 bg-transparent text-zinc-900 shadow-sm hover:bg-zinc-100 h-9 px-4 py-2 dark:border-zinc-800 dark:text-zinc-50 dark:hover:bg-zinc-800"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={isPending}
                                    className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors bg-zinc-900 text-zinc-50 shadow hover:bg-zinc-900/90 h-9 px-4 py-2 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-50/90"
                                >
                                    {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Guardar
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    )
}

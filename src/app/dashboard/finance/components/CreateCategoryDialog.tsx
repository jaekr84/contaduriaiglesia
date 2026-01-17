'use client'

import { useState, useTransition } from 'react'
import { Plus, X, Loader2 } from 'lucide-react'
import { createCategory } from '../actions'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { Category } from '@prisma/client'

interface Props {
    categories: Category[]
    trigger?: React.ReactNode
    defaultIsSubcategory?: boolean
    fixedParentId?: string
}

export function CreateCategoryDialog({ categories, trigger, defaultIsSubcategory = false, fixedParentId }: Props) {
    const [isOpen, setIsOpen] = useState(false)
    const [isPending, startTransition] = useTransition()
    const router = useRouter()

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault()
        const formData = new FormData(event.currentTarget)

        startTransition(async () => {
            const result = await createCategory(formData)

            if (result?.error) {
                toast.error(result.error)
            } else {
                toast.success('Categoría creada correctamente')
                setIsOpen(false)
                router.refresh()
            }
        })
    }

    // Filter only parent categories for the dropdown
    const parentCategories = categories.filter(c => !c.parentId)
    const fixedParent = fixedParentId ? categories.find(c => c.id === fixedParentId) : null


    return (
        <>
            {trigger ? (
                <div onClick={() => setIsOpen(true)}>{trigger}</div>
            ) : (
                <button
                    onClick={() => setIsOpen(true)}
                    className="inline-flex items-center justify-center gap-2 rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-zinc-50 shadow hover:bg-zinc-900/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-950 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-50/90"
                >
                    <Plus className="h-4 w-4" />
                    Nueva Categoría
                </button>
            )}

            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-200">
                    <div className="relative w-full max-w-md rounded-xl bg-white p-6 shadow-lg animate-in zoom-in-95 duration-200 dark:bg-zinc-950 dark:border dark:border-zinc-800">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">Nueva Categoría</h2>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="rounded-full p-2 text-zinc-500 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <label htmlFor="name" className="text-sm font-medium text-zinc-900 dark:text-zinc-50">Nombre</label>
                                <input
                                    id="name"
                                    name="name"
                                    required
                                    placeholder="Nombre de la categoría"
                                    className="flex h-9 w-full rounded-md border border-zinc-200 bg-white px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-zinc-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-950 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-800 dark:bg-zinc-950 dark:placeholder:text-zinc-400 dark:focus-visible:ring-zinc-300"
                                />
                                <p className="text-xs text-zinc-500">Puedes ingresar varios nombres separados por comas.</p>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label htmlFor="type" className="text-sm font-medium text-zinc-900 dark:text-zinc-50">Tipo</label>
                                    {fixedParent && <input type="hidden" name="type" value={fixedParent.type} />}
                                    <select
                                        id="type"
                                        name={fixedParent ? undefined : "type"}
                                        required
                                        value={fixedParent ? fixedParent.type : undefined}
                                        disabled={!!fixedParent}
                                        className="flex h-9 w-full rounded-md border border-zinc-200 bg-white px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-950 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50 dark:focus-visible:ring-zinc-300"
                                    >
                                        <option value="EXPENSE">Gasto</option>
                                        <option value="INCOME">Ingreso</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label htmlFor="parentId" className="text-sm font-medium text-zinc-900 dark:text-zinc-50">Categoría Padre</label>
                                    {fixedParent && <input type="hidden" name="parentId" value={fixedParent.id} />}
                                    <select
                                        id="parentId"
                                        name={fixedParent ? undefined : "parentId"}
                                        defaultValue={!fixedParent ? (defaultIsSubcategory ? "" : "none") : undefined}
                                        value={fixedParent ? fixedParent.id : undefined}
                                        disabled={!!fixedParent}
                                        className="flex h-9 w-full rounded-md border border-zinc-200 bg-white px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-950 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50 dark:focus-visible:ring-zinc-300"
                                    >
                                        <option value="none">Ninguna (Principal)</option>
                                        {parentCategories.map(cat => (
                                            <option key={cat.id} value={cat.id}>
                                                {cat.name} ({cat.type === 'INCOME' ? 'Ingreso' : 'Gasto'})
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="flex justify-end gap-2 mt-6">
                                <button
                                    type="button"
                                    onClick={() => setIsOpen(false)}
                                    className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-950 disabled:pointer-events-none disabled:opacity-50 border border-zinc-200 bg-transparent text-zinc-900 shadow-sm hover:bg-zinc-100 h-9 px-4 py-2 dark:border-zinc-800 dark:text-zinc-50 dark:hover:bg-zinc-800"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={isPending}
                                    className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-950 disabled:pointer-events-none disabled:opacity-50 bg-zinc-900 text-zinc-50 shadow hover:bg-zinc-900/90 h-9 px-4 py-2 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-50/90"
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

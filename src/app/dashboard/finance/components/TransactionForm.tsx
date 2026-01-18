'use client'

import { useState, useTransition } from 'react'
import { Plus, X, Loader2, Save } from 'lucide-react'
import { createTransaction } from '../actions'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { Category } from '@prisma/client'
import { MoneyInput } from './MoneyInput'
import { CreateCategoryDialog } from './CreateCategoryDialog'

interface TransactionFormProps {
    categories: Category[]
    onSuccess?: () => void
    onCancel?: () => void
    isModal?: boolean
}

export function TransactionForm({ categories, onSuccess, onCancel, isModal = false }: TransactionFormProps) {
    const [isPending, startTransition] = useTransition()
    const [type, setType] = useState<'INCOME' | 'EXPENSE'>('INCOME')
    const [selectedParentId, setSelectedParentId] = useState('')
    const [selectedSubId, setSelectedSubId] = useState('')
    const router = useRouter()
    const [currency, setCurrency] = useState('ARS')
    const [resetKey, setResetKey] = useState(0)

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault()
        const form = event.currentTarget
        const formData = new FormData(form)
        // Ensure manual fields are set if needed, though they should be in the form
        formData.set('currency', currency)

        startTransition(async () => {
            const finalCategoryId = selectedSubId || selectedParentId
            if (!finalCategoryId) {
                toast.error('Debe seleccionar una categoría')
                return
            }
            formData.set('categoryId', finalCategoryId)

            const result = await createTransaction(formData)

            if (result?.error) {
                toast.error(result.error)
            } else {
                toast.success('Movimiento registrado correctamente')

                // Reset form slightly or fully?
                // For a "Quick Entry" row, maybe keep date/type but clear amount/desc?
                // Let's clear basics.
                setSelectedParentId('')
                setSelectedSubId('')

                // We need to reset the form inputs. 
                // Since we are using uncontrolled inputs for most, we might need a ref or just let the page refresh handle it.
                // But router.refresh() doesn't reset client state inputs.
                form.reset()
                // Reset defaults
                setCurrency('ARS')
                setResetKey(prev => prev + 1)
                // Keep the date as "today" (default) or whatever the input resets to.

                router.refresh()
                onSuccess?.()
            }
        })
    }

    // Filter categories by type
    const filteredCategories = categories.filter(c => c.type === type)

    return (
        <div className={!isModal ? "p-0" : ""}>
            <form onSubmit={handleSubmit}>
                <fieldset disabled={isPending} className="flex flex-col lg:flex-row gap-3 items-end w-full disabled:opacity-70">

                    {/* Date */}
                    <div className="w-full lg:w-32 space-y-1">
                        <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">Fecha</label>
                        <input
                            name="date"
                            type="date"
                            required
                            defaultValue={new Date().toLocaleDateString('sv-SE', { timeZone: 'America/Argentina/Buenos_Aires' })}
                            className="w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 dark:border-zinc-800 dark:bg-zinc-950"
                        />
                    </div>

                    {/* Type */}
                    <div className="w-full lg:w-28 space-y-1">
                        <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">Tipo</label>
                        <select
                            name="type"
                            value={type}
                            onChange={(e) => {
                                setType(e.target.value as 'INCOME' | 'EXPENSE')
                                setSelectedParentId('')
                                setSelectedSubId('')
                            }}
                            className="w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 dark:border-zinc-800 dark:bg-zinc-950"
                        >
                            <option value="INCOME">Ingreso</option>
                            <option value="EXPENSE">Gasto</option>
                        </select>
                    </div>


                    {/* Category */}
                    <div className="w-full lg:w-40 space-y-1">
                        <div className="flex items-center gap-2">
                            <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">Categoría</label>
                            <CreateCategoryDialog
                                categories={categories}
                                trigger={
                                    <button type="button" className="text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full p-0.5 transition-colors" title="Nueva Categoría">
                                        <Plus className="h-3 w-3" />
                                    </button>
                                }
                            />
                        </div>
                        <select
                            required
                            value={selectedParentId}
                            onChange={(e) => {
                                setSelectedParentId(e.target.value)
                                setSelectedSubId('')
                            }}
                            className="w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 dark:border-zinc-800 dark:bg-zinc-950"
                        >
                            <option value="">Seleccionar...</option>
                            {filteredCategories.filter(c => !c.parentId).map(parent => (
                                <option key={parent.id} value={parent.id}>
                                    {parent.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Subcategory */}
                    <div className="w-full lg:w-40 space-y-1">
                        <div className="flex items-center gap-2">
                            <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">Subcategoría</label>
                            <CreateCategoryDialog
                                categories={categories}
                                fixedParentId={selectedParentId}
                                trigger={
                                    <button
                                        type="button"
                                        disabled={!selectedParentId}
                                        className="text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full p-0.5 transition-colors disabled:opacity-30 disabled:hover:bg-transparent disabled:cursor-not-allowed"
                                        title={selectedParentId ? "Nueva Subcategoría" : "Seleccione una categoría primero"}
                                    >
                                        <Plus className="h-3 w-3" />
                                    </button>
                                }
                            />
                        </div>
                        <select
                            value={selectedSubId}
                            onChange={(e) => setSelectedSubId(e.target.value)}
                            disabled={!selectedParentId || !filteredCategories.some(c => c.parentId === selectedParentId)}
                            className="w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 disabled:opacity-50 dark:border-zinc-800 dark:bg-zinc-950"
                        >
                            <option value="">General</option>
                            {filteredCategories
                                .filter(c => c.parentId === selectedParentId)
                                .map(sub => (
                                    <option key={sub.id} value={sub.id}>
                                        {sub.name}
                                    </option>
                                ))}
                        </select>
                    </div>

                    {/* Amount & Currency */}
                    <div className="w-full lg:w-40 space-y-1">
                        <div className="flex justify-between">
                            <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">Monto</label>
                            <button
                                type="button"
                                onClick={() => setCurrency(c => c === 'ARS' ? 'USD' : 'ARS')}
                                className="text-[10px] font-bold text-blue-600 hover:text-blue-500"
                            >
                                {currency}
                            </button>
                        </div>
                        <div className="relative">
                            <span className="absolute left-2.5 top-2 text-zinc-500 text-sm">$</span>
                            <MoneyInput
                                key={resetKey}
                                name="amount"
                                required
                                placeholder="0,00"
                                className="w-full rounded-md border border-zinc-200 bg-white pl-6 pr-3 py-2 text-sm shadow-sm transition-colors placeholder:text-zinc-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 dark:border-zinc-800 dark:bg-zinc-950"
                            />
                        </div>
                    </div>

                    {/* Description */}
                    <div className="w-full lg:flex-1 space-y-1">
                        <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">Descripción</label>
                        <input
                            name="description"
                            placeholder="Detalle"
                            className="w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm shadow-sm transition-colors placeholder:text-zinc-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 dark:border-zinc-800 dark:bg-zinc-950"
                        />
                    </div>



                    <div className="hidden">
                        <input type="hidden" name="paymentMethod" value="CASH" />
                    </div>

                    <button
                        type="submit"
                        disabled={isPending}
                        className="w-full lg:w-auto inline-flex items-center justify-center rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-zinc-50 shadow transition-colors hover:bg-zinc-900/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950 disabled:pointer-events-none disabled:opacity-50 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-50/90 dark:focus-visible:ring-zinc-300"
                    >
                        {isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <>
                                <Save className="mr-2 h-4 w-4 lg:hidden xl:inline-block" />
                                <span>Guardar</span>
                            </>
                        )}
                    </button>
                </fieldset>
            </form>
        </div>
    )
}

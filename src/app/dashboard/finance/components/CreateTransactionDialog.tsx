'use client'

import { useState, useTransition } from 'react'
import { Plus, X, Loader2, ArrowUpCircle, ArrowDownCircle } from 'lucide-react'
import { createTransaction, createCategory } from '../actions'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { Category, Member } from '@prisma/client'
import { MoneyInput } from './MoneyInput'

interface Props {
    categories: Category[]
    members: Member[]
}

export function CreateTransactionDialog({ categories, members }: Props) {
    const [isOpen, setIsOpen] = useState(false)
    const [isPending, startTransition] = useTransition()
    const [type, setType] = useState<'INCOME' | 'EXPENSE'>('INCOME')
    const [isNewCategory, setIsNewCategory] = useState(false)
    const [selectedParentId, setSelectedParentId] = useState('')
    const [selectedSubId, setSelectedSubId] = useState('')
    const router = useRouter()

    const [newCategoryName, setNewCategoryName] = useState('')
    const [currency, setCurrency] = useState('ARS')

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault()
        const formData = new FormData(event.currentTarget)
        formData.set('type', type) // Ensure correct type context

        startTransition(async () => {
            let finalCategoryId = selectedSubId || selectedParentId

            if (isNewCategory) {
                const catFormData = new FormData()
                catFormData.append('name', newCategoryName)
                catFormData.append('type', type)
                if (selectedParentId) {
                    catFormData.append('parentId', selectedParentId)
                }

                const catResult = await createCategory(catFormData)
                if (catResult?.error) {
                    toast.error(catResult.error)
                    return // Stop transaction creation if category failed
                }
                if (catResult?.success && catResult.category) {
                    finalCategoryId = catResult.category.id
                    toast.success('Categoría creada')
                    // We don't verify success here strictly beyond error check, 
                    // but we need the ID.
                }
            }

            // Update categoryId in the main form data
            formData.set('categoryId', finalCategoryId)

            const result = await createTransaction(formData)

            if (result?.error) {
                toast.error(result.error)
            } else {
                toast.success('Movimiento registrado correctamente')
                setIsOpen(false)
                // Reset states
                setIsNewCategory(false)
                setNewCategoryName('')
                setSelectedParentId('')
                setSelectedSubId('')
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
                                onClick={() => !isPending && setIsOpen(false)}
                                disabled={isPending}
                                className="rounded-full p-2 text-zinc-500 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed"
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
                            <fieldset disabled={isPending} className="space-y-4 disabled:opacity-70">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-zinc-900 dark:text-zinc-50">Moneda</label>
                                    <div className="flex rounded-md shadow-sm">
                                        <button
                                            type="button"
                                            onClick={() => setCurrency('ARS')}
                                            className={`flex-1 rounded-l-md border py-2 text-sm font-medium focus:z-10 focus:outline-none focus:ring-1 focus:ring-zinc-950 ${currency === 'ARS'
                                                ? 'bg-zinc-900 text-white border-zinc-900 dark:bg-zinc-50 dark:text-zinc-900 dark:border-zinc-50'
                                                : 'bg-white text-zinc-700 border-zinc-200 hover:bg-zinc-50 dark:bg-zinc-950 dark:text-zinc-300 dark:border-zinc-800 dark:hover:bg-zinc-900'
                                                }`}
                                        >
                                            Pesos (ARS)
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setCurrency('USD')}
                                            className={`flex-1 rounded-r-md border-t border-b border-r py-2 text-sm font-medium focus:z-10 focus:outline-none focus:ring-1 focus:ring-zinc-950 ${currency === 'USD'
                                                ? 'bg-zinc-900 text-white border-zinc-900 dark:bg-zinc-50 dark:text-zinc-900 dark:border-zinc-50'
                                                : 'bg-white text-zinc-700 border-zinc-200 hover:bg-zinc-50 dark:bg-zinc-950 dark:text-zinc-300 dark:border-zinc-800 dark:hover:bg-zinc-900'
                                                }`}
                                        >
                                            Dólares (USD)
                                        </button>
                                    </div>
                                    <input type="hidden" name="currency" value={currency} />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-zinc-900 dark:text-zinc-50">Monto</label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-2 text-zinc-500">{currency === 'ARS' ? '$' : 'US$'}</span>
                                        <MoneyInput
                                            name="amount"
                                            required
                                            placeholder="0,00"
                                            className="flex h-9 w-full rounded-md border border-zinc-200 bg-white pl-12 pr-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-zinc-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-950 dark:border-zinc-800 dark:bg-zinc-950 dark:placeholder:text-zinc-400 dark:focus-visible:ring-zinc-300"
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

                                <div className="space-y-4 rounded-md border border-zinc-200 p-4 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50">
                                    <div className="flex items-center justify-between">
                                        <label className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
                                            {isNewCategory ? 'Nueva Categoría' : 'Categoría'}
                                        </label>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setIsNewCategory(!isNewCategory)
                                                setNewCategoryName('')
                                                setSelectedSubId('')
                                            }}
                                            className="text-xs font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400"
                                        >
                                            {isNewCategory ? 'Seleccionar existente' : 'Crear nueva'}
                                        </button>
                                    </div>

                                    {isNewCategory ? (
                                        <div className="space-y-3 animate-in slide-in-from-top-2 duration-200">
                                            <input
                                                value={newCategoryName}
                                                onChange={(e) => setNewCategoryName(e.target.value)}
                                                placeholder="Nombre de la nueva categoría"
                                                className="flex h-9 w-full rounded-md border border-zinc-200 bg-white px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-950 dark:border-zinc-800 dark:bg-zinc-950 dark:focus-visible:ring-zinc-300"
                                            />
                                            <div className="space-y-1">
                                                <label className="text-xs text-zinc-500">Categoría Padre (Opcional - Para crear subcategoría):</label>
                                                <select
                                                    value={selectedParentId}
                                                    onChange={(e) => setSelectedParentId(e.target.value)}
                                                    className="flex h-9 w-full rounded-md border border-zinc-200 bg-white px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-950 dark:border-zinc-800 dark:bg-zinc-950 dark:focus-visible:ring-zinc-300"
                                                >
                                                    <option value="">-- Ninguna (Crear como Principal) --</option>
                                                    {filteredCategories.filter(c => !c.parentId).map(parent => (
                                                        <option key={parent.id} value={parent.id}>
                                                            {parent.name}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            <select
                                                required={!isNewCategory}
                                                value={selectedParentId}
                                                onChange={(e) => {
                                                    setSelectedParentId(e.target.value)
                                                    setSelectedSubId('')
                                                }}
                                                className="flex h-9 w-full rounded-md border border-zinc-200 bg-white px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-950 dark:border-zinc-800 dark:bg-zinc-950 dark:focus-visible:ring-zinc-300"
                                            >
                                                <option value="">Seleccionar Categoría...</option>
                                                {filteredCategories.filter(c => !c.parentId).map(parent => (
                                                    <option key={parent.id} value={parent.id}>
                                                        {parent.name}
                                                    </option>
                                                ))}
                                            </select>

                                            {selectedParentId && filteredCategories.some(c => c.parentId === selectedParentId) && (
                                                <div className="space-y-1 animate-in slide-in-from-top-2 duration-200">
                                                    <label className="text-xs text-zinc-500">Subcategoría (Opcional)</label>
                                                    <select
                                                        value={selectedSubId}
                                                        onChange={(e) => setSelectedSubId(e.target.value)}
                                                        className="flex h-9 w-full rounded-md border border-zinc-200 bg-white px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-950 dark:border-zinc-800 dark:bg-zinc-950 dark:focus-visible:ring-zinc-300"
                                                    >
                                                        <option value="">General / Ninguna</option>
                                                        {filteredCategories
                                                            .filter(c => c.parentId === selectedParentId)
                                                            .map(sub => (
                                                                <option key={sub.id} value={sub.id}>
                                                                    {sub.name}
                                                                </option>
                                                            ))}
                                                    </select>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-zinc-900 dark:text-zinc-50">Fecha</label>
                                    <input
                                        name="date"
                                        type="date"
                                        required
                                        defaultValue={new Date().toLocaleDateString('sv-SE', { timeZone: 'America/Argentina/Buenos_Aires' })}
                                        className="flex h-9 w-full rounded-md border border-zinc-200 bg-white px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-950 dark:border-zinc-800 dark:bg-zinc-950 dark:focus-visible:ring-zinc-300"
                                    />
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
                                <input type="hidden" name="paymentMethod" value="CASH" />
                            </fieldset>

                            <div className="flex justify-end gap-2 mt-6">
                                <button
                                    type="button"
                                    disabled={isPending}
                                    onClick={() => setIsOpen(false)}
                                    className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors border border-zinc-200 bg-transparent text-zinc-900 shadow-sm hover:bg-zinc-100 h-9 px-4 py-2 dark:border-zinc-800 dark:text-zinc-50 dark:hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={isPending}
                                    className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors bg-zinc-900 text-zinc-50 shadow hover:bg-zinc-900/90 h-9 px-4 py-2 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-50/90 disabled:opacity-50 disabled:cursor-wait"
                                >
                                    {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Guardar
                                </button>
                            </div>
                        </form>
                    </div >
                </div >
            )
            }
        </>
    )
}

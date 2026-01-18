'use client'

import { useState, useRef, useTransition } from 'react'
import { createTransaction } from '../actions'
import { Category } from '@prisma/client'
import { Loader2, Plus, ArrowUpCircle } from 'lucide-react'
import { CreateCategoryDialog } from './CreateCategoryDialog'
import { MoneyInput } from './MoneyInput'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { useKeyboardShortcut } from '@/hooks/use-keyboard-shortcut'

interface QuickIncomeFormProps {
    categories: Category[]
    userRole?: string
}

export function QuickIncomeForm({ categories, userRole }: QuickIncomeFormProps) {
    const [isPending, startTransition] = useTransition()
    const [currency, setCurrency] = useState<'ARS' | 'USD'>('ARS')
    const [selectedParentId, setSelectedParentId] = useState('')
    const [selectedSubId, setSelectedSubId] = useState('')
    const [resetKey, setResetKey] = useState(0)

    const formRef = useRef<HTMLFormElement>(null)
    const firstInputRef = useRef<HTMLInputElement>(null)
    const router = useRouter()

    const amountInputRef = useRef<HTMLInputElement>(null)

    useKeyboardShortcut('F1', () => {
        amountInputRef.current?.focus()
    })

    const handleSubmit = (formData: FormData) => {
        formData.set('type', 'INCOME')
        formData.set('currency', currency)
        if (!formData.get('memberId')) {
            formData.delete('memberId')
        }

        const finalCategoryId = selectedSubId || selectedParentId
        if (!finalCategoryId) {
            toast.error('Debe seleccionar una categoría')
            return
        }
        formData.set('categoryId', finalCategoryId)

        startTransition(async () => {
            const result = await createTransaction(formData)

            if (result?.error) {
                toast.error(result.error)
            } else {
                toast.success('Ingreso registrado')
                formRef.current?.reset()
                setCurrency('ARS')
                setSelectedParentId('')
                setSelectedSubId('')
                setResetKey(prev => prev + 1)

                // Focus first input for next entry if needed, but maybe less critical for cards
                // setTimeout(() => {
                //     firstInputRef.current?.focus()
                // }, 100)

                router.refresh()
            }
        })
    }

    // Filter categories by type INCOME
    const filteredCategories = categories.filter(c => c.type === 'INCOME')
    const parentCategories = filteredCategories.filter(c => !c.parentId)

    const formId = "quick-income-form"

    return (
        <div className="rounded-xl border border-green-200 bg-green-50/50 shadow-sm dark:border-green-900/30 dark:bg-green-950/10 overflow-hidden">
            <div className="border-b border-green-100 bg-green-100/50 px-4 py-3 dark:border-green-900/30 dark:bg-green-900/20">
                <div className="flex items-center gap-2 text-green-700 dark:text-green-400">
                    <ArrowUpCircle className="h-5 w-5" />
                    <span className="font-semibold text-sm">Registrar Ingreso</span>
                </div>
            </div>

            <form id={formId} ref={formRef} action={handleSubmit} className="p-4 space-y-4">
                <input type="hidden" name="paymentMethod" value="CASH" />

                <div className="grid grid-cols-2 gap-4">
                    {/* Date */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Fecha</label>
                        <input
                            ref={firstInputRef}
                            name="date"
                            type="date"
                            required
                            defaultValue={new Date().toLocaleDateString('sv-SE', { timeZone: 'America/Argentina/Buenos_Aires' })}
                            className="w-full h-9 rounded-md border border-zinc-200 bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-950 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-800 dark:text-zinc-50 dark:focus-visible:ring-zinc-300"
                        />
                    </div>

                    {/* Amount */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Monto</label>
                        <div className="flex gap-2">
                            <button
                                type="button"
                                onClick={() => setCurrency(c => c === 'ARS' ? 'USD' : 'ARS')}
                                className="h-9 min-w-[3rem] rounded-md border border-zinc-200 bg-zinc-50 px-2.5 text-xs font-semibold text-zinc-900 transition-colors hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-50 dark:hover:bg-zinc-800"
                            >
                                {currency}
                            </button>


                            <MoneyInput
                                ref={amountInputRef}
                                key={resetKey}
                                form={formId}
                                name="amount"
                                required
                                placeholder="0,00 (F1)"
                                className="flex h-9 w-full rounded-md border border-zinc-200 bg-transparent px-3 py-1 text-right text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-zinc-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-950 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-800 dark:text-zinc-300 dark:placeholder:text-zinc-400 dark:focus-visible:ring-zinc-300 font-mono"
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        e.preventDefault()
                                        formRef.current?.requestSubmit()
                                    }
                                }}
                            />
                        </div>
                    </div>
                </div>

                {/* Category & Subcategory Row */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                        <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Categoría</label>
                        <div className="flex gap-2">
                            <div className="relative flex-1">
                                <select
                                    required
                                    value={selectedParentId}
                                    onChange={(e) => {
                                        setSelectedParentId(e.target.value)
                                        setSelectedSubId('')
                                    }}
                                    className="flex h-9 w-full rounded-md border border-zinc-200 bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-950 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-800 dark:text-zinc-50 dark:focus-visible:ring-zinc-300 appearance-none"
                                >
                                    <option value="">Seleccionar...</option>
                                    {parentCategories.map(parent => (
                                        <option key={parent.id} value={parent.id}>
                                            {parent.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <CreateCategoryDialog
                                categories={categories}
                                type="INCOME"
                                trigger={
                                    <button type="button" className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-zinc-200 bg-transparent text-zinc-900 transition-colors hover:bg-zinc-100 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-950 disabled:pointer-events-none disabled:opacity-50 dark:border-zinc-800 dark:text-zinc-50 dark:hover:bg-zinc-800" title="Nueva Categoría">
                                        <Plus className="h-4 w-4" />
                                    </button>
                                }
                            />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Subcategoría</label>
                        <div className="flex gap-2">
                            <div className="relative flex-1">
                                <select
                                    value={selectedSubId}
                                    onChange={(e) => setSelectedSubId(e.target.value)}
                                    disabled={!selectedParentId || !filteredCategories.some(c => c.parentId === selectedParentId)}
                                    className="flex h-9 w-full rounded-md border border-zinc-200 bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-950 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-800 dark:text-zinc-50 dark:focus-visible:ring-zinc-300 appearance-none"
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
                            <CreateCategoryDialog
                                categories={categories}
                                fixedParentId={selectedParentId}
                                type="INCOME"
                                trigger={
                                    <button
                                        type="button"
                                        disabled={!selectedParentId}
                                        className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-zinc-200 bg-transparent text-zinc-900 transition-colors hover:bg-zinc-100 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-950 disabled:pointer-events-none disabled:opacity-50 dark:border-zinc-800 dark:text-zinc-50 dark:hover:bg-zinc-800"
                                        title={selectedParentId ? "Nueva Subcategoría" : "Seleccione una categoría primero"}
                                    >
                                        <Plus className="h-4 w-4" />
                                    </button>
                                }
                            />
                        </div>
                    </div>
                </div>

                {/* Description Row */}
                <div className="space-y-1.5">
                    <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Nota / Detalle / Número de factura</label>
                    <input
                        name="description"
                        placeholder="Detalle del ingreso..."
                        className="flex h-9 w-full rounded-md border border-zinc-200 bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-zinc-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-950 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-800 dark:text-zinc-300 dark:placeholder:text-zinc-400 dark:focus-visible:ring-zinc-300"
                    />
                </div>

                <div className="pt-2">
                    <button
                        type="submit"
                        disabled={isPending}
                        className="w-full inline-flex h-9 items-center justify-center rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-zinc-50 shadow transition-colors hover:bg-zinc-900/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-950 disabled:pointer-events-none disabled:opacity-50 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-50/90 dark:focus-visible:ring-zinc-300"
                    >
                        {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
                        Registrar Ingreso
                    </button>
                </div>
            </form>
        </div>
    )
}

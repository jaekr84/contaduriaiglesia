'use client'

import { useState, useRef, useTransition, useEffect } from 'react'
import { createTransaction } from '../actions'
import { Category } from '@prisma/client'
import { Loader2, Plus, ArrowUpCircle } from 'lucide-react'
import { CreateCategoryDialog } from './CreateCategoryDialog'
import { MoneyInput } from './MoneyInput'
import { Combobox } from '@/components/ui/combobox'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { useKeyboardShortcut } from '@/hooks/use-keyboard-shortcut'
import { getTodayArgentinaISO } from '@/lib/dateUtils'

interface QuickIncomeFormProps {
    categories: Category[]
    userRole?: string
}

export function QuickIncomeForm({ categories: initialCategories, userRole }: QuickIncomeFormProps) {
    const [isPending, startTransition] = useTransition()
    const [currency, setCurrency] = useState<'ARS' | 'USD'>('ARS')
    const [selectedParentId, setSelectedParentId] = useState('')
    const [selectedSubId, setSelectedSubId] = useState('')
    const [date, setDate] = useState(getTodayArgentinaISO())
    const [resetKey, setResetKey] = useState(0)

    // Local categories state for immediate updates
    const [categories, setCategories] = useState(initialCategories)

    // Sync with props if they change (e.g. after refresh)
    useEffect(() => {
        setCategories(initialCategories)
    }, [initialCategories])

    const formRef = useRef<HTMLFormElement>(null)
    const firstInputRef = useRef<HTMLInputElement>(null)
    const subcategoryInputRef = useRef<HTMLButtonElement>(null)
    const subcategoryTriggerRef = useRef<HTMLButtonElement>(null)
    const descriptionInputRef = useRef<HTMLInputElement>(null)
    const router = useRouter()

    const amountInputRef = useRef<HTMLInputElement>(null)

    // ... (shortcuts)

    const handleCategoryCreated = (newCategory: Category) => {
        setCategories(prev => [...prev, newCategory])

        if (newCategory.parentId) {
            // It's a subcategory
            setSelectedSubId(newCategory.id)
            if (newCategory.parentId !== selectedParentId) {
                setSelectedParentId(newCategory.parentId)
            }
            // UX: Focus Description after creating Subcategory
            setTimeout(() => {
                descriptionInputRef.current?.focus()
            }, 200)
        } else {
            // It's a parent category
            setSelectedParentId(newCategory.id)
            setSelectedSubId('') // Clear subcategory

            // UX: If we just created a parent, it has NO subcategories yet.
            // So the Combobox is disabled. We must focus the "+" button to allow creating a subcategory.
            setTimeout(() => {
                subcategoryTriggerRef.current?.focus()
            }, 200)
        }
    }

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

                // Reset fields but keep Date (Sticky value)
                const form = formRef.current
                if (form) {
                    // Manually clear description
                    const descriptionInput = form.elements.namedItem('description') as HTMLInputElement
                    if (descriptionInput) descriptionInput.value = ''
                }

                // Reset categories
                setSelectedParentId('')
                setSelectedSubId('')

                // Reset amount (MoneyInput)
                setResetKey(prev => prev + 1)

                // Smart Focus: Focus amount input to continue rapid entry
                setTimeout(() => {
                    amountInputRef.current?.focus()
                }, 100)

                router.refresh()
            }
        })
    }

    // Filter categories by type INCOME
    const filteredCategories = categories.filter(c => c.type === 'INCOME')

    // Sorter for A-Z and Korean (ㄱ-ㅎ)
    const sorter = new Intl.Collator(['ko', 'es', 'en'], { sensitivity: 'base', numeric: true })

    const parentCategories = filteredCategories
        .filter(c => !c.parentId)
        .sort((a, b) => (a as any).order - (b as any).order)

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
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
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
                                <Combobox
                                    options={parentCategories.map(c => ({ value: c.id, label: c.name }))}
                                    value={selectedParentId}
                                    onChange={(val) => {
                                        setSelectedParentId(val)
                                        setSelectedSubId('')
                                    }}
                                    placeholder="Seleccionar..."
                                    searchPlaceholder="Buscar categoría..."
                                    className="h-9"
                                />
                            </div>
                            <CreateCategoryDialog
                                categories={categories}
                                type="INCOME"
                                onCategoryCreated={handleCategoryCreated}
                                trigger={
                                    <button type="button" tabIndex={-1} className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-zinc-200 bg-transparent text-zinc-900 transition-colors hover:bg-zinc-100 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-950 disabled:pointer-events-none disabled:opacity-50 dark:border-zinc-800 dark:text-zinc-50 dark:hover:bg-zinc-800" title="Nueva Categoría">
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
                                <Combobox
                                    ref={subcategoryInputRef}
                                    options={[
                                        ...filteredCategories
                                            .filter(c => c.parentId === selectedParentId)
                                            .sort((a, b) => (a as any).order - (b as any).order)
                                            .map(sub => ({ value: sub.id, label: sub.name }))
                                    ]}
                                    value={selectedSubId}
                                    onChange={(val) => {
                                        setSelectedSubId(val)
                                    }}
                                    disabled={!selectedParentId}
                                    placeholder="General"
                                    searchPlaceholder="Buscar subcategoría..."
                                    emptyText="Sin subcategorías"
                                    className="h-9"
                                />
                            </div>
                            <CreateCategoryDialog
                                categories={categories}
                                fixedParentId={selectedParentId}
                                type="INCOME"
                                onCategoryCreated={handleCategoryCreated}
                                trigger={
                                    <button
                                        ref={subcategoryTriggerRef}
                                        type="button"
                                        tabIndex={-1}
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
                        ref={descriptionInputRef}
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
                        Registrar Ingreso (F4) / Enter
                    </button>
                </div>
            </form>
        </div>
    )
}

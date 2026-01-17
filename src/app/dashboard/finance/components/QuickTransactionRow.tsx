'use client'

import { useState, useRef, useTransition } from 'react'
import { createTransaction } from '../actions'
import { Category, Member } from '@prisma/client'
import { Loader2, Plus, ArrowUpCircle, ArrowDownCircle } from 'lucide-react'
import { CreateCategoryDialog } from './CreateCategoryDialog'
import { CreateMemberDialog } from '../../members/components/CreateMemberDialog'
import { MoneyInput } from './MoneyInput'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

interface QuickTransactionRowProps {
    categories: Category[]
    members: Member[]
    userRole: string
}

export function QuickTransactionRow({ categories, members, userRole }: QuickTransactionRowProps) {
    const [isPending, startTransition] = useTransition()
    const [type, setType] = useState<'INCOME' | 'EXPENSE'>('INCOME')
    const [currency, setCurrency] = useState<'ARS' | 'USD'>('ARS')
    const [selectedParentId, setSelectedParentId] = useState('')
    const [selectedSubId, setSelectedSubId] = useState('')
    const [resetKey, setResetKey] = useState(0)

    const formRef = useRef<HTMLFormElement>(null)
    const firstInputRef = useRef<HTMLInputElement>(null)
    const router = useRouter()

    const handleSubmit = (formData: FormData) => {
        // Append controlled fields
        formData.set('type', type)
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
                toast.success('Movimiento registrado')
                formRef.current?.reset()
                // Reset to defaults
                setCurrency('ARS')
                setSelectedParentId('')
                setSelectedSubId('')
                setResetKey(prev => prev + 1)

                // Focus first input for next entry
                setTimeout(() => {
                    firstInputRef.current?.focus()
                }, 100)

                router.refresh()
            }
        })
    }

    // Filter categories by type
    const filteredCategories = categories.filter(c => c.type === type)
    const parentCategories = filteredCategories.filter(c => !c.parentId)

    const formId = "quick-transaction-form"

    return (
        <tr className="bg-blue-50 dark:bg-blue-950/50 border-b border-blue-100 dark:border-blue-900 hidden sm:table-row group">
            {/* Hidden Form to capture all inputs */}
            <td className="hidden">
                <form id={formId} ref={formRef} action={handleSubmit}>
                    <input type="hidden" name="paymentMethod" value="CASH" />
                </form>
            </td>

            {/* Date */}
            <td className="p-2 align-middle">
                <input
                    form={formId}
                    ref={firstInputRef}
                    name="date"
                    type="date"
                    required
                    defaultValue={new Date().toLocaleDateString('sv-SE', { timeZone: 'America/Argentina/Buenos_Aires' })}
                    className="w-full h-8 bg-transparent border border-transparent hover:border-zinc-200 focus:border-blue-500 rounded px-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors dark:text-zinc-300"
                />
            </td>

            {/* Type */}
            <td className="p-2 align-middle">
                <div className="flex items-center bg-white dark:bg-zinc-950 rounded border border-zinc-200 dark:border-zinc-800 p-0.5 h-8 w-fit mx-auto">
                    <button
                        type="button"
                        onClick={() => {
                            setType('INCOME')
                            setSelectedParentId('')
                            setSelectedSubId('')
                        }}
                        className={`px-2 py-0.5 text-xs font-medium rounded transition-colors ${type === 'INCOME' ? 'text-green-700 bg-green-100 dark:bg-green-900/40 dark:text-green-400' : 'text-zinc-500 hover:text-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800'}`}
                    >
                        Ingreso
                    </button>
                    <button
                        type="button"
                        onClick={() => {
                            setType('EXPENSE')
                            setSelectedParentId('')
                            setSelectedSubId('')
                        }}
                        className={`px-2 py-0.5 text-xs font-medium rounded transition-colors ${type === 'EXPENSE' ? 'text-red-700 bg-red-100 dark:bg-red-900/40 dark:text-red-400' : 'text-zinc-500 hover:text-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800'}`}
                    >
                        Gasto
                    </button>
                </div>
            </td>

            {/* Category */}
            <td className="p-2 align-middle">
                <div className="relative flex items-center gap-1">
                    <select
                        form={formId}
                        required
                        value={selectedParentId}
                        onChange={(e) => {
                            setSelectedParentId(e.target.value)
                            setSelectedSubId('')
                        }}
                        className="flex-1 h-8 bg-transparent border border-transparent hover:border-zinc-200 focus:border-blue-500 rounded px-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors dark:text-zinc-300 appearance-none min-w-0"
                    >
                        <option value="">Categoría...</option>
                        {parentCategories.map(parent => (
                            <option key={parent.id} value={parent.id}>
                                {parent.name}
                            </option>
                        ))}
                    </select>
                    <CreateCategoryDialog
                        categories={categories}
                        trigger={
                            <button type="button" className="p-1.5 text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-all active:scale-90 active:bg-zinc-200 dark:active:bg-zinc-700" title="Nueva Categoría">
                                <Plus className="h-4 w-4" />
                            </button>
                        }
                    />
                </div>
            </td>

            {/* Subcategory */}
            <td className="p-2 align-middle">
                <div className="relative flex items-center gap-1">
                    <select
                        form={formId}
                        value={selectedSubId}
                        onChange={(e) => setSelectedSubId(e.target.value)}
                        disabled={!selectedParentId || !filteredCategories.some(c => c.parentId === selectedParentId)}
                        className="flex-1 h-8 bg-transparent border border-transparent hover:border-zinc-200 focus:border-blue-500 rounded px-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors dark:text-zinc-300 appearance-none disabled:opacity-50 min-w-0"
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
                    <CreateCategoryDialog
                        categories={categories}
                        fixedParentId={selectedParentId}
                        trigger={
                            <button
                                type="button"
                                disabled={!selectedParentId}
                                className="p-1.5 text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-all active:scale-90 active:bg-zinc-200 dark:active:bg-zinc-700 disabled:opacity-30 disabled:hover:bg-transparent disabled:cursor-not-allowed disabled:active:scale-100"
                                title={selectedParentId ? "Nueva Subcategoría" : "Seleccione una categoría primero"}
                            >
                                <Plus className="h-4 w-4" />
                            </button>
                        }
                    />
                </div>
            </td>

            {/* Amount */}
            <td className="p-2 align-middle text-right">
                <div className="flex items-center justify-end gap-2">
                    <button
                        type="button"
                        onClick={() => setCurrency(c => c === 'ARS' ? 'USD' : 'ARS')}
                        className="text-xs font-bold px-2 min-w-[32px] text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded h-8"
                    >
                        {currency}
                    </button>
                    <MoneyInput
                        key={resetKey}
                        form={formId}
                        name="amount"
                        required
                        placeholder="0,00"
                        className="w-24 h-8 text-right bg-transparent border border-transparent hover:border-zinc-200 focus:border-blue-500 rounded px-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors font-mono font-medium dark:text-zinc-300"
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                e.preventDefault()
                                formRef.current?.requestSubmit()
                            }
                        }}
                    />
                </div>
            </td>

            {/* Description */}
            <td className="p-2 align-middle">
                <input
                    form={formId}
                    name="description"
                    placeholder="Descripción..."
                    className="w-full h-8 bg-transparent border border-transparent hover:border-zinc-200 focus:border-blue-500 rounded px-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors dark:text-zinc-300"
                />
            </td>

            {/* Member */}
            <td className="p-2 align-middle">
                <div className="relative flex items-center gap-1">
                    <select
                        form={formId}
                        name="memberId"
                        disabled={type !== 'INCOME'}
                        className="flex-1 h-8 bg-transparent border border-transparent hover:border-zinc-200 focus:border-blue-500 rounded px-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors dark:text-zinc-300 min-w-0 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <option value="">Anónimo / General</option>
                        {members.map(m => (
                            <option key={m.id} value={m.id}>{m.lastName}, {m.firstName}</option>
                        ))}
                    </select>
                    <CreateMemberDialog
                        trigger={
                            <button
                                type="button"
                                disabled={type !== 'INCOME'}
                                className="p-1.5 text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-all active:scale-90 active:bg-zinc-200 dark:active:bg-zinc-700 disabled:opacity-30 disabled:hover:bg-transparent disabled:cursor-not-allowed disabled:active:scale-100"
                                title="Nuevo Miembro"
                            >
                                <Plus className="h-4 w-4" />
                            </button>
                        }
                    />
                </div>
            </td>

            {/* Created By */}
            <td className="p-2 align-middle">
                <span className="text-xs text-zinc-400 italic px-2">Autocompletado</span>
            </td>

            {/* Actions */}
            <td className="p-2 align-middle text-center">
                <button
                    type="submit"
                    form={formId}
                    disabled={isPending}
                    className="h-8 w-8 flex items-center justify-center rounded-full bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-90 disabled:active:scale-100 shadow-sm hover:shadow disabled:shadow-none mx-auto"
                    title="Guardar"
                >
                    {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                </button>
            </td>
        </tr>
    )
}

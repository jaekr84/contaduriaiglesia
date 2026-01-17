'use client'

import { useState, useRef } from 'react'
import { createTransaction } from '../actions'
import { Category, Member } from '@prisma/client'
import { Loader2, Plus, ArrowUpCircle, ArrowDownCircle } from 'lucide-react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

interface QuickTransactionRowProps {
    categories: Category[]
    members: Member[]
    userRole: string
}

export function QuickTransactionRow({ categories, members, userRole }: QuickTransactionRowProps) {
    const [loading, setLoading] = useState(false)
    const [type, setType] = useState<'INCOME' | 'EXPENSE'>('INCOME')
    const [currency, setCurrency] = useState<'ARS' | 'USD'>('ARS')
    const formRef = useRef<HTMLFormElement>(null)
    const firstInputRef = useRef<HTMLInputElement>(null)
    const router = useRouter()

    const handleSubmit = async (formData: FormData) => {
        setLoading(true)

        // Append controlled fields
        formData.set('type', type)
        formData.set('currency', currency)
        if (!formData.get('memberId')) {
            formData.delete('memberId') // Ensure it doesn't send empty string if optional
        }

        const result = await createTransaction(formData)

        if (result?.error) {
            toast.error(result.error)
            setLoading(false)
        } else {
            toast.success('Movimiento registrado')
            formRef.current?.reset()
            // Reset to defaults
            setCurrency('ARS')
            // Don't reset type, keep it for repeated entry efficiency

            // Focus first input for next entry
            setTimeout(() => {
                firstInputRef.current?.focus()
            }, 100)

            router.refresh()
            setLoading(false)
        }
    }

    // Filter categories by type
    const filteredCategories = categories.filter(c => c.type === type)
    const parentCategories = filteredCategories.filter(c => !c.parentId)

    return (
        <tr className="bg-blue-50/50 dark:bg-blue-900/10 border-b border-blue-100 dark:border-blue-900 hidden sm:table-row group">
            <td className="p-2 align-middle">
                <input
                    ref={firstInputRef}
                    name="date"
                    type="date"
                    required
                    defaultValue={new Date().toLocaleDateString('sv-SE', { timeZone: 'America/Argentina/Buenos_Aires' })}
                    className="w-full h-8 bg-transparent border border-transparent hover:border-zinc-200 focus:border-blue-500 rounded px-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors dark:text-zinc-300"
                />
            </td>
            <td className="p-2 align-middle">
                <input
                    name="description"
                    placeholder="Descripción..."
                    className="w-full h-8 bg-transparent border border-transparent hover:border-zinc-200 focus:border-blue-500 rounded px-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors dark:text-zinc-300"
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                            e.preventDefault()
                            formRef.current?.requestSubmit()
                        }
                    }}
                />
            </td>
            <td className="p-2 align-middle" colSpan={2}>
                <div className="relative">
                    <select
                        name="categoryId"
                        required
                        className="w-full h-8 bg-transparent border border-transparent hover:border-zinc-200 focus:border-blue-500 rounded px-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors dark:text-zinc-300 appearance-none"
                    >
                        <option value="">Categoría...</option>
                        {parentCategories.map(parent => {
                            const subs = filteredCategories.filter(s => s.parentId === parent.id)
                            return (
                                <optgroup key={parent.id} label={parent.name}>
                                    <option value={parent.id}>{parent.name} (General)</option>
                                    {subs.map(sub => (
                                        <option key={sub.id} value={sub.id}>{sub.name}</option>
                                    ))}
                                </optgroup>
                            )
                        })}
                    </select>
                </div>
            </td>
            <td className="p-2 align-middle">
                {type === 'INCOME' ? (
                    <select
                        name="memberId"
                        className="w-full h-8 bg-transparent border border-transparent hover:border-zinc-200 focus:border-blue-500 rounded px-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors dark:text-zinc-300"
                    >
                        <option value="">Anónimo / General</option>
                        {members.map(m => (
                            <option key={m.id} value={m.id}>{m.lastName}, {m.firstName}</option>
                        ))}
                    </select>
                ) : (
                    <span className="text-zinc-400 text-xs px-2">-</span>
                )}
            </td>
            <td className="p-2 align-middle">
                <span className="text-xs text-zinc-400 italic px-2">Autocompletado</span>
            </td>
            <td className="p-2 align-middle text-right">
                <form
                    ref={formRef}
                    action={handleSubmit}
                    className="flex items-center justify-end gap-2"
                >
                    {/* Hidden inputs for controlled state */}
                    <input type="hidden" name="paymentMethod" value="CASH" />

                    {/* Controls */}
                    <div className="flex items-center bg-white dark:bg-zinc-950 rounded border border-zinc-200 dark:border-zinc-800 p-0.5 h-8">
                        <button
                            type="button"
                            onClick={() => setType('INCOME')}
                            className={`p-1 rounded transition-colors ${type === 'INCOME' ? 'text-green-600 bg-green-50 dark:bg-green-900/20' : 'text-zinc-400 hover:text-zinc-600'}`}
                            title="Ingreso"
                        >
                            <ArrowUpCircle className="h-4 w-4" />
                        </button>
                        <button
                            type="button"
                            onClick={() => setType('EXPENSE')}
                            className={`p-1 rounded transition-colors ${type === 'EXPENSE' ? 'text-red-600 bg-red-50 dark:bg-red-900/20' : 'text-zinc-400 hover:text-zinc-600'}`}
                            title="Gasto"
                        >
                            <ArrowDownCircle className="h-4 w-4" />
                        </button>
                        <div className="w-px h-4 bg-zinc-200 dark:bg-zinc-800 mx-1" />
                        <button
                            type="button"
                            onClick={() => setCurrency(c => c === 'ARS' ? 'USD' : 'ARS')}
                            className="text-xs font-bold px-1 min-w-[32px] text-zinc-600 dark:text-zinc-400 hover:text-zinc-900"
                        >
                            {currency}
                        </button>
                    </div>

                    <input
                        name="amount"
                        type="number"
                        step="0.01"
                        min="0.01"
                        required
                        placeholder="0.00"
                        className="w-24 h-8 text-right bg-transparent border border-transparent hover:border-zinc-200 focus:border-blue-500 rounded px-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors font-mono font-medium dark:text-zinc-300"
                    />

                    <button
                        type="submit"
                        disabled={loading}
                        className="h-8 w-8 flex items-center justify-center rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        title="Guardar (Enter)"
                    >
                        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                    </button>
                </form>
            </td>
            {/* Stub for actions column if needed, or colSpan above */}
            {userRole === 'ADMIN' || userRole === 'TREASURER' ? <td></td> : null}
        </tr>
    )
}

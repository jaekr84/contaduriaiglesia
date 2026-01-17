'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { Category, Member } from '@prisma/client'
import { RotateCcw, Filter, Loader2 } from 'lucide-react'
import { useTransition } from 'react'

interface Props {
    categories: Category[]
    members: Member[]
}

export function FinanceFilters({ categories, members }: Props) {
    const router = useRouter()
    const pathname = usePathname()
    const searchParams = useSearchParams()
    const [isPending, startTransition] = useTransition()

    // Get current values
    const dateFrom = searchParams.get('dateFrom') || ''
    const dateTo = searchParams.get('dateTo') || ''
    const type = searchParams.get('type') || ''
    const categoryId = searchParams.get('categoryId') || ''
    const memberId = searchParams.get('memberId') || ''

    // Helper to update URL
    function updateFilter(key: string, value: string) {
        const params = new URLSearchParams(searchParams)
        if (value) {
            params.set(key, value)
        } else {
            params.delete(key)
        }
        startTransition(() => {
            router.replace(`${pathname}?${params.toString()}`)
        })
    }

    function clearFilters() {
        startTransition(() => {
            router.replace(pathname)
        })
    }

    const hasActiveFilters = dateFrom || dateTo || type || categoryId || memberId

    return (
        <div className="relative rounded-lg border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
            {isPending && (
                <div className="absolute inset-0 z-10 flex items-center justify-center rounded-lg bg-white/80 dark:bg-zinc-950/80">
                    <Loader2 className="h-6 w-6 animate-spin text-zinc-900 dark:text-zinc-50" />
                </div>
            )}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
                {/* Month/Year Selector */}
                <input
                    type="month"
                    value={(() => {
                        if (dateFrom) {
                            return dateFrom.slice(0, 7)
                        }
                        const now = new Date()
                        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
                    })()}
                    onChange={(e) => {
                        const yearMonth = e.target.value
                        if (yearMonth) {
                            const [year, month] = yearMonth.split('-')
                            const firstDay = `${year}-${month}-01`
                            const lastDay = new Date(parseInt(year), parseInt(month), 0).getDate()
                            const lastDayStr = `${year}-${month}-${String(lastDay).padStart(2, '0')}`

                            const params = new URLSearchParams(searchParams)
                            params.set('dateFrom', firstDay)
                            params.set('dateTo', lastDayStr)
                            startTransition(() => {
                                router.replace(`${pathname}?${params.toString()}`)
                            })
                        }
                    }}
                    className="w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 dark:border-zinc-800 dark:bg-zinc-950"
                />

                {/* Type */}
                <select
                    value={type}
                    onChange={(e) => updateFilter('type', e.target.value)}
                    className="w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 dark:border-zinc-800 dark:bg-zinc-950"
                >
                    <option value="">Tipo</option>
                    <option value="INCOME">Ingresos</option>
                    <option value="EXPENSE">Gastos</option>
                </select>

                {/* Category (Parent) */}
                <select
                    value={(() => {
                        const active = categories.find(c => c.id === categoryId)
                        if (!active) return ''
                        return active.parentId || active.id
                    })()}
                    onChange={(e) => {
                        const newParentId = e.target.value
                        updateFilter('categoryId', newParentId)
                    }}
                    className="w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 dark:border-zinc-800 dark:bg-zinc-950"
                >
                    <option value="">Categoría</option>
                    {categories.filter(c => !c.parentId).map(parent => (
                        <option key={parent.id} value={parent.id}>{parent.name}</option>
                    ))}
                </select>

                {/* Subcategory */}
                <select
                    value={(() => {
                        const active = categories.find(c => c.id === categoryId)
                        return active?.parentId ? active.id : ''
                    })()}
                    onChange={(e) => {
                        const newSubId = e.target.value
                        if (newSubId) {
                            updateFilter('categoryId', newSubId)
                        } else {
                            const active = categories.find(c => c.id === categoryId)
                            const parentId = active?.parentId || active?.id
                            if (parentId) updateFilter('categoryId', parentId)
                            else updateFilter('categoryId', '')
                        }
                    }}
                    disabled={(() => {
                        const active = categories.find(c => c.id === categoryId)
                        const currentParentId = active?.parentId || active?.id
                        return !currentParentId || categories.filter(sub => sub.parentId === currentParentId).length === 0
                    })()}
                    className="w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 disabled:opacity-50 dark:border-zinc-800 dark:bg-zinc-950"
                >
                    <option value="">Subcategoría</option>
                    {(() => {
                        const active = categories.find(c => c.id === categoryId)
                        const parentId = active?.parentId || active?.id
                        if (!parentId) return null
                        return categories
                            .filter(sub => sub.parentId === parentId)
                            .map(sub => (
                                <option key={sub.id} value={sub.id}>{sub.name}</option>
                            ))
                    })()}
                </select>

                {/* Member */}
                <select
                    value={memberId}
                    onChange={(e) => updateFilter('memberId', e.target.value)}
                    className="w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 dark:border-zinc-800 dark:bg-zinc-950"
                >
                    <option value="">Miembro</option>
                    {members.map(m => (
                        <option key={m.id} value={m.id}>
                            {m.lastName}, {m.firstName}
                        </option>
                    ))}
                </select>
            </div>
        </div>
    )
}

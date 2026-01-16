'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { Category, Member } from '@prisma/client'
import { RotateCcw, Filter } from 'lucide-react'

interface Props {
    categories: Category[]
    members: Member[]
}

export function FinanceFilters({ categories, members }: Props) {
    const router = useRouter()
    const pathname = usePathname()
    const searchParams = useSearchParams()

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
        router.replace(`${pathname}?${params.toString()}`)
    }

    function clearFilters() {
        router.replace(pathname)
    }

    const hasActiveFilters = dateFrom || dateTo || type || categoryId || memberId

    return (
        <div className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
            <div className="flex items-center gap-2 mb-4 text-sm font-medium text-zinc-900 dark:text-zinc-50">
                <Filter className="h-4 w-4" />
                Filtros
                {hasActiveFilters && (
                    <button
                        onClick={clearFilters}
                        className="ml-auto text-xs text-red-500 hover:underline flex items-center gap-1"
                    >
                        <RotateCcw className="h-3 w-3" />
                        Limpiar
                    </button>
                )}
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
                {/* Date From */}
                <div className="space-y-1">
                    <label className="text-xs font-medium text-zinc-500">Desde</label>
                    <input
                        type="date"
                        value={dateFrom}
                        onChange={(e) => updateFilter('dateFrom', e.target.value)}
                        className="w-full rounded-md border border-zinc-200 bg-white px-3 py-1.5 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-950 dark:border-zinc-800 dark:bg-zinc-950 dark:focus-visible:ring-zinc-300"
                    />
                </div>

                {/* Date To */}
                <div className="space-y-1">
                    <label className="text-xs font-medium text-zinc-500">Hasta</label>
                    <input
                        type="date"
                        value={dateTo}
                        onChange={(e) => updateFilter('dateTo', e.target.value)}
                        className="w-full rounded-md border border-zinc-200 bg-white px-3 py-1.5 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-950 dark:border-zinc-800 dark:bg-zinc-950 dark:focus-visible:ring-zinc-300"
                    />
                </div>

                {/* Type */}
                <div className="space-y-1">
                    <label className="text-xs font-medium text-zinc-500">Tipo</label>
                    <select
                        value={type}
                        onChange={(e) => updateFilter('type', e.target.value)}
                        className="w-full rounded-md border border-zinc-200 bg-white px-3 py-1.5 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-950 dark:border-zinc-800 dark:bg-zinc-950 dark:focus-visible:ring-zinc-300"
                    >
                        <option value="">Todos</option>
                        <option value="INCOME">Ingresos</option>
                        <option value="EXPENSE">Gastos</option>
                    </select>
                </div>

                {/* Category (Parent) */}
                <div className="space-y-1">
                    <label className="text-xs font-medium text-zinc-500">Categoría</label>
                    <select
                        value={(() => {
                            const active = categories.find(c => c.id === categoryId)
                            if (!active) return ''
                            return active.parentId || active.id // If sub, return parentId. If parent, return id.
                        })()}
                        onChange={(e) => {
                            const newParentId = e.target.value
                            updateFilter('categoryId', newParentId)
                        }}
                        className="w-full rounded-md border border-zinc-200 bg-white px-3 py-1.5 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-950 dark:border-zinc-800 dark:bg-zinc-950 dark:focus-visible:ring-zinc-300"
                    >
                        <option value="">Todas</option>
                        {categories.filter(c => !c.parentId).map(parent => (
                            <option key={parent.id} value={parent.id}>{parent.name}</option>
                        ))}
                    </select>
                </div>

                {/* Subcategory */}
                <div className="space-y-1">
                    <label className="text-xs font-medium text-zinc-500">Subcategoría</label>
                    <select
                        value={(() => {
                            const active = categories.find(c => c.id === categoryId)
                            return active?.parentId ? active.id : '' // Only if active is sub
                        })()}
                        onChange={(e) => {
                            const newSubId = e.target.value
                            if (newSubId) {
                                updateFilter('categoryId', newSubId)
                            } else {
                                // If clearing sub, revert to parent
                                const active = categories.find(c => c.id === categoryId)
                                const parentId = active?.parentId || active?.id
                                if (parentId) updateFilter('categoryId', parentId)
                                else updateFilter('categoryId', '') // If no parent context, clear completely
                            }
                        }}
                        disabled={(() => {
                            const active = categories.find(c => c.id === categoryId)
                            const currentParentId = active?.parentId || active?.id
                            return !currentParentId || categories.filter(sub => sub.parentId === currentParentId).length === 0
                        })()}
                        className="w-full rounded-md border border-zinc-200 bg-white px-3 py-1.5 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-950 disabled:opacity-50 dark:border-zinc-800 dark:bg-zinc-950 dark:focus-visible:ring-zinc-300"
                    >
                        <option value="">Todas</option>
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
                </div>

                {/* Member */}
                <div className="space-y-1">
                    <label className="text-xs font-medium text-zinc-500">Miembro</label>
                    <select
                        value={memberId}
                        onChange={(e) => updateFilter('memberId', e.target.value)}
                        className="w-full rounded-md border border-zinc-200 bg-white px-3 py-1.5 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-950 dark:border-zinc-800 dark:bg-zinc-950 dark:focus-visible:ring-zinc-300"
                    >
                        <option value="">Todos</option>
                        {members.map(m => (
                            <option key={m.id} value={m.id}>
                                {m.lastName}, {m.firstName}
                            </option>
                        ))}
                    </select>
                </div>
            </div>
        </div>
    )
}

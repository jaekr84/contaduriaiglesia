'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { useCallback } from 'react'
import { getTodayArgentinaISO } from '@/lib/dateUtils'

export function DateRangeFilter() {
    const router = useRouter()
    const pathname = usePathname()
    const searchParams = useSearchParams()

    const createQueryString = useCallback(
        (name: string, value: string) => {
            const params = new URLSearchParams(searchParams.toString())
            if (value) {
                params.set(name, value)
            } else {
                params.delete(name)
            }
            return params.toString()
        },
        [searchParams]
    )

    const handleDateChange = (key: 'dateFrom' | 'dateTo', value: string) => {
        router.push(pathname + '?' + createQueryString(key, value))
    }

    return (
        <div className="flex items-center gap-4 bg-white dark:bg-zinc-950 p-4 rounded-lg border border-zinc-200 dark:border-zinc-800 shadow-sm">
            <div className="flex items-center gap-2">
                <label htmlFor="dateFrom" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    Desde:
                </label>
                <input
                    type="date"
                    id="dateFrom"
                    className="h-9 rounded-md border border-zinc-200 bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-950 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-800 dark:focus-visible:ring-zinc-300"
                    value={searchParams.get('dateFrom') || getTodayArgentinaISO()}
                    onChange={(e) => handleDateChange('dateFrom', e.target.value)}
                />
            </div>
            <div className="flex items-center gap-2">
                <label htmlFor="dateTo" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    Hasta:
                </label>
                <input
                    type="date"
                    id="dateTo"
                    className="h-9 rounded-md border border-zinc-200 bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-950 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-800 dark:focus-visible:ring-zinc-300"
                    value={searchParams.get('dateTo') || getTodayArgentinaISO()}
                    onChange={(e) => handleDateChange('dateTo', e.target.value)}
                />
            </div>
            {(searchParams.get('dateFrom') || searchParams.get('dateTo')) && (
                <button
                    onClick={() => router.push(pathname)}
                    className="text-sm text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 hover:underline"
                >
                    Limpiar filtros
                </button>
            )}
        </div>
    )
}

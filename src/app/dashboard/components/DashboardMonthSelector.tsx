'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { useTransition } from 'react'
import { Loader2 } from 'lucide-react'

export function DashboardMonthSelector() {
    const router = useRouter()
    const pathname = usePathname()
    const searchParams = useSearchParams()
    const [isPending, startTransition] = useTransition()

    const year = searchParams.get('year')
    const month = searchParams.get('month')

    // Default to current month if no params
    const now = new Date()
    const currentValue = year && month
        ? `${year}-${month.padStart(2, '0')}`
        : `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const yearMonth = e.target.value // "YYYY-MM"
        if (yearMonth) {
            const [newYear, newMonth] = yearMonth.split('-')
            const params = new URLSearchParams(searchParams)
            params.set('year', newYear)
            params.set('month', newMonth)
            startTransition(() => {
                router.replace(`${pathname}?${params.toString()}`)
            })
        }
    }

    return (
        <div className="relative inline-block">
            {isPending && (
                <div className="absolute inset-0 z-10 flex items-center justify-center rounded-md bg-white/80 dark:bg-zinc-950/80">
                    <Loader2 className="h-4 w-4 animate-spin text-zinc-900 dark:text-zinc-50" />
                </div>
            )}
            <input
                type="month"
                value={currentValue}
                onChange={handleChange}
                className="rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-950 dark:border-zinc-800 dark:bg-zinc-950 dark:focus-visible:ring-zinc-300"
            />
        </div>
    )
}

'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function MonthPicker() {
    const router = useRouter()
    const searchParams = useSearchParams()

    const now = new Date()
    // Get month/year from URL or default to now
    // Note: URL params are 1-indexed for month usually or just standard numbers
    // Let's stick to 1-12 for month in URL
    const monthParam = searchParams.get('month')
    const yearParam = searchParams.get('year')

    const currentYear = yearParam ? parseInt(yearParam) : now.getFullYear()
    const currentMonth = monthParam ? parseInt(monthParam) : now.getMonth() + 1

    const handlePrev = () => {
        let newMonth = currentMonth - 1
        let newYear = currentYear
        if (newMonth < 1) {
            newMonth = 12
            newYear -= 1
        }
        updateUrl(newMonth, newYear)
    }

    const handleNext = () => {
        let newMonth = currentMonth + 1
        let newYear = currentYear
        if (newMonth > 12) {
            newMonth = 1
            newYear += 1
        }
        updateUrl(newMonth, newYear)
    }

    const updateUrl = (m: number, y: number) => {
        const params = new URLSearchParams(searchParams)
        params.set('month', m.toString())
        params.set('year', y.toString())
        router.push(`?${params.toString()}`)
    }

    const date = new Date(currentYear, currentMonth - 1, 1)
    const label = new Intl.DateTimeFormat('es-AR', { month: 'long', year: 'numeric' }).format(date)
    // Capitalize first letter
    const formattedLabel = label.charAt(0).toUpperCase() + label.slice(1)

    return (
        <div className="flex items-center gap-4 bg-white dark:bg-zinc-950 p-2 rounded-lg border border-zinc-200 dark:border-zinc-800 shadow-sm">
            <Button variant="ghost" size="icon" onClick={handlePrev}>
                <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="min-w-[150px] text-center font-medium text-zinc-900 dark:text-zinc-50">
                {formattedLabel}
            </span>
            <Button variant="ghost" size="icon" onClick={handleNext}>
                <ChevronRight className="h-4 w-4" />
            </Button>
        </div>
    )
}

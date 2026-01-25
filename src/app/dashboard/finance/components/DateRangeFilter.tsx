'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { Calendar as CalendarIcon, X } from 'lucide-react'
import { DateRange } from 'react-day-picker'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover'

export function DateRangeFilter() {
    const router = useRouter()
    const pathname = usePathname()
    const searchParams = useSearchParams()

    const [date, setDate] = useState<DateRange | undefined>()

    // Sync with URL params
    useEffect(() => {
        const fromParam = searchParams.get('dateFrom')
        const toParam = searchParams.get('dateTo')

        if (fromParam && toParam) {
            setDate({
                from: new Date(fromParam + 'T00:00:00-03:00'),
                to: new Date(toParam + 'T00:00:00-03:00'),
            })
        } else {
            // Default to today
            const today = new Date()
            setDate({
                from: today,
                to: today
            })
        }
    }, [searchParams])

    const handleSelect = (range: DateRange | undefined) => {
        setDate(range)

        // Only update URL if we have a complete range (both start and end)
        if (range?.from && range?.to) {
            const params = new URLSearchParams(searchParams.toString())
            params.set('dateFrom', format(range.from, 'yyyy-MM-dd'))
            params.set('dateTo', format(range.to, 'yyyy-MM-dd'))
            router.push(pathname + '?' + params.toString())
        }
    }

    const clearFilter = (e: React.MouseEvent) => {
        e.stopPropagation()
        setDate(undefined)
        const params = new URLSearchParams(searchParams.toString())
        params.delete('dateFrom')
        params.delete('dateTo')
        router.push(pathname + '?' + params.toString())
    }

    return (
        <div className="flex items-center gap-2">
            <Popover>
                <PopoverTrigger asChild>
                    <Button
                        id="date"
                        variant={"outline"}
                        className={cn(
                            "w-[300px] justify-start text-left font-normal",
                            !date && "text-muted-foreground"
                        )}
                    >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {date?.from ? (
                            date.to ? (
                                <>
                                    {format(date.from, "dd/MM/yyyy", { locale: es })} -{" "}
                                    {format(date.to, "dd/MM/yyyy", { locale: es })}
                                </>
                            ) : (
                                format(date.from, "dd/MM/yyyy", { locale: es })
                            )
                        ) : (
                            <span>Seleccionar fechas</span>
                        )}
                        {(date?.from || date?.to) && (
                            <div
                                role="button"
                                onClick={clearFilter}
                                className="ml-auto hover:bg-zinc-100 rounded-full p-1 dark:hover:bg-zinc-800"
                            >
                                <X className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                            </div>
                        )}
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                        initialFocus
                        mode="range"
                        defaultMonth={date?.from}
                        selected={date}
                        onSelect={handleSelect}
                        numberOfMonths={2}
                        locale={es}
                    />
                </PopoverContent>
            </Popover>
        </div>
    )
}

'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { Calendar as CalendarIcon, X, Check } from 'lucide-react'
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
    const [tempDate, setTempDate] = useState<DateRange | undefined>()
    const [isOpen, setIsOpen] = useState(false)

    // Sync with URL params
    useEffect(() => {
        const fromParam = searchParams.get('dateFrom')
        const toParam = searchParams.get('dateTo')

        if (fromParam && toParam) {
            const appliedRange = {
                from: new Date(fromParam + 'T00:00:00-03:00'),
                to: new Date(toParam + 'T00:00:00-03:00'),
            }
            setDate(appliedRange)
            setTempDate(appliedRange)
        } else {
            // Default to today
            const today = new Date()
            const defaultRange = {
                from: today,
                to: today
            }
            setDate(defaultRange)
            setTempDate(defaultRange)
        }
    }, [searchParams])

    const handleSelect = (range: DateRange | undefined) => {
        setTempDate(range)
    }

    const applyFilter = () => {
        if (tempDate?.from && tempDate?.to) {
            const params = new URLSearchParams(searchParams.toString())
            params.set('dateFrom', format(tempDate.from, 'yyyy-MM-dd'))
            params.set('dateTo', format(tempDate.to, 'yyyy-MM-dd'))
            router.push(pathname + '?' + params.toString())
            setDate(tempDate)
            setIsOpen(false)
        }
    }

    const setToday = () => {
        const today = new Date()
        const todayRange = {
            from: today,
            to: today
        }
        setTempDate(todayRange)
        setDate(todayRange)

        // Apply filter immediately
        const params = new URLSearchParams(searchParams.toString())
        params.set('dateFrom', format(today, 'yyyy-MM-dd'))
        params.set('dateTo', format(today, 'yyyy-MM-dd'))
        router.push(pathname + '?' + params.toString())
        setIsOpen(false)
    }

    const setCurrentMonth = () => {
        const today = new Date()
        const firstDay = new Date(today.getFullYear(), today.getMonth(), 1)
        const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0)

        const monthRange = {
            from: firstDay,
            to: lastDay
        }
        setDate(monthRange)
        setTempDate(monthRange)

        // Apply filter immediately
        const params = new URLSearchParams(searchParams.toString())
        params.set('dateFrom', format(firstDay, 'yyyy-MM-dd'))
        params.set('dateTo', format(lastDay, 'yyyy-MM-dd'))
        router.push(pathname + '?' + params.toString())
    }

    const clearFilter = (e: React.MouseEvent) => {
        e.stopPropagation()
        setDate(undefined)
        setTempDate(undefined)
        const params = new URLSearchParams(searchParams.toString())
        params.delete('dateFrom')
        params.delete('dateTo')
        router.push(pathname + '?' + params.toString())
    }

    const handleOpenChange = (open: boolean) => {
        setIsOpen(open)
        if (!open) {
            // Reset temp selection to applied date when closing without applying
            setTempDate(date)
        }
    }

    return (
        <div className="flex items-center gap-2">
            <Popover open={isOpen} onOpenChange={handleOpenChange}>
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
                        defaultMonth={tempDate?.from}
                        selected={tempDate}
                        onSelect={handleSelect}
                        numberOfMonths={2}
                        locale={es}
                    />
                    <div className="border-t border-zinc-200 dark:border-zinc-800 p-3 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                            <Button
                                onClick={setToday}
                                variant="outline"
                                size="sm"
                                className="h-8 px-3 text-xs"
                            >
                                Hoy
                            </Button>
                            <p className="text-xs text-zinc-500 dark:text-zinc-400">
                                {tempDate?.from && tempDate?.to ? (
                                    <>
                                        {format(tempDate.from, "dd/MM/yyyy", { locale: es })} - {format(tempDate.to, "dd/MM/yyyy", { locale: es })}
                                    </>
                                ) : (
                                    "Selecciona un rango de fechas"
                                )}
                            </p>
                        </div>
                        <Button
                            onClick={applyFilter}
                            disabled={!tempDate?.from || !tempDate?.to}
                            size="sm"
                            className="h-8 px-3 text-xs"
                        >
                            <Check className="h-3.5 w-3.5 mr-1.5" />
                            Aplicar
                        </Button>
                    </div>
                </PopoverContent>
            </Popover>

            {/* Quick Filter Buttons */}
            <Button
                onClick={setToday}
                variant="outline"
                size="sm"
                className="h-10 px-3 text-sm"
            >
                Hoy
            </Button>
            <Button
                onClick={setCurrentMonth}
                variant="outline"
                size="sm"
                className="h-10 px-3 text-sm"
            >
                Mes
            </Button>
        </div>
    )
}

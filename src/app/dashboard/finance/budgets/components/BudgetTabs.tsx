'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { useEffect, useState } from 'react'

const MONTHS = [
    { value: '1', label: 'Enero' },
    { value: '2', label: 'Febrero' },
    { value: '3', label: 'Marzo' },
    { value: '4', label: 'Abril' },
    { value: '5', label: 'Mayo' },
    { value: '6', label: 'Junio' },
    { value: '7', label: 'Julio' },
    { value: '8', label: 'Agosto' },
    { value: '9', label: 'Septiembre' },
    { value: '10', label: 'Octubre' },
    { value: '11', label: 'Noviembre' },
    { value: '12', label: 'Diciembre' },
]

export function BudgetTabs() {
    const router = useRouter()
    const searchParams = useSearchParams()

    // Get current state from URL
    const currentMonth = searchParams.get('month') || (new Date().getMonth() + 1).toString()
    const currentYear = searchParams.get('year') || new Date().getFullYear().toString()

    const handleTabChange = (value: string) => {
        const params = new URLSearchParams(searchParams)
        params.set('month', value)
        // Keep existing year
        if (!params.get('year')) {
            params.set('year', currentYear)
        }
        router.push(`?${params.toString()}`)
    }

    const handleYearChange = (value: string) => {
        const params = new URLSearchParams(searchParams)
        params.set('year', value)
        router.push(`?${params.toString()}`)
    }

    // Generate years (e.g., current year - 2 to current year + 2)
    const nowYear = new Date().getFullYear()
    const years = Array.from({ length: 5 }, (_, i) => (nowYear - 2 + i).toString())

    return (
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="w-[120px]">
                <Select value={currentYear} onValueChange={handleYearChange}>
                    <SelectTrigger>
                        <SelectValue placeholder="Año" />
                    </SelectTrigger>
                    <SelectContent>
                        {years.map((y) => (
                            <SelectItem key={y} value={y}>
                                {y}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            <Tabs value={currentMonth} onValueChange={handleTabChange} className="w-full overflow-x-auto">
                <TabsList className="w-full justify-start h-auto flex-wrap sm:flex-nowrap">
                    <TabsTrigger value="0" className="min-w-[80px]">
                        Anual
                    </TabsTrigger>
                    {MONTHS.map((m) => (
                        <TabsTrigger key={m.value} value={m.value} className="flex-1 min-w-[80px]">
                            {m.label}
                        </TabsTrigger>
                    ))}
                </TabsList>
            </Tabs>
        </div>
    )
}

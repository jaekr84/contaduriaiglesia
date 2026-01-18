'use client'

import { useRouter, useSearchParams } from "next/navigation"

export function MonthSelector({ currentMonth }: { currentMonth: number }) {
    const router = useRouter()
    const searchParams = useSearchParams()

    const months = [
        'Anual', 'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ]

    const handleMonthChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const month = e.target.value
        const params = new URLSearchParams(searchParams.toString())

        params.set('month', month)

        router.push(`?${params.toString()}`)
    }

    return (
        <div className="relative">
            <select
                value={currentMonth.toString()}
                onChange={handleMonthChange}
                className="w-[180px] appearance-none rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
                {months.map((month, index) => (
                    <option key={index} value={(index - 1).toString()}>
                        {month}
                    </option>
                ))}
            </select>
        </div>
    )
}

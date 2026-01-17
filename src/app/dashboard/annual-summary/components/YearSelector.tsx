'use client'

import { useRouter } from "next/navigation"

export function YearSelector({ currentYear }: { currentYear: number }) {
    const router = useRouter()

    // Generate last 5 years
    const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i)

    const handleYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const year = e.target.value
        router.push(`?year=${year}`)
    }

    return (
        <div className="relative">
            <select
                value={currentYear.toString()}
                onChange={handleYearChange}
                className="w-[180px] appearance-none rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
                {years.map((year) => (
                    <option key={year} value={year.toString()}>
                        Año {year}
                    </option>
                ))}
            </select>
            {/* Custom arrow could go here if needed, but browser default is fine for now */}
        </div>
    )
}

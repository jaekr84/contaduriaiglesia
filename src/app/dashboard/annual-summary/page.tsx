import { Suspense } from 'react'
import { YearSelector } from './components/YearSelector'
import { MonthSelector } from './components/MonthSelector'
import { Metadata } from 'next'
import { AnnualSummaryContent } from './components/AnnualSummaryContent'
import { AnnualSummarySkeleton } from './components/AnnualSummarySkeleton'

export const metadata: Metadata = {
    title: 'Reportes de estado financiero | Dashboard',
    description: 'Resumen financiero anual de la iglesia',
}

interface PageProps {
    searchParams: Promise<{ year?: string; month?: string }>
}

import { getCurrentProfile } from '@/lib/auth'
import { redirect } from 'next/navigation'

export default async function AnnualSummaryPage({ searchParams }: PageProps) {
    const profile = await getCurrentProfile()

    // Allowed: ADMIN, TREASURER, VIEWER
    if (!profile || !['ADMIN', 'TREASURER', 'VIEWER'].includes(profile.role)) {
        redirect('/dashboard')
    }

    const { year, month } = await searchParams

    const currentYear = year ? parseInt(year) : new Date().getFullYear()
    const currentMonth = month ? parseInt(month) : new Date().getMonth()

    const months = [
        'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ]

    return (
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
            <div className="flex items-center justify-between space-y-2 print:hidden">
                <h2 className="text-3xl font-bold tracking-tight">Reportes de estado financiero {currentMonth !== -1 ? ` - ${months[currentMonth]}` : ''} - {currentYear}</h2>
                <div className="flex items-center space-x-2">
                    <MonthSelector currentMonth={currentMonth} />
                    <YearSelector currentYear={currentYear} />
                </div>
            </div>

            <Suspense key={`${currentYear}-${currentMonth}`} fallback={<AnnualSummarySkeleton />}>
                <AnnualSummaryContent currentYear={currentYear} currentMonth={currentMonth} />
            </Suspense>
        </div >
    )
}

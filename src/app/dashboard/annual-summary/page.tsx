import { Suspense } from 'react'
import { getAnnualSummary } from './actions'
import { YearSelector } from './components/YearSelector'
import { SummaryKPIs } from './components/SummaryKPIs'
import { SummaryCharts } from './components/SummaryCharts'
import { AnnualTable } from './components/AnnualTable'
import { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'Resumen Anual | Dashboard',
    description: 'Resumen financiero anual de la iglesia',
}

interface PageProps {
    searchParams: Promise<{ year?: string }>
}

export default async function AnnualSummaryPage({ searchParams }: PageProps) {
    const { year } = await searchParams   // Await searchParams as required in Next 15+

    const currentYear = year ? parseInt(year) : new Date().getFullYear()
    const summaryData = await getAnnualSummary(currentYear)

    return (
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
            <div className="flex items-center justify-between space-y-2 print:hidden">
                <h2 className="text-3xl font-bold tracking-tight">Resumen Anual {currentYear}</h2>
                <div className="flex items-center space-x-2">
                    <YearSelector currentYear={currentYear} />
                </div>
            </div>

            <div className="space-y-4">
                <div className="space-y-4">
                    <SummaryKPIs
                        totals={summaryData.usd.totals}
                        currency="USD"
                        title="Estado Financiero (USD)"
                    />
                    <SummaryCharts
                        monthlyData={summaryData.usd.monthly}
                        categoryData={summaryData.usd.expensesByCategory}
                        incomeCategoryData={summaryData.usd.incomeByCategory}
                        year={currentYear}
                        currency="USD"
                    />

                    <div className="my-8 border-t" />

                    <SummaryKPIs
                        totals={summaryData.ars.totals}
                        currency="ARS"
                        title="Estado Financiero (ARS)"
                    />
                    <SummaryCharts
                        monthlyData={summaryData.ars.monthly}
                        categoryData={summaryData.ars.expensesByCategory}
                        incomeCategoryData={summaryData.ars.incomeByCategory}
                        year={currentYear}
                        currency="ARS"
                    />
                </div>

                <AnnualTable
                    monthlyDataARS={summaryData.ars.monthly}
                    monthlyDataUSD={summaryData.usd.monthly}
                />
            </div>

            <div className="mt-8 text-center text-sm text-gray-500 print:block hidden">
                <p>Generado autom&aacute;tica por Sistema de Gesti&oacute;n Iglesia</p>
                <p>{new Date().toLocaleDateString()}</p>
            </div>
        </div >
    )
}

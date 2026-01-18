import { SummaryKPIs } from './SummaryKPIs'
import { SummaryCharts } from './SummaryCharts'
import { AnnualTable } from './AnnualTable'
import { getAnnualSummary } from '../actions'

interface AnnualSummaryContentProps {
    currentYear: number
    currentMonth: number
}

export async function AnnualSummaryContent({ currentYear, currentMonth }: AnnualSummaryContentProps) {
    const summaryData = await getAnnualSummary(currentYear, currentMonth !== -1 ? currentMonth : undefined)

    return (
        <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 space-y-0">
                <div className="space-y-4">
                    <SummaryKPIs
                        totals={summaryData.ars.totals}
                        currency="ARS"
                        title="Estado Financiero (Pesos)"
                    />
                    <SummaryCharts
                        monthlyData={summaryData.ars.monthly}
                        categoryData={summaryData.ars.expensesByCategory}
                        incomeCategoryData={summaryData.ars.incomeByCategory}
                        year={currentYear}
                        currency="ARS"
                    />
                </div>

                <div className="space-y-4">
                    <SummaryKPIs
                        totals={summaryData.usd.totals}
                        currency="USD"
                        title="Estado Financiero (Dólares)"
                    />
                    <SummaryCharts
                        monthlyData={summaryData.usd.monthly}
                        categoryData={summaryData.usd.expensesByCategory}
                        incomeCategoryData={summaryData.usd.incomeByCategory}
                        year={currentYear}
                        currency="USD"
                    />
                </div>
            </div>

            <AnnualTable
                monthlyDataARS={summaryData.ars.allMonths}
                monthlyDataUSD={summaryData.usd.allMonths}
            />

            <div className="mt-8 text-center text-sm text-gray-500 print:block hidden">
                <p>Generado autom&aacute;tica por Sistema de Gesti&oacute;n Iglesia</p>
                <p>{new Date().toLocaleDateString()}</p>
            </div>
        </>
    )
}

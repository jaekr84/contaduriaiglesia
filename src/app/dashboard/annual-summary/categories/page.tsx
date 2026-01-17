import { getAnnualCategoryBreakdown } from '../actions'
import { CategoryHierarchicalTable } from './components/CategoryHierarchicalTable'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Button } from "@/components/ui/button" // Assuming button component exists or we can use standard button

interface PageProps {
    searchParams: Promise<{ year?: string, type?: 'INCOME' | 'EXPENSE', currency?: 'ARS' | 'USD' }>
}

export default async function CategoriesBreakdownPage({ searchParams }: PageProps) {
    const { year, type = 'EXPENSE', currency = 'ARS' } = await searchParams
    const currentYear = year ? parseInt(year) : new Date().getFullYear()

    const breakdownData = await getAnnualCategoryBreakdown(currentYear, type, currency)

    const titleType = type === 'INCOME' ? 'Detalle de Ingresos' : 'Detalle de Gastos'
    const title = `${titleType} (${currency})`

    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex items-center space-x-4 mb-4">
                <Link href={`/dashboard/annual-summary?year=${currentYear}`}>
                    <div className="flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors">
                        <ArrowLeft className="h-4 w-4 mr-1" />
                        Volver al Resumen
                    </div>
                </Link>
            </div>

            <h2 className="text-3xl font-bold tracking-tight mb-6">{title} {currentYear}</h2>

            <CategoryHierarchicalTable data={breakdownData} />

            <div className="mt-8 text-center text-sm text-gray-500 print:block hidden">
                <p>Generado autom&aacute;tica por Sistema de Gesti&oacute;n Iglesia</p>
                <p>{new Date().toLocaleDateString()}</p>
            </div>
        </div>
    )
}

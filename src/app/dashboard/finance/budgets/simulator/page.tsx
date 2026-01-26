import { requireProfile } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { getBudgetOverview, saveAnnualBudget } from '../../budget-actions'
import { BudgetSimulatorTable } from './components/BudgetSimulatorTable'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'Simulador de Presupuesto',
}

interface Props {
    searchParams: Promise<{
        baseYear?: string
        targetYear?: string
    }>
}

export default async function BudgetSimulatorPage(props: Props) {
    const searchParams = await props.searchParams
    const profile = await requireProfile()

    if (!['ADMIN', 'TREASURER'].includes(profile.role)) {
        redirect('/dashboard/finance/budgets')
    }

    const now = new Date()
    const baseYear = searchParams.baseYear ? parseInt(searchParams.baseYear) : now.getFullYear()
    const targetYear = searchParams.targetYear ? parseInt(searchParams.targetYear) : now.getFullYear() + 1

    // Fetch base data (Annual aggregation -> month 0)
    const baseOverview = await getBudgetOverview(0, baseYear)

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Link href="/dashboard/finance/budgets" className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors">
                    <ArrowLeft className="h-5 w-5 text-zinc-500" />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Simulador de Presupuesto</h1>
                    <p className="text-sm text-zinc-500">
                        Planifica el presupuesto anual para {targetYear} basándote en datos de {baseYear}.
                    </p>
                </div>
            </div>

            <BudgetSimulatorTable
                baseOverview={baseOverview}
                baseYear={baseYear}
                targetYear={targetYear}
            />
        </div>
    )
}

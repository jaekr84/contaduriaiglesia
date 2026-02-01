import { requireProfile } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { getBudgetOverview, saveAnnualBudget, getAnnualBudgetBreakdown } from '../../budget-actions'
import { BudgetPlannerTable } from './components/BudgetPlannerTable'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'Planificador de Presupuesto',
}

interface Props {
    searchParams: Promise<{
        baseYear?: string
        targetYear?: string
    }>
}

export default async function BudgetPlannerPage(props: Props) {
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
    const { data: initialData } = await getAnnualBudgetBreakdown(targetYear)

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Link href="/dashboard/finance/budgets" className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors">
                    <ArrowLeft className="h-5 w-5 text-zinc-500" />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Planificador de Presupuesto</h1>
                    <p className="text-sm text-zinc-500">
                        Planifica el presupuesto anual para {targetYear} basándote en datos de {baseYear}.
                    </p>
                </div>
            </div>

            <BudgetPlannerTable
                baseOverview={baseOverview}
                baseYear={baseYear}
                targetYear={targetYear}
                initialData={initialData}
            />
        </div>
    )
}

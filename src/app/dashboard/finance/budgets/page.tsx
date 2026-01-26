import { getBudgetOverview } from '../budget-actions'
import { requireProfile } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { BudgetTabs } from './components/BudgetTabs'
import { BudgetList } from './components/BudgetList'
import { CopyBudgetButton } from './components/CopyBudgetButton'
import Link from 'next/link'
import { ArrowLeft, Calculator } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface Props {
    searchParams: Promise<{
        month?: string
        year?: string
    }>
}

export default async function BudgetPage(props: Props) {
    const searchParams = await props.searchParams
    const profile = await requireProfile()

    // ALLOW ALL ROLES TO VIEW, BUT ONLY ADMIN/TREASURER TO EDIT
    // if (!['ADMIN', 'TREASURER'].includes(profile.role)) {
    //     redirect('/dashboard/finance')
    // }

    const now = new Date()
    // Defaults
    const month = searchParams.month ? parseInt(searchParams.month) : now.getMonth() + 1
    const year = searchParams.year ? parseInt(searchParams.year) : now.getFullYear()

    const overview = await getBudgetOverview(month, year)

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <Link href="/dashboard/finance" className="text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-50 transition-colors">
                            <ArrowLeft className="h-5 w-5" />
                        </Link>
                        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">Presupuestos</h1>
                    </div>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">
                        Planificación y control de gastos mensuales.
                    </p>
                </div>
                <div className="w-full sm:w-auto flex items-center gap-2">
                    <Button variant="outline" size="sm" asChild className="hidden sm:flex">
                        <Link href="/dashboard/finance/budgets/simulator">
                            <Calculator className="mr-2 h-4 w-4" />
                            Simulador
                        </Link>
                    </Button>
                    <CopyBudgetButton
                        month={month}
                        year={year}
                        monthLabel={new Date(year, month - 1).toLocaleString('es-AR', { month: 'long' })}
                        userRole={profile.role}
                    />
                    <BudgetTabs />
                </div>
            </div>

            {/* Main Content */}
            <BudgetList overview={overview} month={month} year={year} userRole={profile.role} />
        </div>
    )
}

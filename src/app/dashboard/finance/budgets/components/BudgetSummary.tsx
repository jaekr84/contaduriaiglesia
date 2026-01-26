import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Wallet, TrendingUp, PiggyBank, Activity } from 'lucide-react'
import { cn } from '@/lib/utils'
import { BudgetOverview } from '../../budget-actions'

interface Props {
    overview: BudgetOverview
}

export function BudgetSummary({ overview }: Props) {
    const renderMetrics = (rows: any[], currency: string, title: string) => {
        const totalBudget = rows.reduce((acc, row) => acc + row.budgetAmount, 0)
        const totalSpent = rows.reduce((acc, row) => acc + row.spentAmount, 0)
        const totalRemaining = totalBudget - totalSpent
        const percentage = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0

        const formatter = new Intl.NumberFormat('es-AR', { style: 'currency', currency })

        return (
            <div className="mb-6">
                <h3 className="text-sm font-semibold text-zinc-500 mb-3 uppercase tracking-wider">{title}</h3>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Presupuesto</CardTitle>
                            <Wallet className="h-4 w-4 text-zinc-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{formatter.format(totalBudget)}</div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Gastado</CardTitle>
                            <TrendingUp className="h-4 w-4 text-zinc-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{new Intl.NumberFormat('es-AR', { minimumFractionDigits: 2 }).format(totalSpent)}</div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Disponible</CardTitle>
                            <PiggyBank className="h-4 w-4 text-zinc-500" />
                        </CardHeader>
                        <CardContent>
                            <div className={cn("text-2xl font-bold", totalRemaining < 0 ? "text-red-500" : "text-green-600")}>
                                {formatter.format(totalRemaining)}
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Ejecución</CardTitle>
                            <Activity className="h-4 w-4 text-zinc-500" />
                        </CardHeader>
                        <CardContent>
                            <div className={cn("text-2xl font-bold", percentage > 100 ? "text-red-500" : "text-zinc-900 dark:text-zinc-50")}>
                                {percentage.toFixed(1)}%
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        )
    }

    return (
        <div>
            {renderMetrics(overview.ARS, 'ARS', 'Pesos Argentinos (ARS)')}
            {renderMetrics(overview.USD, 'USD', 'Dólares Estadounidenses (USD)')}
        </div>
    )
}

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowDownIcon, ArrowUpIcon, DollarSign, Wallet } from "lucide-react"

interface SummaryKPIsProps {
    totals: {
        income: number
        expense: number
        balance: number
        savingsRate: number
    }
    currency?: 'ARS' | 'USD'
    title?: string
}

export function SummaryKPIs({ totals, currency = 'ARS', title }: SummaryKPIsProps) {
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('es-AR', {
            style: 'currency',
            currency: currency,
            maximumFractionDigits: 0
        }).format(amount)
    }

    return (
        <div className="space-y-2">
            {title && <h3 className="text-lg font-semibold">{title}</h3>}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Ingresos Totales</CardTitle>
                        <ArrowUpIcon className="h-4 w-4 text-emerald-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatCurrency(totals.income)}</div>
                        <p className="text-xs text-muted-foreground">
                            Acumulado anual
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Gastos Totales</CardTitle>
                        <ArrowDownIcon className="h-4 w-4 text-red-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatCurrency(totals.expense)}</div>
                        <p className="text-xs text-muted-foreground">
                            Acumulado anual
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Resultado Neto</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className={`text-2xl font-bold ${totals.balance >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                            {formatCurrency(totals.balance)}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Ingresos - Gastos
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Tasa de Ahorro</CardTitle>
                        <Wallet className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totals.savingsRate.toFixed(1)}%</div>
                        <p className="text-xs text-muted-foreground">
                            % de ingresos retenidos
                        </p>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}

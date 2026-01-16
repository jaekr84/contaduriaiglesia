import { getFinancialStatement } from './actions'
import { BalanceChart } from './components/BalanceChart'
import { Wallet, TrendingUp, Calendar } from 'lucide-react'

export default async function BalancePage() {
    const data = await getFinancialStatement()

    const formatCurrency = (amount: number, currency: string) => {
        return new Intl.NumberFormat('es-AR', {
            style: 'currency',
            currency: currency,
        }).format(amount)
    }

    const formatDate = (date: Date) => {
        return new Date(date).toLocaleString('es-AR', {
            dateStyle: 'medium',
            timeStyle: 'short'
        })
    }

    return (
        <div className="space-y-8">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">Estado Financiero</h1>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                    Saldos actuales y evolución histórica
                </p>
            </div>

            {/* Current Balance Cards */}
            <div>
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">Saldo Actual</h2>
                    <p className="text-xs text-zinc-500">
                        Actualizado: {formatDate(data.lastUpdated)}
                    </p>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                    {/* ARS Balance */}
                    <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
                        <div className="flex items-center gap-2 text-blue-600 dark:text-blue-500 mb-2">
                            <Wallet className="h-5 w-5" />
                            <span className="text-sm font-medium">Pesos Argentinos (ARS)</span>
                        </div>
                        <div className={`text-3xl font-bold ${data.currentBalance.ARS >= 0 ? 'text-green-600 dark:text-green-500' : 'text-red-600 dark:text-red-500'}`}>
                            {formatCurrency(data.currentBalance.ARS, 'ARS')}
                        </div>
                    </div>

                    {/* USD Balance */}
                    <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
                        <div className="flex items-center gap-2 text-green-600 dark:text-green-500 mb-2">
                            <Wallet className="h-5 w-5" />
                            <span className="text-sm font-medium">Dólares (USD)</span>
                        </div>
                        <div className={`text-3xl font-bold ${data.currentBalance.USD >= 0 ? 'text-green-600 dark:text-green-500' : 'text-red-600 dark:text-red-500'}`}>
                            {formatCurrency(data.currentBalance.USD, 'USD')}
                        </div>
                    </div>
                </div>
            </div>

            {/* Monthly Evolution Chart */}
            <div>
                <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50 mb-4">Evolución Mensual</h2>
                <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
                    <BalanceChart data={data.monthlyEvolution} />
                </div>
            </div>

            {/* Annual Summary */}
            <div>
                <div className="flex items-center gap-2 mb-4">
                    <Calendar className="h-5 w-5 text-zinc-500" />
                    <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">Resumen Anual {new Date().getFullYear()}</h2>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                    {/* ARS Summary */}
                    <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
                        <h3 className="text-sm font-medium text-zinc-500 dark:text-zinc-400 mb-4">Pesos Argentinos (ARS)</h3>
                        <div className="space-y-3">
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-zinc-600 dark:text-zinc-400">Ingresos</span>
                                <span className="font-semibold text-green-600 dark:text-green-500">
                                    {formatCurrency(data.annualSummary.ARS.income, 'ARS')}
                                </span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-zinc-600 dark:text-zinc-400">Gastos</span>
                                <span className="font-semibold text-red-600 dark:text-red-500">
                                    {formatCurrency(data.annualSummary.ARS.expense, 'ARS')}
                                </span>
                            </div>
                            <div className="pt-3 border-t border-zinc-200 dark:border-zinc-800">
                                <div className="flex justify-between items-center">
                                    <span className="text-sm font-medium text-zinc-900 dark:text-zinc-50">Balance Neto</span>
                                    <span className={`text-lg font-bold ${data.annualSummary.ARS.balance >= 0 ? 'text-green-600 dark:text-green-500' : 'text-red-600 dark:text-red-500'}`}>
                                        {formatCurrency(data.annualSummary.ARS.balance, 'ARS')}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* USD Summary */}
                    <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
                        <h3 className="text-sm font-medium text-zinc-500 dark:text-zinc-400 mb-4">Dólares (USD)</h3>
                        <div className="space-y-3">
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-zinc-600 dark:text-zinc-400">Ingresos</span>
                                <span className="font-semibold text-green-600 dark:text-green-500">
                                    {formatCurrency(data.annualSummary.USD.income, 'USD')}
                                </span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-zinc-600 dark:text-zinc-400">Gastos</span>
                                <span className="font-semibold text-red-600 dark:text-red-500">
                                    {formatCurrency(data.annualSummary.USD.expense, 'USD')}
                                </span>
                            </div>
                            <div className="pt-3 border-t border-zinc-200 dark:border-zinc-800">
                                <div className="flex justify-between items-center">
                                    <span className="text-sm font-medium text-zinc-900 dark:text-zinc-50">Balance Neto</span>
                                    <span className={`text-lg font-bold ${data.annualSummary.USD.balance >= 0 ? 'text-green-600 dark:text-green-500' : 'text-red-600 dark:text-red-500'}`}>
                                        {formatCurrency(data.annualSummary.USD.balance, 'USD')}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

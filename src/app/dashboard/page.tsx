import { getDashboardData } from './actions'
import { ArrowUpCircle, ArrowDownCircle, Wallet, Users, TrendingUp, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { formatDateTime } from '@/lib/utils'
import { DashboardMonthSelector } from './components/DashboardMonthSelector'
import { IncomesByCategory } from './components/IncomesByCategory'
import { ExpensesByCategory } from './components/ExpensesByCategory'
import { CurrencyExchanges } from './components/CurrencyExchanges'

interface Props {
    searchParams: Promise<{
        year?: string
        month?: string
    }>
}

export default async function DashboardPage(props: Props) {
    const searchParams = await props.searchParams
    const year = searchParams.year ? parseInt(searchParams.year) : undefined
    const month = searchParams.month ? parseInt(searchParams.month) : undefined

    const { financeSummary, recentTransactions, expensesByCategory, incomesByCategory, currencyExchanges } = await getDashboardData(year, month)

    const formatCurrency = (amount: number, currency: string = 'ARS') => {
        return new Intl.NumberFormat('es-AR', {
            style: 'currency',
            currency: currency,
        }).format(amount)
    }

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">Dashboard</h1>
                    <p className="text-zinc-500 dark:text-zinc-400">Bienvenido al panel de control de tu iglesia.</p>
                </div>
                <DashboardMonthSelector />
            </div>

            {/* Financial KPIs */}
            <div>
                <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50 mb-4">Resumen Financiero del Mes</h2>
                <div className="grid gap-4 md:grid-cols-3">
                    {/* Income Card */}
                    <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
                        <div className="flex items-center gap-2 text-green-600 dark:text-green-500 mb-2">
                            <ArrowUpCircle className="h-5 w-5" />
                            <span className="text-sm font-medium">Ingresos</span>
                        </div>
                        <div className="space-y-1">
                            <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
                                {formatCurrency(financeSummary.ARS.income, 'ARS')}
                            </div>
                            <div className="text-lg font-semibold text-zinc-500 dark:text-zinc-400">
                                {formatCurrency(financeSummary.USD.income, 'USD')}
                            </div>
                        </div>
                    </div>

                    {/* Expenses Card */}
                    <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
                        <div className="flex items-center gap-2 text-red-600 dark:text-red-500 mb-2">
                            <ArrowDownCircle className="h-5 w-5" />
                            <span className="text-sm font-medium">Gastos</span>
                        </div>
                        <div className="space-y-1">
                            <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
                                {formatCurrency(financeSummary.ARS.expense, 'ARS')}
                            </div>
                            <div className="text-lg font-semibold text-zinc-500 dark:text-zinc-400">
                                {formatCurrency(financeSummary.USD.expense, 'USD')}
                            </div>
                        </div>
                    </div>

                    {/* Balance Card */}
                    <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
                        <div className="flex items-center gap-2 text-blue-600 dark:text-blue-500 mb-2">
                            <Wallet className="h-5 w-5" />
                            <span className="text-sm font-medium">Balance</span>
                        </div>
                        <div className="space-y-1">
                            <div className={`text-2xl font-bold ${financeSummary.ARS.balance >= 0 ? 'text-green-600 dark:text-green-500' : 'text-red-600 dark:text-red-500'}`}>
                                {formatCurrency(financeSummary.ARS.balance, 'ARS')}
                            </div>
                            <div className={`text-lg font-semibold ${financeSummary.USD.balance >= 0 ? 'text-green-600 dark:text-green-500' : 'text-red-600 dark:text-red-500'}`}>
                                {formatCurrency(financeSummary.USD.balance, 'USD')}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Category Analysis & Currency Exchange */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <div className="space-y-4">
                    <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">Ingresos por Categoría</h2>
                    <IncomesByCategory incomesByCategory={incomesByCategory} />
                </div>
                <div className="space-y-4">
                    <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">Gastos por Categoría</h2>
                    <ExpensesByCategory expensesByCategory={expensesByCategory} />
                </div>
                <div className="space-y-4">
                    <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">Cambios de Moneda</h2>
                    <CurrencyExchanges currencyExchanges={currencyExchanges} />
                </div>
            </div>

            {/* Quick Actions */}
            <div>
                <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50 mb-4">Accesos Rápidos</h2>
                <div className="grid gap-4 md:grid-cols-2">
                    <Link
                        href="/dashboard/finance"
                        className="group rounded-xl border border-zinc-200 bg-white p-6 shadow-sm transition-all hover:shadow-md hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:border-zinc-700"
                    >
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="font-semibold text-zinc-900 dark:text-zinc-50">Finanzas</h3>
                                <p className="text-sm text-zinc-500 dark:text-zinc-400">Gestionar ingresos y gastos</p>
                            </div>
                            <TrendingUp className="h-6 w-6 text-zinc-400 group-hover:text-zinc-600 dark:text-zinc-600 dark:group-hover:text-zinc-400 transition-colors" />
                        </div>
                    </Link>

                    <Link
                        href="/dashboard/members"
                        className="group rounded-xl border border-zinc-200 bg-white p-6 shadow-sm transition-all hover:shadow-md hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:border-zinc-700"
                    >
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="font-semibold text-zinc-900 dark:text-zinc-50">Miembros</h3>
                                <p className="text-sm text-zinc-500 dark:text-zinc-400">Administrar miembros de la iglesia</p>
                            </div>
                            <Users className="h-6 w-6 text-zinc-400 group-hover:text-zinc-600 dark:text-zinc-600 dark:group-hover:text-zinc-400 transition-colors" />
                        </div>
                    </Link>
                </div>
            </div>
        </div>
    )
}

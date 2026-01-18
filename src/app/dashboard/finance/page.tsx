import { getFinanceSummary, getTransactions, getCategories } from './actions'
import { redirect } from 'next/navigation'
import { Plus, ArrowUpCircle, ArrowDownCircle, Wallet, Settings } from 'lucide-react'
import { CreateTransactionDialog } from './components/CreateTransactionDialog'

import { TransactionsTable } from './components/TransactionsTable'
import { NewTransactionCard } from './components/NewTransactionCard'
import { NewExchangeCard } from './components/NewExchangeCard'
import { getMembers } from '../members/actions'
import { requireProfile } from '@/lib/auth'
import Link from 'next/link'

import { QuickIncomeForm } from './components/QuickIncomeForm'
import { QuickExpenseForm } from './components/QuickExpenseForm'

interface Props {
    searchParams: Promise<{
        dateFrom?: string
        dateTo?: string
        type?: string
        categoryId?: string
        memberId?: string
        query?: string
    }>
}

export default async function FinancePage(props: Props) {
    const searchParams = await props.searchParams

    // Parse filters from searchParams
    const filters = {
        dateFrom: searchParams.dateFrom,
        dateTo: searchParams.dateTo,
        type: searchParams.type,
        categoryId: searchParams.categoryId,
        memberId: searchParams.memberId,
        query: searchParams.query,
    }

    const [profile, summary, transactions, categories, members] = await Promise.all([
        requireProfile(),
        getFinanceSummary(filters),
        getTransactions(filters),
        getCategories(),
        getMembers(),
    ])

    if (!['ADMIN', 'TREASURER'].includes(profile.role)) {
        redirect('/dashboard')
    }

    const formatCurrency = (amount: number, currency: string = 'ARS') => {
        return new Intl.NumberFormat('es-AR', {
            style: 'currency',
            currency: currency,
        }).format(amount)
    }

    return (
        <div className="space-y-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">Finanzas</h1>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">
                        Control de ingresos, gastos y diezmos.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Link
                        href="/dashboard/finance/categories"
                        className="inline-flex items-center justify-center gap-2 rounded-md border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-900 shadow-sm hover:bg-zinc-100 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-950 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50 dark:hover:bg-zinc-800"
                    >
                        <Settings className="mr-2 h-4 w-4" />
                        Categorías
                    </Link>
                    <CreateTransactionDialog categories={categories} />
                </div>
            </div>



            {/* Summary Cards */}
            <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
                    <div className="flex items-center gap-2 text-green-600 dark:text-green-500 mb-2">
                        <ArrowUpCircle className="h-5 w-5" />
                        <span className="text-sm font-medium">Ingresos</span>
                    </div>
                    <div className="space-y-1">
                        <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
                            {formatCurrency(summary.ARS.income, 'ARS')}
                        </div>
                        <div className="text-lg font-semibold text-zinc-500 dark:text-zinc-400">
                            {formatCurrency(summary.USD.income, 'USD')}
                        </div>
                    </div>
                </div>

                <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
                    <div className="flex items-center gap-2 text-red-600 dark:text-red-500 mb-2">
                        <ArrowDownCircle className="h-5 w-5" />
                        <span className="text-sm font-medium">Gastos</span>
                    </div>
                    <div className="space-y-1">
                        <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
                            {formatCurrency(summary.ARS.expense, 'ARS')}
                        </div>
                        <div className="text-lg font-semibold text-zinc-500 dark:text-zinc-400">
                            {formatCurrency(summary.USD.expense, 'USD')}
                        </div>
                    </div>
                </div>

                <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
                    <div className="flex items-center gap-2 text-blue-600 dark:text-blue-500 mb-2">
                        <Wallet className="h-5 w-5" />
                        <span className="text-sm font-medium">Balance</span>
                    </div>
                    <div className="space-y-1">
                        <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
                            {formatCurrency(summary.ARS.balance, 'ARS')}
                        </div>
                        <div className="text-lg font-semibold text-zinc-500 dark:text-zinc-400">
                            {formatCurrency(summary.USD.balance, 'USD')}
                        </div>
                    </div>
                </div>
            </div>

            {/* New Transaction Card */}
            <NewExchangeCard />

            {/* Quick Entry Forms */}
            <div className="grid gap-6 md:grid-cols-2">
                <QuickIncomeForm categories={categories} userRole={profile.role} />
                <QuickExpenseForm categories={categories} userRole={profile.role} />
            </div>

            {/* Split Transactions Tables */}
            <div className="grid gap-6 xl:grid-cols-2">
                {/* Income Table */}
                <div className="space-y-4">
                    <h2 className="text-lg font-semibold text-green-700 dark:text-green-500 flex items-center gap-2">
                        <ArrowUpCircle className="h-5 w-5" />
                        Ingresos Recientes
                    </h2>
                    <TransactionsTable
                        transactions={transactions.filter(t => t.type === 'INCOME').map(t => ({
                            ...t,
                            amount: Number(t.amount)
                        }))}
                        userRole={profile.role}
                        categories={categories}
                        variant="compact"
                    />
                </div>

                {/* Expense Table */}
                <div className="space-y-4">
                    <h2 className="text-lg font-semibold text-red-700 dark:text-red-500 flex items-center gap-2">
                        <ArrowDownCircle className="h-5 w-5" />
                        Gastos Recientes
                    </h2>
                    <TransactionsTable
                        transactions={transactions.filter(t => t.type === 'EXPENSE').map(t => ({
                            ...t,
                            amount: Number(t.amount)
                        }))}
                        userRole={profile.role}
                        categories={categories}
                        variant="compact"
                    />
                </div>
            </div>
        </div>
    )
}

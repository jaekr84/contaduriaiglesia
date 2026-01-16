import { getFinanceSummary, getTransactions, getCategories } from './actions'
import { Plus, ArrowUpCircle, ArrowDownCircle, Wallet, Settings } from 'lucide-react'
import { CreateTransactionDialog } from './components/CreateTransactionDialog'
import { getMembers } from '../members/actions'
import Link from 'next/link'

export default async function FinancePage() {
    const summary = await getFinanceSummary()
    const transactions = await getTransactions()
    const categories = await getCategories()
    const members = await getMembers()

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('es-AR', {
            style: 'currency',
            currency: 'ARS',
        }).format(amount)
    }

    return (
        <div className="space-y-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">Finanzas</h1>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">
                        Control de ingresos, gastos y diezmos del mes.
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
                    <CreateTransactionDialog categories={categories} members={members} />
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
                    <div className="flex items-center gap-2 text-green-600 dark:text-green-500">
                        <ArrowUpCircle className="h-5 w-5" />
                        <span className="text-sm font-medium">Ingresos (Mes)</span>
                    </div>
                    <div className="mt-2 text-3xl font-bold text-zinc-900 dark:text-zinc-50">
                        {formatCurrency(summary.income)}
                    </div>
                </div>

                <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
                    <div className="flex items-center gap-2 text-red-600 dark:text-red-500">
                        <ArrowDownCircle className="h-5 w-5" />
                        <span className="text-sm font-medium">Gastos (Mes)</span>
                    </div>
                    <div className="mt-2 text-3xl font-bold text-zinc-900 dark:text-zinc-50">
                        {formatCurrency(summary.expense)}
                    </div>
                </div>

                <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
                    <div className="flex items-center gap-2 text-blue-600 dark:text-blue-500">
                        <Wallet className="h-5 w-5" />
                        <span className="text-sm font-medium">Balance</span>
                    </div>
                    <div className="mt-2 text-3xl font-bold text-zinc-900 dark:text-zinc-50">
                        {formatCurrency(summary.balance)}
                    </div>
                </div>
            </div>

            {/* Transactions List */}
            <div className="rounded-md border border-zinc-200 dark:border-zinc-800">
                <div className="relative w-full overflow-auto">
                    <table className="w-full caption-bottom text-sm text-left">
                        <thead className="[&_tr]:border-b">
                            <tr className="border-b border-zinc-200 bg-zinc-50/50 hover:bg-zinc-50/50 dark:border-zinc-800 dark:bg-zinc-950/50">
                                <th className="h-12 px-4 align-middle font-medium text-zinc-500 dark:text-zinc-400">Fecha</th>
                                <th className="h-12 px-4 align-middle font-medium text-zinc-500 dark:text-zinc-400">Descripción</th>
                                <th className="h-12 px-4 align-middle font-medium text-zinc-500 dark:text-zinc-400">Categoría</th>
                                <th className="h-12 px-4 align-middle font-medium text-zinc-500 dark:text-zinc-400">Miembro</th>
                                <th className="h-12 px-4 align-middle font-medium text-zinc-500 dark:text-zinc-400 text-right">Monto</th>
                            </tr>
                        </thead>
                        <tbody className="[&_tr:last-child]:border-0">
                            {transactions.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="p-8 text-center text-zinc-500">
                                        No hay movimientos registrados este mes.
                                    </td>
                                </tr>
                            ) : (
                                transactions.map((t) => (
                                    <tr
                                        key={t.id}
                                        className="border-b border-zinc-200 transition-colors hover:bg-zinc-100/50 dark:border-zinc-800 dark:hover:bg-zinc-800/50"
                                    >
                                        <td className="p-4 align-middle text-zinc-600 dark:text-zinc-400">
                                            {new Date(t.date).toLocaleDateString('es-AR')}
                                        </td>
                                        <td className="p-4 align-middle font-medium text-zinc-900 dark:text-zinc-50">
                                            {t.description || '-'}
                                        </td>
                                        <td className="p-4 align-middle">
                                            <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-zinc-100 text-zinc-900 hover:bg-zinc-100/80 dark:bg-zinc-800 dark:text-zinc-50">
                                                {t.category.name}
                                            </span>
                                        </td>
                                        <td className="p-4 align-middle text-zinc-600 dark:text-zinc-400">
                                            {t.member ? `${t.member.firstName} ${t.member.lastName}` : '-'}
                                        </td>
                                        <td className={`p-4 align-middle text-right font-bold ${t.type === 'INCOME' ? 'text-green-600 dark:text-green-500' : 'text-red-600 dark:text-red-500'
                                            }`}>
                                            {t.type === 'INCOME' ? '+' : '-'}{formatCurrency(Number(t.amount))}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}

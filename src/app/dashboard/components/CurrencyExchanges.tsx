'use client'

import { ArrowRightLeft } from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/dateUtils'

interface CurrencyExchange {
    id: string
    date: Date
    amount: any // Prisma Decimal
    currency: string
    description: string | null
    exchangeRate?: number | null
    type: string
}

interface Props {
    currencyExchanges: CurrencyExchange[]
}

export function CurrencyExchanges({ currencyExchanges }: Props) {



    if (currencyExchanges.length === 0) {
        return null // Don't show section if no exchanges
    }

    // Calculate totals by currency
    const totals = currencyExchanges.reduce((acc, exchange) => {
        const curr = exchange.currency
        if (!acc[curr]) acc[curr] = 0
        acc[curr] += Number(exchange.amount)
        return acc
    }, {} as Record<string, number>)

    return (
        <div className="rounded-lg border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead className="border-b border-zinc-200 dark:border-zinc-800">
                        <tr>
                            <th className="px-3 py-2 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400">
                                Cambios de Moneda
                            </th>
                            <th className="px-3 py-2 text-right text-xs font-medium text-zinc-500 dark:text-zinc-400">
                                Total
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr className="group border-b border-zinc-200 dark:border-zinc-800">
                            <td className="px-3 py-2">
                                <div className="flex items-center gap-2">
                                    <ArrowRightLeft className="h-3 w-3 text-zinc-400" />
                                    <span className="font-medium text-sm text-zinc-900 dark:text-zinc-50">
                                        Cambio de Moneda ({currencyExchanges.length} movs)
                                    </span>
                                </div>
                            </td>
                            <td className="px-3 py-2 text-right">
                                <div className="space-y-1">
                                    {Object.entries(totals).map(([currency, total]) => (
                                        <div key={currency} className="font-medium text-sm text-zinc-900 dark:text-zinc-50">
                                            {formatCurrency(total, currency as 'ARS' | 'USD')}
                                        </div>
                                    ))}
                                </div>
                            </td>
                        </tr>
                        {/* Exchange Detail Rows */}
                        {currencyExchanges.map((exchange) => (
                            <tr key={exchange.id} className="bg-zinc-50 dark:bg-zinc-900/30">
                                <td className="px-3 py-1.5 pl-8">
                                    <div className="flex items-center gap-2 text-sm">
                                        <span className="text-zinc-600 dark:text-zinc-400">
                                            {formatDate(exchange.date)}
                                        </span>
                                        {exchange.description && (
                                            <>
                                                <span className="text-zinc-300 dark:text-zinc-700">•</span>
                                                <span className="text-zinc-600 dark:text-zinc-400">
                                                    {exchange.description}
                                                </span>
                                            </>
                                        )}
                                        {exchange.exchangeRate && (
                                            <>
                                                <span className="text-zinc-300 dark:text-zinc-700">•</span>
                                                <span className="text-sm text-zinc-500">
                                                    TC: {exchange.exchangeRate.toFixed(2)}
                                                </span>
                                            </>
                                        )}
                                    </div>
                                </td>
                                <td className="px-3 py-1.5 text-right">
                                    <span className={`text-sm font-medium ${exchange.type === 'INCOME' ? 'text-green-600 dark:text-green-500' : 'text-red-600 dark:text-red-500'}`}>
                                        {exchange.type === 'INCOME' ? '+' : '-'}{formatCurrency(Number(exchange.amount), exchange.currency as 'ARS' | 'USD')}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    )
}

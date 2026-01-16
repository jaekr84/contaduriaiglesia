'use client'

import { useState } from 'react'
import { ChevronDown, ChevronRight, ArrowRightLeft } from 'lucide-react'

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
    const [isExpanded, setIsExpanded] = useState(false)

    const formatCurrency = (amount: number, currency: string) => {
        return new Intl.NumberFormat('es-AR', {
            style: 'currency',
            currency: currency,
        }).format(amount)
    }

    const formatDate = (date: Date) => {
        return new Date(date).toLocaleDateString('es-AR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        })
    }

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
                            <th className="px-4 py-3 text-left text-sm font-medium text-zinc-500 dark:text-zinc-400">
                                Cambios de Moneda
                            </th>
                            <th className="px-4 py-3 text-right text-sm font-medium text-zinc-500 dark:text-zinc-400">
                                Total
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr className="group border-b border-zinc-200 dark:border-zinc-800">
                            <td className="px-4 py-3">
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => setIsExpanded(!isExpanded)}
                                        className="text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-50 transition-colors"
                                    >
                                        {isExpanded ? (
                                            <ChevronDown className="h-4 w-4" />
                                        ) : (
                                            <ChevronRight className="h-4 w-4" />
                                        )}
                                    </button>
                                    <ArrowRightLeft className="h-4 w-4 text-zinc-400" />
                                    <span className="font-medium text-zinc-900 dark:text-zinc-50">
                                        Cambio de Moneda ({currencyExchanges.length} movimientos)
                                    </span>
                                </div>
                            </td>
                            <td className="px-4 py-3 text-right">
                                <div className="space-y-1">
                                    {Object.entries(totals).map(([currency, total]) => (
                                        <div key={currency} className="font-bold text-zinc-900 dark:text-zinc-50">
                                            {formatCurrency(total, currency)}
                                        </div>
                                    ))}
                                </div>
                            </td>
                        </tr>
                        {/* Exchange Detail Rows */}
                        {isExpanded && currencyExchanges.map((exchange) => (
                            <tr key={exchange.id} className="bg-zinc-50 dark:bg-zinc-900/30">
                                <td className="px-4 py-2 pl-12">
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
                                                <span className="text-xs text-zinc-500">
                                                    TC: {exchange.exchangeRate.toFixed(2)}
                                                </span>
                                            </>
                                        )}
                                    </div>
                                </td>
                                <td className="px-4 py-2 text-right">
                                    <span className={`text-sm font-medium ${exchange.type === 'INCOME' ? 'text-green-600 dark:text-green-500' : 'text-red-600 dark:text-red-500'}`}>
                                        {exchange.type === 'INCOME' ? '+' : '-'}{formatCurrency(Number(exchange.amount), exchange.currency)}
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

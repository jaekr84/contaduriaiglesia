'use client'

import { useState } from 'react'
import { ExpensesByCategory } from './ExpensesByCategory'
import { IncomesByCategory } from './IncomesByCategory'
import { CurrencyExchanges } from './CurrencyExchanges'

interface Props {
    incomesByCategory: any[]
    expensesByCategory: any[]
    currencyExchanges: any[]
}

export function CategoryTabs({ incomesByCategory, expensesByCategory, currencyExchanges }: Props) {
    const [activeTab, setActiveTab] = useState<'income' | 'expense' | 'exchange'>('income')

    return (
        <div>
            {/* Tab Headers */}
            <div className="flex gap-2 border-b border-zinc-200 dark:border-zinc-800 mb-4">
                <button
                    onClick={() => setActiveTab('income')}
                    className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${activeTab === 'income'
                            ? 'border-zinc-900 text-zinc-900 dark:border-zinc-50 dark:text-zinc-50'
                            : 'border-transparent text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50'
                        }`}
                >
                    Ingresos por Categoría
                </button>
                <button
                    onClick={() => setActiveTab('expense')}
                    className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${activeTab === 'expense'
                            ? 'border-zinc-900 text-zinc-900 dark:border-zinc-50 dark:text-zinc-50'
                            : 'border-transparent text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50'
                        }`}
                >
                    Gastos por Categoría
                </button>
                <button
                    onClick={() => setActiveTab('exchange')}
                    className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${activeTab === 'exchange'
                            ? 'border-zinc-900 text-zinc-900 dark:border-zinc-50 dark:text-zinc-50'
                            : 'border-transparent text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50'
                        }`}
                >
                    Cambios de Moneda
                </button>
            </div>

            {/* Tab Content */}
            <div>
                {activeTab === 'income' && (
                    <IncomesByCategory incomesByCategory={incomesByCategory} />
                )}
                {activeTab === 'expense' && (
                    <ExpensesByCategory expensesByCategory={expensesByCategory} />
                )}
                {activeTab === 'exchange' && (
                    <CurrencyExchanges currencyExchanges={currencyExchanges} />
                )}
            </div>
        </div>
    )
}

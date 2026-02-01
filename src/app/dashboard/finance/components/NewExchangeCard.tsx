'use client'

import { ExchangeForm } from './ExchangeForm'

export function NewExchangeCard() {
    return (
        <div className="rounded-lg border border-zinc-200 bg-white px-4 py-3 shadow-sm dark:border-zinc-800 dark:bg-zinc-950 mb-6 border-l-4 border-l-purple-500">
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50 mb-3">Cambio de Moneda</h3>
            <ExchangeForm />
        </div>
    )
}

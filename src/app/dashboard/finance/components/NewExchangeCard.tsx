'use client'

import { ExchangeForm } from './ExchangeForm'

export function NewExchangeCard() {
    return (
        <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950 mb-8 border-l-4 border-l-purple-500">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50 mb-4">Registrar Cambio de Moneda</h2>
            <ExchangeForm />
        </div>
    )
}

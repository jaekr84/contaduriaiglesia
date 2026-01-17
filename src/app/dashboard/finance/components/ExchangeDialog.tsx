'use client'

import { useState, useTransition, useEffect } from 'react'
import { ArrowRightLeft, X, Loader2 } from 'lucide-react'
import { createExchange } from '../actions'
import { MoneyInput } from './MoneyInput'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

export function ExchangeDialog() {
    const [isOpen, setIsOpen] = useState(false)
    const [isPending, startTransition] = useTransition()
    const router = useRouter()

    const [currencyOut, setCurrencyOut] = useState('USD')
    const [currencyIn, setCurrencyIn] = useState('ARS')
    const [amountOut, setAmountOut] = useState('')
    const [amountIn, setAmountIn] = useState('')

    // Auto-swap logic
    useEffect(() => {
        if (currencyOut === 'USD') setCurrencyIn('ARS')
        else setCurrencyIn('USD')
    }, [currencyOut])

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault()
        const formData = new FormData(event.currentTarget)
        formData.set('currencyOut', currencyOut)
        formData.set('currencyIn', currencyIn)

        startTransition(async () => {
            const result = await createExchange(formData)
            if (result?.error) {
                toast.error(result.error)
            } else {
                toast.success('Cambio registrado correctamente')
                setIsOpen(false)
                setAmountOut('')
                setAmountIn('')
                router.refresh()
            }
        })
    }

    let rateDisplay = null
    if (Number(amountIn) > 0 && Number(amountOut) > 0) {
        const valOut = Number(amountOut)
        const valIn = Number(amountIn)

        // Scenario 1: USD -> ARS (Standard)
        if (currencyOut === 'USD' && currencyIn === 'ARS') {
            const r = valIn / valOut
            rateDisplay = `Tipo de cambio implícito: 1 USD = ${r.toLocaleString('es-AR', { maximumFractionDigits: 2 })} ARS`
        }
        // Scenario 2: ARS -> USD (Inverse)
        else if (currencyOut === 'ARS' && currencyIn === 'USD') {
            const r = valOut / valIn
            rateDisplay = `Tipo de cambio implícito: 1 USD = ${r.toLocaleString('es-AR', { maximumFractionDigits: 2 })} ARS`
        }
        // Scenario 3: Other
        else {
            const r = valIn / valOut
            rateDisplay = `Tipo de cambio implícito: 1 ${currencyOut} = ${r.toFixed(4)} ${currencyIn}`
        }
    }

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                className="inline-flex items-center justify-center gap-2 rounded-md border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-900 shadow-sm hover:bg-zinc-100 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-950 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50 dark:hover:bg-zinc-800"
            >
                <ArrowRightLeft className="mr-2 h-4 w-4" />
                Registrar Cambio
            </button>

            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-200">
                    <div className="relative w-full max-w-md rounded-xl bg-white p-6 shadow-lg animate-in zoom-in-95 duration-200 dark:bg-zinc-950 dark:border dark:border-zinc-800">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">Registrar Cambio de Moneda</h2>
                            <button
                                onClick={() => !isPending && setIsOpen(false)}
                                disabled={isPending}
                                className="rounded-full p-2 text-zinc-500 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <fieldset disabled={isPending} className="space-y-4 disabled:opacity-70">
                                {/* OUTFLOW */}
                                <div className="p-4 rounded-lg bg-red-50 border border-red-100 dark:bg-red-950/20 dark:border-red-900/50">
                                    <label className="text-xs font-semibold uppercase text-red-700 dark:text-red-400 mb-2 block">
                                        Salida (Entregas)
                                    </label>
                                    <div className="flex gap-2">
                                        <div className="w-24">
                                            <select
                                                value={currencyOut}
                                                onChange={(e) => setCurrencyOut(e.target.value)}
                                                className="h-9 w-full rounded-md border border-red-200 bg-white px-2 py-1 text-sm text-red-900 focus:outline-none focus:ring-1 focus:ring-red-500 dark:border-red-800 dark:bg-zinc-900 dark:text-red-100"
                                            >
                                                <option value="USD">USD</option>
                                                <option value="ARS">ARS</option>
                                            </select>
                                        </div>
                                        <div className="flex-1 relative">
                                            <MoneyInput
                                                name="amountOut"
                                                required
                                                value={amountOut}
                                                onChange={(val) => setAmountOut(val)}
                                                placeholder="Monto a entregar"
                                                className="h-9 w-full rounded-md border border-red-200 bg-white pl-3 pr-3 py-1 text-sm text-red-900 placeholder:text-red-300 focus:outline-none focus:ring-1 focus:ring-red-500 dark:border-red-800 dark:bg-zinc-900 dark:text-red-100"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="flex justify-center -my-2 z-10 relative">
                                    <div className="bg-white dark:bg-zinc-950 p-1 rounded-full border border-zinc-200 dark:border-zinc-800">
                                        <ArrowRightLeft className="h-4 w-4 text-zinc-400" />
                                    </div>
                                </div>

                                {/* INFLOW */}
                                <div className="p-4 rounded-lg bg-green-50 border border-green-100 dark:bg-green-950/20 dark:border-green-900/50">
                                    <label className="text-xs font-semibold uppercase text-green-700 dark:text-green-400 mb-2 block">
                                        Entrada (Recibes)
                                    </label>
                                    <div className="flex gap-2">
                                        <div className="w-24">
                                            <div className="flex h-9 w-full items-center justify-center rounded-md border border-green-200 bg-green-100 text-sm font-medium text-green-900 dark:border-green-800 dark:bg-green-900/50 dark:text-green-100">
                                                {currencyIn}
                                            </div>
                                        </div>
                                        <div className="flex-1 relative">
                                            <MoneyInput
                                                name="amountIn"
                                                required
                                                value={amountIn}
                                                onChange={(val) => setAmountIn(val)}
                                                placeholder="Monto a recibir"
                                                className="h-9 w-full rounded-md border border-green-200 bg-white pl-3 pr-3 py-1 text-sm text-green-900 placeholder:text-green-300 focus:outline-none focus:ring-1 focus:ring-green-500 dark:border-green-800 dark:bg-zinc-900 dark:text-green-100"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {rateDisplay && (
                                    <div className="text-center text-xs text-zinc-500 italic">
                                        {rateDisplay}
                                    </div>
                                )}

                                <div className="space-y-2 pt-2">
                                    <label className="text-sm font-medium text-zinc-900 dark:text-zinc-50">Fecha y Hora</label>
                                    <input
                                        name="date"
                                        type="datetime-local"
                                        required
                                        defaultValue={new Date().toLocaleString('sv-SE', { timeZone: 'America/Argentina/Buenos_Aires' }).replace(' ', 'T').slice(0, 16)}
                                        className="flex h-9 w-full rounded-md border border-zinc-200 bg-white px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-950 dark:border-zinc-800 dark:bg-zinc-950 dark:focus-visible:ring-zinc-300"
                                    />
                                </div>
                            </fieldset>

                            <div className="flex justify-end gap-2 mt-6">
                                <button
                                    type="button"
                                    disabled={isPending}
                                    onClick={() => setIsOpen(false)}
                                    className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors border border-zinc-200 bg-transparent text-zinc-900 shadow-sm hover:bg-zinc-100 h-9 px-4 py-2 dark:border-zinc-800 dark:text-zinc-50 dark:hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={isPending}
                                    className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors bg-zinc-900 text-zinc-50 shadow hover:bg-zinc-900/90 h-9 px-4 py-2 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-50/90 disabled:opacity-50 disabled:cursor-wait"
                                >
                                    {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Confirmar Cambio
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    )
}

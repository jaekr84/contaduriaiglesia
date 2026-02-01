'use client'

import { useState, useTransition } from 'react'
import { ArrowRight, ArrowRightLeft, Loader2, TrendingUp, TrendingDown } from 'lucide-react'
import { createExchange } from '../actions'
import { MoneyInput } from './MoneyInput'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'

export function ExchangeForm() {
    const [isPending, startTransition] = useTransition()
    const router = useRouter()

    const [operation, setOperation] = useState<'SELL_USD' | 'BUY_USD'>('SELL_USD')
    const [amountOut, setAmountOut] = useState('')
    const [amountIn, setAmountIn] = useState('')

    // Derived currencies based on operation
    const currencyOut = operation === 'SELL_USD' ? 'USD' : 'ARS'
    const currencyIn = operation === 'SELL_USD' ? 'ARS' : 'USD'

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
        let r = 0

        // Calculate USD rate
        if (currencyOut === 'USD') { // Selling USD
            r = valIn / valOut
        } else { // Buying USD
            r = valOut / valIn
        }

        rateDisplay = `1 USD ≈ ${r.toLocaleString('es-AR', { maximumFractionDigits: 2 })} ARS`
    }

    return (
        <form onSubmit={handleSubmit} className="w-full">
            <fieldset disabled={isPending} className="flex flex-col lg:flex-row gap-3 items-end disabled:opacity-70">

                {/* Date */}
                <div className="w-full lg:w-28 space-y-1">
                    <label className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">Fecha</label>
                    <input
                        name="date"
                        type="datetime-local"
                        required
                        defaultValue={new Date().toLocaleString('sv-SE', { timeZone: 'America/Argentina/Buenos_Aires' }).replace(' ', 'T').slice(0, 16)}
                        className="w-full h-8 rounded-md border-zinc-200 bg-zinc-50/50 px-2 text-xs transition-all focus:bg-white focus:ring-1 focus:ring-blue-500/20 focus:border-blue-500 dark:border-zinc-800 dark:bg-zinc-900 dark:focus:bg-zinc-950"
                    />
                </div>

                {/* Operation Toggle */}
                <div className="w-full lg:w-auto flex-shrink-0 space-y-1">
                    <label className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">Operación</label>
                    <div className="flex bg-zinc-100 p-0.5 rounded-md dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 h-8 w-full lg:w-auto">
                        <button
                            type="button"
                            onClick={() => setOperation('SELL_USD')}
                            className={cn(
                                "flex-1 lg:flex-none px-3 py-0.5 rounded text-xs font-medium transition-all flex items-center justify-center gap-1.5",
                                operation === 'SELL_USD'
                                    ? "bg-white text-emerald-600 shadow-sm ring-1 ring-black/5 dark:bg-zinc-800 dark:text-emerald-400 dark:ring-white/5"
                                    : "text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
                            )}
                        >
                            <TrendingUp className="w-3 h-3" />
                            Vender USD
                        </button>
                        <button
                            type="button"
                            onClick={() => setOperation('BUY_USD')}
                            className={cn(
                                "flex-1 lg:flex-none px-3 py-0.5 rounded text-xs font-medium transition-all flex items-center justify-center gap-1.5",
                                operation === 'BUY_USD'
                                    ? "bg-white text-blue-600 shadow-sm ring-1 ring-black/5 dark:bg-zinc-800 dark:text-blue-400 dark:ring-white/5"
                                    : "text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
                            )}
                        >
                            <TrendingDown className="w-3 h-3" />
                            Comprar USD
                        </button>
                    </div>
                </div>

                {/* Amount Out (Entregas) */}
                <div className="w-full lg:w-40 space-y-1 relative group">
                    <label className={cn(
                        "text-[10px] font-semibold uppercase tracking-wider flex justify-between",
                        operation === 'SELL_USD' ? "text-emerald-600 dark:text-emerald-400" : "text-blue-600 dark:text-blue-400"
                    )}>
                        <span>Entregas</span>
                        <span className="opacity-70 font-normal">{currencyOut}</span>
                    </label>
                    <div className="relative">
                        <MoneyInput
                            name="amountOut"
                            required
                            value={amountOut}
                            onChange={(val) => setAmountOut(val)}
                            placeholder="0,00"
                            className={cn(
                                "w-full h-8 pl-2.5 pr-2.5 text-right font-medium rounded-md border transition-all focus:ring-1 text-sm",
                                operation === 'SELL_USD'
                                    ? "bg-emerald-50/50 border-emerald-200 text-emerald-900 placeholder:text-emerald-900/30 focus:border-emerald-500 focus:ring-emerald-500/20 dark:bg-emerald-950/20 dark:border-emerald-900/50 dark:text-emerald-100 dark:placeholder:text-emerald-500/50"
                                    : "bg-blue-50/50 border-blue-200 text-blue-900 placeholder:text-blue-900/30 focus:border-blue-500 focus:ring-blue-500/20 dark:bg-blue-950/20 dark:border-blue-900/50 dark:text-blue-100 dark:placeholder:text-blue-500/50"
                            )}
                        />
                        <div className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px] font-bold opacity-50 pointer-events-none">
                            {currencyOut === 'USD' ? '$' : '$'}
                        </div>
                    </div>
                </div>

                {/* Visual Connector / Rate */}
                <div className="flex-1 min-w-[60px] flex flex-col items-center justify-end pb-1 gap-0.5 px-1">
                    {rateDisplay && (
                        <div className="text-[9px] font-medium px-1.5 py-0.5 rounded-full bg-zinc-100 text-zinc-600 border border-zinc-200 whitespace-nowrap dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-400">
                            {rateDisplay}
                        </div>
                    )}
                    <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-zinc-200 to-transparent dark:via-zinc-800 relative flex items-center justify-center">
                        <div className="w-5 h-5 rounded-full bg-white border border-zinc-200 shadow-sm flex items-center justify-center text-zinc-400 dark:bg-zinc-900 dark:border-zinc-800">
                            <ArrowRight className="w-2.5 h-2.5" />
                        </div>
                    </div>
                </div>

                {/* Amount In (Recibes) */}
                <div className="w-full lg:w-40 space-y-1 relative group">
                    <label className={cn(
                        "text-[10px] font-semibold uppercase tracking-wider flex justify-between",
                        operation === 'SELL_USD' ? "text-blue-600 dark:text-blue-400" : "text-emerald-600 dark:text-emerald-400"
                    )}>
                        <span>Recibes</span>
                        <span className="opacity-70 font-normal">{currencyIn}</span>
                    </label>
                    <div className="relative">
                        <MoneyInput
                            name="amountIn"
                            required
                            value={amountIn}
                            onChange={(val) => setAmountIn(val)}
                            placeholder="0,00"
                            className={cn(
                                "w-full h-8 pl-2.5 pr-2.5 text-right font-medium rounded-md border transition-all focus:ring-1 text-sm",
                                operation === 'SELL_USD'
                                    ? "bg-blue-50/50 border-blue-200 text-blue-900 placeholder:text-blue-900/30 focus:border-blue-500 focus:ring-blue-500/20 dark:bg-blue-950/20 dark:border-blue-900/50 dark:text-blue-100 dark:placeholder:text-blue-500/50"
                                    : "bg-emerald-50/50 border-emerald-200 text-emerald-900 placeholder:text-emerald-900/30 focus:border-emerald-500 focus:ring-emerald-500/20 dark:bg-emerald-950/20 dark:border-emerald-900/50 dark:text-emerald-100 dark:placeholder:text-emerald-500/50"
                            )}
                        />
                        <div className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px] font-bold opacity-50 pointer-events-none">
                            {currencyIn === 'USD' ? '$' : '$'}
                        </div>
                    </div>
                </div>

                <div className="hidden">
                    {/* Hidden inputs if needed */}
                </div>

                <button
                    type="submit"
                    disabled={isPending}
                    className="w-full lg:w-auto h-8 inline-flex items-center justify-center rounded-md bg-zinc-900 px-4 text-xs font-medium text-zinc-50 shadow-sm hover:translate-y-[-1px] hover:shadow-md transition-all active:translate-y-[1px] disabled:pointer-events-none disabled:opacity-50 dark:bg-zinc-50 dark:text-zinc-900"
                >
                    {isPending ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                        <>
                            <span>Confirmar</span>
                            <ArrowRight className="ml-1.5 h-3.5 w-3.5 opacity-50" />
                        </>
                    )}
                </button>
            </fieldset>
        </form>
    )
}

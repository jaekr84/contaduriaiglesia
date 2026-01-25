'use client'

import { useState } from 'react'
import { cancelTransaction } from '../actions'
import { useRouter } from 'next/navigation'
import { formatCurrency } from '@/lib/dateUtils'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { ShieldAlert } from 'lucide-react'

import { updateTransaction, TransactionWithRelations } from '../actions'

interface Props {
    transaction: TransactionWithRelations
    isOpen: boolean
    onClose: () => void
    onSuccess?: () => void
}

export function CancelTransactionDialog({ transaction, isOpen, onClose, onSuccess }: Props) {
    const [reason, setReason] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [error, setError] = useState('')
    const router = useRouter()

    if (!isOpen) return null

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!reason.trim()) {
            setError('Debes proporcionar una razón para la anulación')
            return
        }

        setIsSubmitting(true)
        setError('')

        const result = await cancelTransaction(transaction.id, reason)

        if (result.error) {
            setError(result.error)
            setIsSubmitting(false)
        } else {
            setReason('')
            if (onSuccess) {
                onSuccess()
            } else {
                onClose()
            }
            router.refresh()
        }
    }

    const categoryName = transaction.category.parent
        ? `${transaction.category.parent.name} > ${transaction.category.name}`
        : transaction.category.name

    const typeLabel = transaction.type === 'INCOME' ? 'Ingreso' : 'Egreso'
    const isExchange = transaction.description?.startsWith('TC:')

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-[500px] z-[100]">
                <DialogHeader>
                    <div className="flex items-center gap-2 mb-2">
                        <span className="inline-flex items-center justify-center rounded-full p-2 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                            <ShieldAlert className="h-5 w-5" />
                        </span>
                        <DialogTitle>Anular {isExchange ? 'Cambio de Moneda' : 'Transacción'}</DialogTitle>
                    </div>
                </DialogHeader>

                <div className="space-y-4">
                    <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg space-y-2">
                        <div className="flex justify-between">
                            <span className="text-sm text-gray-600 dark:text-gray-400">Tipo:</span>
                            <span className="font-medium text-zinc-900 dark:text-zinc-50">{typeLabel}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-sm text-gray-600 dark:text-gray-400">Monto:</span>
                            <span className="font-medium text-zinc-900 dark:text-zinc-50">
                                {formatCurrency(Number(transaction.amount), transaction.currency as 'ARS' | 'USD')}
                            </span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-sm text-gray-600 dark:text-gray-400">Categoría:</span>
                            <span className="font-medium text-right text-zinc-900 dark:text-zinc-50">{categoryName}</span>
                        </div>
                        {transaction.description && (
                            <div className="flex justify-between">
                                <span className="text-sm text-gray-600 dark:text-gray-400">Descripción:</span>
                                <span className="font-medium text-right text-zinc-900 dark:text-zinc-50">{transaction.description}</span>
                            </div>
                        )}
                        <div className="flex justify-between">
                            <span className="text-sm text-gray-600 dark:text-gray-400">Fecha:</span>
                            <span className="font-medium text-zinc-900 dark:text-zinc-50">
                                {new Date(transaction.date).toLocaleDateString('es-AR', {
                                    timeZone: 'America/Argentina/Buenos_Aires',
                                    day: '2-digit',
                                    month: '2-digit',
                                    year: 'numeric'
                                })}
                            </span>
                        </div>
                    </div>

                    {isExchange && (
                        <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                            <p className="text-sm text-yellow-800 dark:text-yellow-200 flex items-start gap-2">
                                <span className="text-lg">⚠️</span>
                                Al anular este cambio de moneda, se anularán ambas transacciones (ingreso y egreso).
                            </p>
                        </div>
                    )}

                    <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                        <p className="text-sm text-red-800 dark:text-red-200 flex items-start gap-2">
                            <span className="text-lg">⚠️</span>
                            Esta acción no se puede deshacer. La transacción será marcada como anulada y no se incluirá en los balances ni reportes.
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <label htmlFor="reason" className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
                                Razón de la anulación <span className="text-red-500">*</span>
                            </label>
                            <textarea
                                id="reason"
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                                className="w-full min-h-[80px] rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-zinc-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-800 dark:bg-zinc-950 dark:ring-offset-zinc-950 dark:placeholder:text-zinc-400 dark:focus-visible:ring-zinc-300"
                                placeholder="Ej: Error en el monto ingresado"
                                disabled={isSubmitting}
                                required
                            />
                        </div>

                        {error && (
                            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                                <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
                            </div>
                        )}

                        <DialogFooter className="gap-2 sm:gap-0">
                            <Button variant="outline" type="button" onClick={onClose} disabled={isSubmitting}>
                                Cancelar
                            </Button>
                            <Button
                                type="submit"
                                variant="destructive"
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? 'Anulando...' : 'Anular Transacción'}
                            </Button>
                        </DialogFooter>
                    </form>
                </div>
            </DialogContent>
        </Dialog>
    )
}

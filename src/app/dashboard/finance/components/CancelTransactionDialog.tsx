'use client'

import { useState } from 'react'
import { cancelTransaction } from '../actions'
import { useRouter } from 'next/navigation'
import { formatCurrency } from '@/lib/dateUtils'

interface Transaction {
    id: string
    amount: number
    currency: string
    type: string
    description: string | null
    date: Date
    category: {
        name: string
        parent: { name: string } | null
    }
}

interface Props {
    transaction: Transaction
    isOpen: boolean
    onClose: () => void
}

export function CancelTransactionDialog({ transaction, isOpen, onClose }: Props) {
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
            onClose()
            router.refresh()
        }
    }

    const categoryName = transaction.category.parent
        ? `${transaction.category.parent.name} > ${transaction.category.name}`
        : transaction.category.name

    const typeLabel = transaction.type === 'INCOME' ? 'Ingreso' : 'Egreso'
    const isExchange = transaction.description?.startsWith('TC:')

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
                <h2 className="text-xl font-bold mb-4">
                    Anular {isExchange ? 'Cambio de Moneda' : 'Transacción'}
                </h2>

                <div className="mb-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg space-y-2">
                    <div className="flex justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Tipo:</span>
                        <span className="font-medium">{typeLabel}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Monto:</span>
                        <span className="font-medium">
                            {formatCurrency(transaction.amount, transaction.currency as 'ARS' | 'USD')}
                        </span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Categoría:</span>
                        <span className="font-medium text-right">{categoryName}</span>
                    </div>
                    {transaction.description && (
                        <div className="flex justify-between">
                            <span className="text-sm text-gray-600 dark:text-gray-400">Descripción:</span>
                            <span className="font-medium text-right">{transaction.description}</span>
                        </div>
                    )}
                    <div className="flex justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Fecha:</span>
                        <span className="font-medium">
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
                    <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                        <p className="text-sm text-yellow-800 dark:text-yellow-200">
                            ⚠️ Al anular este cambio de moneda, se anularán ambas transacciones (ingreso y egreso).
                        </p>
                    </div>
                )}

                <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                    <p className="text-sm text-red-800 dark:text-red-200">
                        ⚠️ Esta acción no se puede deshacer. La transacción será marcada como anulada y no se incluirá en los balances ni reportes.
                    </p>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label htmlFor="reason" className="block text-sm font-medium mb-2">
                            Razón de la anulación <span className="text-red-500">*</span>
                        </label>
                        <textarea
                            id="reason"
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700"
                            rows={3}
                            placeholder="Ej: Error en el monto ingresado"
                            disabled={isSubmitting}
                            required
                        />
                    </div>

                    {error && (
                        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                            <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
                        </div>
                    )}

                    <div className="flex gap-3 justify-end">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                            disabled={isSubmitting}
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? 'Anulando...' : 'Anular Transacción'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}

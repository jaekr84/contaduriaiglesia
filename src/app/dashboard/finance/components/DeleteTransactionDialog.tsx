'use client'

import { useState } from 'react'
import { deleteTransaction } from '../actions'
import { useRouter } from 'next/navigation'
import { formatCurrency } from '@/lib/dateUtils'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Trash2, AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'

import { TransactionWithRelations } from '../actions'

interface Props {
    transaction: TransactionWithRelations
    isOpen: boolean
    onClose: () => void
    onSuccess?: () => void
}

export function DeleteTransactionDialog({ transaction, isOpen, onClose, onSuccess }: Props) {
    const [isSubmitting, setIsSubmitting] = useState(false)
    const router = useRouter()

    const handleDelete = async () => {
        setIsSubmitting(true)

        const result = await deleteTransaction(transaction.id)

        if (result.error) {
            toast.error(result.error)
            setIsSubmitting(false)
        } else {
            toast.success('Transacción eliminada permanentemente')
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

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-[500px] z-[100]">
                <DialogHeader>
                    <div className="flex items-center gap-2 mb-2">
                        <span className="inline-flex items-center justify-center rounded-full p-2 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                            <Trash2 className="h-5 w-5" />
                        </span>
                        <DialogTitle>Eliminar Permanentemente</DialogTitle>
                    </div>
                    <DialogDescription>
                        Esta acción es irreversible y eliminará el registro de la base de datos por completo.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    <div className="p-4 bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30 rounded-lg space-y-2">
                        <div className="flex justify-between text-sm">
                            <span className="text-red-700/70 dark:text-red-400/70">Monto:</span>
                            <span className="font-bold text-red-700 dark:text-red-400">
                                {formatCurrency(Number(transaction.amount), transaction.currency as 'ARS' | 'USD')}
                            </span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-red-700/70 dark:text-red-400/70">Categoría:</span>
                            <span className="font-medium text-red-700 dark:text-red-400">{categoryName}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-red-700/70 dark:text-red-400/70">Fecha:</span>
                            <span className="font-medium text-red-700 dark:text-red-400">
                                {new Date(transaction.date).toLocaleDateString('es-AR')}
                            </span>
                        </div>
                    </div>

                    <div className="flex items-start gap-3 p-3 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-900/30 rounded-lg">
                        <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
                        <div className="text-xs text-amber-800 dark:text-amber-200 space-y-1">
                            <p className="font-semibold">¿Por qué usar esta opción?</p>
                            <p>Use esta opción solo para corregir errores graves de carga. Para devoluciones o cancelaciones normales, use la opción "Anular".</p>
                        </div>
                    </div>

                    <DialogFooter className="gap-2 sm:gap-0 mt-4">
                        <Button variant="outline" type="button" onClick={onClose} disabled={isSubmitting}>
                            Cancelar
                        </Button>
                        <Button
                            variant="destructive"
                            disabled={isSubmitting}
                            onClick={handleDelete}
                        >
                            {isSubmitting ? 'Eliminando...' : 'Confirmar Eliminación'}
                        </Button>
                    </DialogFooter>
                </div>
            </DialogContent>
        </Dialog>
    )
}

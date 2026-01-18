'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { formatDateTime, formatCurrency } from '@/lib/dateUtils'
import { X, Calendar, Tag, CreditCard, User, Mail, ShieldAlert } from 'lucide-react'
import { useState } from 'react'

interface Transaction {
    id: string
    amount: number
    currency: string
    type: string
    description: string | null
    date: Date
    cancelledAt: Date | null
    cancellationReason: string | null
    category: {
        name: string
        parent: { name: string } | null
    }
    member: {
        firstName: string
        lastName: string
    } | null
    createdBy: {
        fullName: string | null
        email: string
    } | null
}

interface Props {
    transaction: Transaction
    isOpen: boolean
    onClose: () => void
    onCancel?: () => void
    canCancel: boolean
}

export function TransactionDetailDialog({ transaction, isOpen, onClose, onCancel, canCancel }: Props) {

    const handleCancelClick = () => {
        if (onCancel) {
            onCancel()
        }
    }

    const isIncome = transaction.type === 'INCOME'

    return (
        <>
            <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <div className="flex items-center gap-2 mb-2">
                            <span className={`inline-flex items-center justify-center rounded-full p-2 ${isIncome ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>
                                <CreditCard className="h-5 w-5" />
                            </span>
                            <DialogTitle>Detalle de Transacción</DialogTitle>
                        </div>
                        <DialogDescription>
                            ID: {transaction.id}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-6 py-4">
                        {/* Amount & Type */}
                        <div className="text-center">
                            <div className={`text-4xl font-bold ${isIncome ? 'text-green-600 dark:text-green-500' : 'text-red-600 dark:text-red-500'}`}>
                                {isIncome ? '+' : '-'}{formatCurrency(transaction.amount, transaction.currency as 'ARS' | 'USD')}
                            </div>
                            <div className="mt-2 inline-flex items-center rounded-md border border-zinc-200 bg-zinc-50 px-2.5 py-0.5 text-xs font-semibold text-zinc-900 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-50">
                                {isIncome ? 'Ingreso' : 'Gasto'}
                            </div>
                            {transaction.cancelledAt && (
                                <div className="mt-4 space-y-2">
                                    <span className="inline-flex items-center gap-1 rounded-md bg-red-50 px-2 py-1 text-xs font-medium text-red-700 dark:bg-red-900/20 dark:text-red-400">
                                        <ShieldAlert className="h-3 w-3" />
                                        Transacción Anulada
                                    </span>
                                    {transaction.cancellationReason && (
                                        <p className="text-sm text-red-600 dark:text-red-400 max-w-xs mx-auto">
                                            "{transaction.cancellationReason}"
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Details Grid */}
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="space-y-1">
                                <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400 flex items-center gap-1">
                                    <Calendar className="h-3 w-3" /> Fecha
                                </label>
                                <div className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
                                    {formatDateTime(transaction.date)}
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400 flex items-center gap-1">
                                    <Tag className="h-3 w-3" /> Categoría
                                </label>
                                <div className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
                                    {transaction.category.parent ? (
                                        <>
                                            {transaction.category.parent.name}
                                            <span className="text-zinc-400 mx-1">/</span>
                                            {transaction.category.name}
                                        </>
                                    ) : (
                                        transaction.category.name
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Descripción</label>
                            <div className="text-sm text-zinc-900 dark:text-zinc-50 bg-zinc-50 dark:bg-zinc-900/50 p-3 rounded-md border border-zinc-100 dark:border-zinc-800">
                                {transaction.description || 'Sin descripción'}
                            </div>
                        </div>

                        {/* User & Member Info */}
                        <div className="rounded-lg border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-950">
                            <div className="space-y-3">
                                {transaction.member && (
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs text-zinc-500 flex items-center gap-1">
                                            <User className="h-3 w-3" /> Miembro asociado
                                        </span>
                                        <span className="text-sm font-medium">
                                            {transaction.member.firstName} {transaction.member.lastName}
                                        </span>
                                    </div>
                                )}
                                <div className="flex items-center justify-between">
                                    <span className="text-xs text-zinc-500 flex items-center gap-1">
                                        <Mail className="h-3 w-3" /> Registrado por
                                    </span>
                                    <span className="text-sm text-zinc-600 dark:text-zinc-400">
                                        {transaction.createdBy?.fullName || transaction.createdBy?.email || 'Sistema'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button variant="outline" onClick={onClose} className="w-full sm:w-auto">
                            Cerrar
                        </Button>
                        {canCancel && !transaction.cancelledAt && (
                            <Button
                                variant="destructive"
                                onClick={handleCancelClick}
                                className="w-full sm:w-auto"
                            >
                                Anular Transacción
                            </Button>
                        )}
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    )
}

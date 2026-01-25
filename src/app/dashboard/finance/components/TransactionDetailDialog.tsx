'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { formatDateTime, formatCurrency } from '@/lib/dateUtils'
import { Calendar, Tag, CreditCard, User, Mail, ShieldAlert, Trash2, Pencil, Check, X, Layers } from 'lucide-react'
import { useState, useTransition, useEffect } from 'react'
import { toast } from 'sonner'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Category, Currency } from '@prisma/client'
import { updateTransaction, TransactionWithRelations } from '../actions'

interface Props {
    transaction: TransactionWithRelations
    isOpen: boolean
    onClose: () => void
    onCancel?: () => void
    onDelete?: () => void
    canCancel: boolean
    isAdmin?: boolean
    categories: (Category & { subcategories: Category[] })[]
}

export function TransactionDetailDialog({ transaction, isOpen, onClose, onCancel, onDelete, canCancel, isAdmin, categories }: Props) {
    const [isEditing, setIsEditing] = useState(false)
    const [tempAmount, setTempAmount] = useState(transaction.amount.toString())
    const [tempCurrency, setTempCurrency] = useState(transaction.currency)
    const [isPending, startTransition] = useTransition()

    // Determine initial category and subcategory
    const [selectedParentId, setSelectedParentId] = useState<string>('')
    const [selectedCategoryId, setSelectedCategoryId] = useState<string>(transaction.categoryId)

    useEffect(() => {
        if (isOpen) {
            setTempAmount(transaction.amount.toString())
            setTempCurrency(transaction.currency)

            if (transaction.category.parentId) {
                setSelectedParentId(transaction.category.parentId)
                setSelectedCategoryId(transaction.categoryId)
            } else {
                setSelectedParentId(transaction.categoryId)
                setSelectedCategoryId('')
            }
        }
    }, [isOpen, transaction])

    const filteredCategories = categories.filter(c => c.type === transaction.type && c.parentId === null)
    const selectedParent = categories.find(c => c.id === selectedParentId)
    const availableSubcategories = selectedParent?.subcategories || []

    const handleCancelClick = () => {
        if (onCancel) {
            onCancel()
        }
    }

    const handleSave = () => {
        const amountNum = parseFloat(tempAmount)
        if (isNaN(amountNum) || amountNum <= 0) {
            toast.error('Monto inválido')
            return
        }

        startTransition(async () => {
            const finalCategoryId = selectedCategoryId && selectedCategoryId !== 'none' ? selectedCategoryId : selectedParentId

            if (!finalCategoryId) {
                toast.error('Debes seleccionar una categoría')
                return
            }

            const result = await updateTransaction(transaction.id, {
                amount: amountNum,
                currency: tempCurrency as 'ARS' | 'USD',
                categoryId: finalCategoryId
            })
            if (result.success) {
                toast.success('Transacción actualizada')
                setIsEditing(false)
            } else {
                toast.error(result.error || 'Error al actualizar')
            }
        })
    }

    const resetEditing = () => {
        setIsEditing(false)
        setTempAmount(transaction.amount.toString())
        setTempCurrency(transaction.currency)
        if (transaction.category.parentId) {
            setSelectedParentId(transaction.category.parentId)
            setSelectedCategoryId(transaction.categoryId)
        } else {
            setSelectedParentId(transaction.categoryId)
            setSelectedCategoryId('')
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
                            {isEditing ? (
                                <div className="flex flex-col items-center gap-3 max-w-[240px] mx-auto">
                                    <div className="flex items-center gap-2">
                                        <Input
                                            type="number"
                                            step="0.01"
                                            value={tempAmount}
                                            onChange={(e) => setTempAmount(e.target.value)}
                                            className="text-2xl font-bold text-center h-12"
                                            autoFocus
                                        />
                                        <Select value={tempCurrency} onValueChange={(val) => setTempCurrency(val as Currency)}>
                                            <SelectTrigger className="w-[80px] h-12">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="ARS">ARS</SelectItem>
                                                <SelectItem value="USD">USD</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="flex gap-2 w-full">
                                        <Button
                                            size="sm"
                                            className="flex-1"
                                            onClick={handleSave}
                                            disabled={isPending}
                                        >
                                            <Check className="h-4 w-4 mr-1" /> Guardar
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            className="flex-1"
                                            onClick={resetEditing}
                                            disabled={isPending}
                                        >
                                            <X className="h-4 w-4 mr-1" /> Cancelar
                                        </Button>
                                    </div>
                                </div>
                            ) : (
                                <div className="group relative inline-block">
                                    <div className={`text-4xl font-bold ${isIncome ? 'text-green-600 dark:text-green-500' : 'text-red-600 dark:text-red-500'}`}>
                                        {isIncome ? '+' : '-'}{formatCurrency(Number(transaction.amount), transaction.currency as 'ARS' | 'USD')}
                                    </div>
                                </div>
                            )}
                            <div className="mt-3">
                                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium border ${isIncome
                                    ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800'
                                    : 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800'}`}>
                                    {isIncome ? 'Ingreso' : 'Egreso'}
                                </span>
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
                                    {isEditing ? (
                                        <div className="space-y-2 mt-1">
                                            <Select value={selectedParentId} onValueChange={(val) => {
                                                setSelectedParentId(val)
                                                setSelectedCategoryId('') // Reset subcategory when parent changes
                                            }}>
                                                <SelectTrigger className="w-full h-9 text-xs">
                                                    <SelectValue placeholder="Categoría" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {filteredCategories.map(cat => (
                                                        <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>

                                            {availableSubcategories.length > 0 && (
                                                <Select value={selectedCategoryId} onValueChange={setSelectedCategoryId}>
                                                    <SelectTrigger className="w-full h-9 text-xs">
                                                        <SelectValue placeholder="Subcategoría" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="none">Sin subcategoría</SelectItem>
                                                        {availableSubcategories.map(sub => (
                                                            <SelectItem key={sub.id} value={sub.id}>{sub.name}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            )}
                                        </div>
                                    ) : (
                                        transaction.category.parent ? (
                                            <>
                                                {transaction.category.parent.name}
                                                <span className="text-zinc-400 mx-1">/</span>
                                                {transaction.category.name}
                                            </>
                                        ) : (
                                            transaction.category.name
                                        )
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

                        {/* Info Sections */}
                        <div className="space-y-4 pt-4 border-t border-zinc-100 dark:border-zinc-800">
                            {transaction.member && (
                                <div className="flex items-center justify-between text-sm py-1">
                                    <div className="flex items-center gap-2 text-zinc-500">
                                        <User className="h-4 w-4" />
                                        <span>Miembro asociado</span>
                                    </div>
                                    <span className="font-medium text-zinc-900 dark:text-zinc-100">
                                        {transaction.member.firstName} {transaction.member.lastName}
                                    </span>
                                </div>
                            )}
                            <div className="flex items-center justify-between text-sm py-1">
                                <div className="flex items-center gap-2 text-zinc-500">
                                    <Mail className="h-4 w-4" />
                                    <span>Registrado por</span>
                                </div>
                                <span className="font-medium text-zinc-600 dark:text-zinc-400">
                                    {transaction.createdBy?.fullName || transaction.createdBy?.email || 'Sistema'}
                                </span>
                            </div>
                        </div>
                    </div>

                    <DialogFooter className="flex-col sm:flex-row gap-3 pt-6 border-t border-zinc-100 dark:border-zinc-800">
                        <div className="flex flex-wrap gap-2 w-full">
                            <Button variant="outline" onClick={onClose} className="flex-1 sm:flex-none order-last sm:order-first">
                                Cerrar
                            </Button>

                            {!isEditing && (
                                <Button
                                    variant="outline"
                                    onClick={() => setIsEditing(true)}
                                    className="flex-1 sm:flex-none"
                                >
                                    <Pencil className="h-4 w-4 mr-2" />
                                    Editar
                                </Button>
                            )}

                            {canCancel && !transaction.cancelledAt && !isEditing && (
                                <Button
                                    variant="destructive"
                                    onClick={handleCancelClick}
                                    className="flex-1 sm:flex-none"
                                >
                                    <ShieldAlert className="h-4 w-4 mr-2" />
                                    Anular
                                </Button>
                            )}

                            {isAdmin && (
                                <Button
                                    variant="ghost"
                                    onClick={onDelete}
                                    className="flex-1 sm:flex-none text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                                >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Eliminar
                                </Button>
                            )}
                        </div>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    )
}

'use client'

import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { AlertTriangle, ArrowRight } from "lucide-react"

export interface DuplicateData {
    id: string
    date: Date
    amount: number
    currency: string
    categoryName: string
    description: string | null
}

interface DuplicateWarningDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onConfirm: () => void
    onCancel: () => void
    newTransaction: {
        amount: number
        date: Date
        description: string
        currency: string
        categoryName: string
    }
    duplicates: DuplicateData[]
    isPending?: boolean
}

export function DuplicateWarningDialog({
    open,
    onOpenChange,
    onConfirm,
    onCancel,
    newTransaction,
    duplicates,
    isPending
}: DuplicateWarningDialogProps) {
    if (!duplicates.length) return null



    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent className="max-w-2xl">
                <AlertDialogHeader>
                    <div className="flex items-center gap-2 text-amber-600 dark:text-amber-500 mb-2">
                        <AlertTriangle className="h-6 w-6" />
                        <AlertDialogTitle>Posible Gasto Duplicado</AlertDialogTitle>
                    </div>
                    <AlertDialogDescription>
                        Hemos detectado una transacción muy similar registrada este mes.
                        ¿Deseas guardar este gasto de todos modos?
                    </AlertDialogDescription>
                </AlertDialogHeader>

                <div className="flex flex-col gap-6 py-4">
                    {/* Nuevo Gasto (Intento) */}
                    <div className="bg-zinc-50 dark:bg-zinc-900/50 p-4 rounded-lg border border-zinc-200 dark:border-zinc-800">
                        <h4 className="font-medium text-sm text-zinc-500 uppercase tracking-wider mb-3">Estás intentando crear:</h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                                <span className="block text-zinc-500 text-xs">Fecha</span>
                                <span className="font-medium">{format(newTransaction.date, "dd/MM/yyyy", { locale: es })}</span>
                            </div>
                            <div>
                                <span className="block text-zinc-500 text-xs">Monto</span>
                                <span className="font-bold text-zinc-900 dark:text-zinc-100">
                                    {newTransaction.currency} ${newTransaction.amount.toLocaleString("es-AR")}
                                </span>
                            </div>
                            <div>
                                <span className="block text-zinc-500 text-xs">Categoría</span>
                                <span className="font-medium">{newTransaction.categoryName}</span>
                            </div>
                            <div>
                                <span className="block text-zinc-500 text-xs">Descripción</span>
                                <span className="font-medium italic text-zinc-700 dark:text-zinc-300">
                                    "{newTransaction.description || "Sin descripción"}"
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Lista de Duplicados */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <h4 className="font-medium text-sm text-amber-600 dark:text-amber-500 uppercase tracking-wider flex items-center gap-2">
                                <AlertTriangle className="h-4 w-4" />
                                {duplicates.length} Coincidencia{duplicates.length !== 1 ? 's' : ''} Encontrada{duplicates.length !== 1 ? 's' : ''}
                            </h4>
                        </div>

                        <div className="border border-amber-200 bg-amber-50/50 dark:border-amber-900/30 dark:bg-amber-950/10 rounded-lg overflow-hidden">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-amber-100/50 dark:bg-amber-900/20 text-amber-900 dark:text-amber-100 font-medium">
                                    <tr>
                                        <th className="px-4 py-2">Fecha</th>
                                        <th className="px-4 py-2">Categoría</th>
                                        <th className="px-4 py-2">Descripción</th>
                                        <th className="px-4 py-2 text-right">Monto</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-amber-200/50 dark:divide-amber-900/30">
                                    {duplicates.map((dup) => (
                                        <tr key={dup.id} className="hover:bg-amber-100/30 transition-colors">
                                            <td className="px-4 py-2.5 whitespace-nowrap text-amber-900 dark:text-amber-100">
                                                {format(new Date(dup.date), "dd/MM/yyyy", { locale: es })}
                                            </td>
                                            <td className="px-4 py-2.5 text-amber-900 dark:text-amber-100">
                                                {dup.categoryName}
                                            </td>
                                            <td className="px-4 py-2.5 italic text-amber-800 dark:text-amber-200/80">
                                                "{dup.description || "Sin descripción"}"
                                            </td>
                                            <td className="px-4 py-2.5 text-right font-medium text-amber-900 dark:text-amber-100 whitespace-nowrap">
                                                {dup.currency} ${dup.amount.toLocaleString("es-AR")}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                <div className="bg-blue-50 text-blue-800 text-xs p-3 rounded-md flex items-start gap-2 dark:bg-blue-950/30 dark:text-blue-200">
                    <div className="mt-0.5"><ArrowRight className="h-3 w-3" /></div>
                    <p>
                        Si confirmas, se creará un nuevo registro adicional. Si es un pago parcial o recurrente, puedes continuar sin problemas.
                    </p>
                </div>

                <AlertDialogFooter className="mt-4">
                    <AlertDialogCancel onClick={onCancel}>Cancelar</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={(e) => {
                            e.preventDefault()
                            onConfirm()
                        }}
                        disabled={isPending}
                        className="bg-zinc-900 dark:bg-zinc-50"
                    >
                        {isPending ? "Guardando..." : "Guardar de todos modos"}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}

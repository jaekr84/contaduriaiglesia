'use client'

import { useState } from 'react'
import { Copy } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { copyBudgetToAllMonths } from '../../budget-actions'
import { toast } from 'sonner' // Assuming sonner is used, or use toast from ui
// import { useToast } from "@/components/ui/use-toast"

interface Props {
    month: number
    year: number
    monthLabel: string
    userRole: string
}

export function CopyBudgetButton({ month, year, monthLabel, userRole }: Props) {
    const [isLoading, setIsLoading] = useState(false)
    const canEdit = ['ADMIN', 'TREASURER'].includes(userRole)

    if (month === 0 || !canEdit) return null // Don't show on Annual view or if not authorized

    const handleCopy = async () => {
        setIsLoading(true)
        try {
            const result = await copyBudgetToAllMonths(year, month)
            if (result.error) {
                toast.error(result.error)
            } else {
                toast.success('Presupuesto replicado correctamente')
            }
        } catch (error) {
            toast.error('Ocurrió un error inesperado')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <AlertDialog>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>¿Replicar presupuesto?</AlertDialogTitle>
                    <AlertDialogDescription>
                        Esta acción copiará el presupuesto de <strong>{monthLabel} {year}</strong> a todos los demás meses del año {year}.
                        <br /><br />
                        <span className="text-red-600 font-bold block mt-2">
                            ⚠️ ADVERTENCIA: Esta acción es irreversible y sobrescribirá los datos existentes en el resto de los meses.
                        </span>
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={handleCopy}
                        disabled={isLoading}
                        className="bg-red-600 hover:bg-red-700 text-white focus:ring-red-600"
                    >
                        {isLoading ? 'Copiando...' : 'Entiendo, replicar todo'}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}

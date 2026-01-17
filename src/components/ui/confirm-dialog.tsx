"use client"

import * as React from "react"
import { Button } from "./button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "./dialog"
import { AlertTriangle } from "lucide-react"

interface ConfirmDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    title: string
    description: string
    confirmText?: string
    cancelText?: string
    onConfirm: () => void | Promise<void>
    destructive?: boolean
    requiresCheckbox?: boolean
    checkboxLabel?: string
}

export function ConfirmDialog({
    open,
    onOpenChange,
    title,
    description,
    confirmText = "Confirmar",
    cancelText = "Cancelar",
    onConfirm,
    destructive = false,
    requiresCheckbox = false,
    checkboxLabel = "Entiendo que esta acción es irreversible",
}: ConfirmDialogProps) {
    const [loading, setLoading] = React.useState(false)
    const [checked, setChecked] = React.useState(false)

    const handleConfirm = async () => {
        if (requiresCheckbox && !checked) return

        setLoading(true)
        try {
            await onConfirm()
            onOpenChange(false)
            setChecked(false)
        } catch (error) {
            console.error("Error in confirmation action:", error)
        } finally {
            setLoading(false)
        }
    }

    const handleCancel = () => {
        setChecked(false)
        onOpenChange(false)
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <div className="flex items-center gap-3">
                        {destructive && (
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100">
                                <AlertTriangle className="h-5 w-5 text-red-600" />
                            </div>
                        )}
                        <DialogTitle className="text-left">{title}</DialogTitle>
                    </div>
                    <DialogDescription className="text-left pt-2">
                        {description}
                    </DialogDescription>
                </DialogHeader>

                {requiresCheckbox && (
                    <div className="flex items-center space-x-2 py-4">
                        <input
                            type="checkbox"
                            id="confirm-checkbox"
                            checked={checked}
                            onChange={(e) => setChecked(e.target.checked)}
                            className="h-4 w-4 rounded border-zinc-300 text-zinc-900 focus:ring-2 focus:ring-zinc-950"
                        />
                        <label
                            htmlFor="confirm-checkbox"
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                            {checkboxLabel}
                        </label>
                    </div>
                )}

                <DialogFooter>
                    <Button
                        type="button"
                        variant="outline"
                        onClick={handleCancel}
                        disabled={loading}
                    >
                        {cancelText}
                    </Button>
                    <Button
                        type="button"
                        variant={destructive ? "destructive" : "default"}
                        onClick={handleConfirm}
                        disabled={loading || (requiresCheckbox && !checked)}
                    >
                        {loading ? "Procesando..." : confirmText}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

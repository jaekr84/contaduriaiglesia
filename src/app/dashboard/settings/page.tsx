'use client'

import { useState, useEffect, useTransition } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { ShieldCheck, Settings as SettingsIcon } from 'lucide-react'
import { getSettings, updateAuditSetting } from './actions'
import { toast } from 'sonner'

export default function SettingsPage() {
    const [auditEnabled, setAuditEnabled] = useState(true)
    const [loading, setLoading] = useState(true)
    const [isPending, startTransition] = useTransition()

    useEffect(() => {
        async function loadSettings() {
            try {
                const settings = await getSettings()
                setAuditEnabled(settings.auditEnabled)
            } catch (error) {
                console.error('Error loading settings:', error)
                toast.error('Error al cargar la configuración')
            } finally {
                setLoading(false)
            }
        }
        loadSettings()
    }, [])

    const handleToggleAudit = (enabled: boolean) => {
        setAuditEnabled(enabled)
        startTransition(async () => {
            const result = await updateAuditSetting(enabled)
            if (result.success) {
                toast.success(`Registro de auditoría ${enabled ? 'habilitado' : 'deshabilitado'}`)
            } else {
                toast.error(result.error || 'Error al actualizar')
                setAuditEnabled(!enabled) // Rollback
            }
        })
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-zinc-900 dark:border-zinc-50"></div>
            </div>
        )
    }

    return (
        <div className="space-y-6 max-w-2xl mx-auto">
            <div className="flex items-center gap-2 mb-8">
                <SettingsIcon className="h-6 w-6 text-zinc-900 dark:text-zinc-50" />
                <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">Configuración</h1>
            </div>

            <Card>
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <ShieldCheck className="h-5 w-5 text-zinc-900 dark:text-zinc-50" />
                        <CardTitle>Seguridad y Auditoría</CardTitle>
                    </div>
                    <CardDescription>
                        Controla cómo se registran las acciones en el sistema.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="flex items-center justify-between space-x-4">
                        <div className="flex flex-col space-y-1">
                            <Label htmlFor="audit-toggle">Registro de Auditoría</Label>
                            <span className="text-sm text-zinc-500 dark:text-zinc-400">
                                Cuando está activo, se guardarán logs de creaciones, ediciones y eliminaciones de registros.
                            </span>
                        </div>
                        <Switch
                            id="audit-toggle"
                            checked={auditEnabled}
                            onCheckedChange={handleToggleAudit}
                            disabled={isPending}
                        />
                    </div>

                    {!auditEnabled && (
                        <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                            <p className="text-sm text-amber-800 dark:text-amber-200">
                                <strong>Atención:</strong> Deshabilitar la auditoría impedirá el seguimiento de acciones críticas. Use esta opción con precaución.
                            </p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}

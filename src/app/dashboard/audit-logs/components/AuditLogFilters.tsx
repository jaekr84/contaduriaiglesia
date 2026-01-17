'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Download, Filter, X } from 'lucide-react'
import { toast } from 'sonner'

interface Props {
    availableYears: number[]
}

export function AuditLogFilters({ availableYears }: Props) {
    const router = useRouter()
    const searchParams = useSearchParams()
    const [isExporting, setIsExporting] = useState(false)
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
    const [showFilters, setShowFilters] = useState(false)

    const handleFilterChange = (key: string, value: string) => {
        const params = new URLSearchParams(searchParams.toString())
        if (value) {
            params.set(key, value)
        } else {
            params.delete(key)
        }
        params.delete('page') // Reset to page 1 when filtering
        router.push(`/dashboard/audit-logs?${params.toString()}`)
    }

    const handleClearFilters = () => {
        router.push('/dashboard/audit-logs')
    }

    const handleExport = async () => {
        if (!selectedYear) {
            toast.error('Selecciona un año para exportar')
            return
        }

        setIsExporting(true)
        try {
            const response = await fetch(`/dashboard/audit-logs/export?year=${selectedYear}`)

            if (!response.ok) {
                const error = await response.json()
                toast.error(error.error || 'Error al exportar')
                return
            }

            const blob = await response.blob()
            const url = window.URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = `audit-logs-${selectedYear}.xlsx`
            document.body.appendChild(a)
            a.click()
            window.URL.revokeObjectURL(url)
            document.body.removeChild(a)

            toast.success(`Logs de ${selectedYear} exportados y eliminados de la base de datos`)
            router.refresh()
        } catch (error) {
            console.error('Export error:', error)
            toast.error('Error al exportar logs')
        } finally {
            setIsExporting(false)
        }
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <button
                    onClick={() => setShowFilters(!showFilters)}
                    className="inline-flex items-center gap-2 px-4 py-2 text-sm border rounded-md hover:bg-muted"
                >
                    <Filter className="h-4 w-4" />
                    {showFilters ? 'Ocultar Filtros' : 'Mostrar Filtros'}
                </button>

                <div className="flex items-center gap-2">
                    <select
                        value={selectedYear}
                        onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                        className="px-3 py-2 text-sm border rounded-md"
                    >
                        {availableYears.map((year) => (
                            <option key={year} value={year}>
                                {year}
                            </option>
                        ))}
                    </select>
                    <button
                        onClick={handleExport}
                        disabled={isExporting}
                        className="inline-flex items-center gap-2 px-4 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50"
                    >
                        <Download className="h-4 w-4" />
                        {isExporting ? 'Exportando...' : 'Exportar Año'}
                    </button>
                </div>
            </div>

            {showFilters && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4 border rounded-lg bg-muted/30">
                    <div>
                        <label className="block text-sm font-medium mb-1">Fecha Desde</label>
                        <input
                            type="date"
                            defaultValue={searchParams.get('dateFrom') || ''}
                            onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                            className="w-full px-3 py-2 text-sm border rounded-md"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">Fecha Hasta</label>
                        <input
                            type="date"
                            defaultValue={searchParams.get('dateTo') || ''}
                            onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                            className="w-full px-3 py-2 text-sm border rounded-md"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">Tipo de Evento</label>
                        <select
                            defaultValue={searchParams.get('eventType') || ''}
                            onChange={(e) => handleFilterChange('eventType', e.target.value)}
                            className="w-full px-3 py-2 text-sm border rounded-md"
                        >
                            <option value="">Todos</option>
                            <option value="LOGIN_SUCCESS">Login Exitoso</option>
                            <option value="LOGIN_FAILED">Login Fallido</option>
                            <option value="LOGOUT">Logout</option>
                            <option value="TRANSACTION_CREATED">Transacción Creada</option>
                            <option value="TRANSACTION_UPDATED">Transacción Actualizada</option>
                            <option value="TRANSACTION_DELETED">Transacción Eliminada</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">Severidad</label>
                        <select
                            defaultValue={searchParams.get('severity') || ''}
                            onChange={(e) => handleFilterChange('severity', e.target.value)}
                            className="w-full px-3 py-2 text-sm border rounded-md"
                        >
                            <option value="">Todas</option>
                            <option value="INFO">Info</option>
                            <option value="WARN">Advertencia</option>
                            <option value="CRITICAL">Crítico</option>
                        </select>
                    </div>

                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium mb-1">Buscar por Email</label>
                        <input
                            type="text"
                            placeholder="usuario@ejemplo.com"
                            defaultValue={searchParams.get('userEmail') || ''}
                            onChange={(e) => handleFilterChange('userEmail', e.target.value)}
                            className="w-full px-3 py-2 text-sm border rounded-md"
                        />
                    </div>

                    <div className="flex items-end">
                        <button
                            onClick={handleClearFilters}
                            className="inline-flex items-center gap-2 px-4 py-2 text-sm border rounded-md hover:bg-muted"
                        >
                            <X className="h-4 w-4" />
                            Limpiar Filtros
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}

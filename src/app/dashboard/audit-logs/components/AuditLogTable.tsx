'use client'

import React, { useState } from 'react'
import { AuditLog } from '@prisma/client'
import { formatDateTime } from '@/lib/dateUtils'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'

interface Props {
    logs: AuditLog[]
    totalCount: number
    totalPages: number
    currentPage: number
}

export function AuditLogTable({ logs, totalCount, totalPages, currentPage }: Props) {
    const [expandedId, setExpandedId] = useState<string | null>(null)
    const router = useRouter()
    const searchParams = useSearchParams()

    const handlePageChange = (newPage: number) => {
        const params = new URLSearchParams(searchParams.toString())
        params.set('page', newPage.toString())
        router.push(`/dashboard/audit-logs?${params.toString()}`)
    }

    const getSeverityBadge = (severity: string) => {
        const colors = {
            INFO: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
            WARN: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
            CRITICAL: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
        }
        return colors[severity as keyof typeof colors] || colors.INFO
    }

    const getEventTypeBadge = (eventType: string) => {
        if (eventType.includes('LOGIN') || eventType.includes('LOGOUT')) {
            return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
        }
        if (eventType.includes('TRANSACTION')) {
            return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
        }
        if (eventType.includes('CATEGORY') || eventType.includes('MEMBER')) {
            return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200'
        }
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
    }

    const renderDetails = (log: AuditLog) => {
        if (!log.details) return null

        const details = log.details as any

        // Check if it's a diff (has previous and new keys)
        if (details.previous && details.new) {
            return (
                <div className="mt-2 space-y-2">
                    <div className="text-sm font-medium">Cambios realizados:</div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="rounded bg-red-50 p-2 dark:bg-red-950">
                            <div className="text-xs font-medium text-red-700 dark:text-red-300 mb-1">Anterior</div>
                            <pre className="text-xs text-red-600 dark:text-red-400 whitespace-pre-wrap">
                                {JSON.stringify(details.previous, null, 2)}
                            </pre>
                        </div>
                        <div className="rounded bg-green-50 p-2 dark:bg-green-950">
                            <div className="text-xs font-medium text-green-700 dark:text-green-300 mb-1">Nuevo</div>
                            <pre className="text-xs text-green-600 dark:text-green-400 whitespace-pre-wrap">
                                {JSON.stringify(details.new, null, 2)}
                            </pre>
                        </div>
                    </div>
                </div>
            )
        }

        return (
            <pre className="mt-2 text-xs bg-muted p-2 rounded overflow-x-auto">
                {JSON.stringify(details, null, 2)}
            </pre>
        )
    }

    return (
        <div>
            <div className="p-4 border-b">
                <div className="text-sm text-muted-foreground">
                    Mostrando {logs.length} de {totalCount} registros
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead className="bg-muted/50">
                        <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                Fecha/Hora
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                Severidad
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                Evento
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                Usuario
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                IP
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                Detalles
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                        {logs.map((log) => (
                            <React.Fragment key={log.id}>
                                <tr className="hover:bg-muted/50">
                                    <td className="px-4 py-3 text-sm whitespace-nowrap">
                                        {formatDateTime(log.createdAt)}
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getSeverityBadge(log.severity)}`}>
                                            {log.severity}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getEventTypeBadge(log.eventType)}`}>
                                            {log.eventType}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-sm">
                                        {log.userEmail}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-muted-foreground">
                                        {log.ipAddress || '-'}
                                    </td>
                                    <td className="px-4 py-3">
                                        {log.details && (
                                            <button
                                                onClick={() => setExpandedId(expandedId === log.id ? null : log.id)}
                                                className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 flex items-center gap-1"
                                            >
                                                {expandedId === log.id ? (
                                                    <>
                                                        <ChevronUp className="h-4 w-4" />
                                                        Ocultar
                                                    </>
                                                ) : (
                                                    <>
                                                        <ChevronDown className="h-4 w-4" />
                                                        Ver
                                                    </>
                                                )}
                                            </button>
                                        )}
                                    </td>
                                </tr>
                                {expandedId === log.id && (
                                    <tr>
                                        <td colSpan={6} className="px-4 py-3 bg-muted/30">
                                            {renderDetails(log)}
                                        </td>
                                    </tr>
                                )}
                            </React.Fragment>
                        ))}
                    </tbody>
                </table>
            </div>

            {totalPages > 1 && (
                <div className="p-4 border-t flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">
                        Página {currentPage} de {totalPages}
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => handlePageChange(currentPage - 1)}
                            disabled={currentPage === 1}
                            className="px-3 py-1 text-sm border rounded hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Anterior
                        </button>
                        <button
                            onClick={() => handlePageChange(currentPage + 1)}
                            disabled={currentPage === totalPages}
                            className="px-3 py-1 text-sm border rounded hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Siguiente
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}

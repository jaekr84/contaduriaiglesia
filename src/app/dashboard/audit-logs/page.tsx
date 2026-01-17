import { requireRole } from '@/lib/auth'
import { getAuditLogs, getAvailableYears } from './actions'
import { AuditLogTable } from './components/AuditLogTable'
import { AuditLogFilters } from './components/AuditLogFilters'
import { Suspense } from 'react'

interface PageProps {
    searchParams: Promise<{
        page?: string
        dateFrom?: string
        dateTo?: string
        eventType?: string
        severity?: string
        userEmail?: string
    }>
}

export default async function AuditLogsPage({ searchParams }: PageProps) {
    await requireRole('ADMIN')

    const params = await searchParams
    const page = parseInt(params.page || '1')
    const filters = {
        dateFrom: params.dateFrom,
        dateTo: params.dateTo,
        eventType: params.eventType as any,
        severity: params.severity as any,
        userEmail: params.userEmail
    }

    const { logs, totalCount, totalPages, currentPage } = await getAuditLogs(page, 50, filters)
    const availableYears = await getAvailableYears()

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Logs de Auditoría</h1>
                    <p className="text-muted-foreground mt-1">
                        Registro de eventos de autenticación y operaciones críticas
                    </p>
                </div>
            </div>

            <Suspense fallback={<div>Cargando filtros...</div>}>
                <AuditLogFilters availableYears={availableYears} />
            </Suspense>

            <div className="rounded-lg border bg-card">
                <AuditLogTable
                    logs={logs}
                    totalCount={totalCount}
                    totalPages={totalPages}
                    currentPage={currentPage}
                />
            </div>
        </div>
    )
}

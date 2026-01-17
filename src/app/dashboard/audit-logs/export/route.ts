import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth'
import prisma from '@/lib/prisma'
import * as XLSX from 'xlsx'
import { formatDateTime } from '@/lib/dateUtils'

export async function GET(request: NextRequest) {
    try {
        const profile = await requireRole('ADMIN')
        const { searchParams } = new URL(request.url)
        const year = parseInt(searchParams.get('year') || new Date().getFullYear().toString())

        // Obtener logs del año especificado
        const startDate = new Date(year, 0, 1)
        const endDate = new Date(year + 1, 0, 1)

        const logs = await prisma.auditLog.findMany({
            where: {
                organizationId: profile.organizationId,
                createdAt: {
                    gte: startDate,
                    lt: endDate
                }
            },
            orderBy: { createdAt: 'desc' }
        })

        if (logs.length === 0) {
            return NextResponse.json({ error: 'No hay logs para este año' }, { status: 404 })
        }

        // Generar Excel
        const worksheet = XLSX.utils.json_to_sheet(logs.map(log => ({
            'Fecha/Hora': formatDateTime(log.createdAt),
            'Tipo de Evento': log.eventType,
            'Severidad': log.severity,
            'Usuario': log.userEmail,
            'Recurso': log.resourceType || '-',
            'ID Recurso': log.resourceId || '-',
            'Detalles': JSON.stringify(log.details),
            'IP': log.ipAddress,
            'User Agent': log.userAgent
        })))

        const workbook = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(workbook, worksheet, `Logs ${year}`)

        const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' })

        // Eliminar logs del año después de generar el archivo
        await prisma.auditLog.deleteMany({
            where: {
                organizationId: profile.organizationId,
                createdAt: {
                    gte: startDate,
                    lt: endDate
                }
            }
        })

        return new NextResponse(excelBuffer, {
            headers: {
                'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'Content-Disposition': `attachment; filename="audit-logs-${year}.xlsx"`
            }
        })
    } catch (error) {
        console.error('Error generating audit report:', error)
        return NextResponse.json({ error: 'Error generando reporte' }, { status: 500 })
    }
}

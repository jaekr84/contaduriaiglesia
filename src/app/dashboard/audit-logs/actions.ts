'use server'

import { requireRole } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { AuditEventType, AuditSeverity } from '@prisma/client'

interface AuditLogFilters {
    dateFrom?: string
    dateTo?: string
    eventType?: AuditEventType
    severity?: AuditSeverity
    userEmail?: string
}

export async function getAuditLogs(
    page: number = 1,
    pageSize: number = 50,
    filters?: AuditLogFilters
) {
    const profile = await requireRole('ADMIN')

    const where: any = {
        organizationId: profile.organizationId
    }

    if (filters?.dateFrom || filters?.dateTo) {
        where.createdAt = {}
        if (filters.dateFrom) where.createdAt.gte = new Date(filters.dateFrom)
        if (filters.dateTo) {
            const endDate = new Date(filters.dateTo)
            endDate.setHours(23, 59, 59, 999)
            where.createdAt.lte = endDate
        }
    }

    if (filters?.eventType) {
        where.eventType = filters.eventType
    }

    if (filters?.severity) {
        where.severity = filters.severity
    }

    if (filters?.userEmail) {
        where.userEmail = { contains: filters.userEmail, mode: 'insensitive' }
    }

    const [logs, totalCount] = await Promise.all([
        prisma.auditLog.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            skip: (page - 1) * pageSize,
            take: pageSize
        }),
        prisma.auditLog.count({ where })
    ])

    return {
        logs,
        totalCount,
        totalPages: Math.ceil(totalCount / pageSize),
        currentPage: page
    }
}

export async function getAvailableYears() {
    const profile = await requireRole('ADMIN')

    const oldestLog = await prisma.auditLog.findFirst({
        where: { organizationId: profile.organizationId },
        orderBy: { createdAt: 'asc' },
        select: { createdAt: true }
    })

    if (!oldestLog) return []

    const startYear = oldestLog.createdAt.getFullYear()
    const currentYear = new Date().getFullYear()

    const years: number[] = []
    for (let year = currentYear; year >= startYear; year--) {
        years.push(year)
    }

    return years
}

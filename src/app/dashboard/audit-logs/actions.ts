'use server'

import { requireRole } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { AuditEventType, AuditSeverity, AuditLog } from '@prisma/client'

interface AuditLogFilters {
    dateFrom?: string
    dateTo?: string
    eventType?: AuditEventType
    severity?: AuditSeverity
    userEmail?: string
}

// Helper to enrich audit log details with human-readable information
async function enrichAuditLogDetails(log: AuditLog, organizationId: string): Promise<AuditLog> {
    if (!log.details || typeof log.details !== 'object') {
        return log
    }

    const details = log.details as Record<string, any>
    const enrichedDetails = { ...details }

    // Helper to enrich a single details object (for both regular details and diffs)
    const enrichObject = async (obj: Record<string, any>) => {
        const enriched = { ...obj }

        // Resolve categoryId to category name
        if (obj.categoryId) {
            try {
                const category = await prisma.category.findUnique({
                    where: {
                        id: obj.categoryId,
                        organizationId
                    },
                    select: { name: true, parent: { select: { name: true } } }
                })

                if (category) {
                    enriched.categoryName = category.parent
                        ? `${category.parent.name} > ${category.name}`
                        : category.name
                }
            } catch (error) {
                console.error('Error enriching categoryId:', error)
            }
        }

        return enriched
    }

    // Check if it's a diff (has previous and new keys)
    if (details.previous && details.new) {
        enrichedDetails.previous = await enrichObject(details.previous)
        enrichedDetails.new = await enrichObject(details.new)
    } else {
        // Enrich the top-level details
        const enriched = await enrichObject(details)
        Object.assign(enrichedDetails, enriched)
    }

    return {
        ...log,
        details: enrichedDetails
    }
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

    // Enrich logs with human-readable details
    const enrichedLogs = await Promise.all(
        logs.map(log => enrichAuditLogDetails(log, profile.organizationId))
    )

    return {
        logs: enrichedLogs,
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


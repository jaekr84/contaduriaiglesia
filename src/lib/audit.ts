import prisma from '@/lib/prisma'
import { AuditEventType, AuditSeverity } from '@prisma/client'
import { headers } from 'next/headers'

interface AuditLogParams {
    eventType: AuditEventType
    severity?: AuditSeverity
    userId?: string
    userEmail: string
    organizationId: string
    details?: Record<string, any>
    resourceType?: string
    resourceId?: string
}

export async function createAuditLog(params: AuditLogParams) {
    try {
        const headersList = await headers()

        // Parse IP address - take first IP from x-forwarded-for (Vercel proxy)
        const forwardedFor = headersList.get('x-forwarded-for')
        const ipAddress = forwardedFor
            ? forwardedFor.split(',')[0].trim()
            : headersList.get('x-real-ip') || 'unknown'

        const userAgent = headersList.get('user-agent') || 'unknown'

        // Auto-determine severity if not provided
        const severity = params.severity || determineSeverity(params.eventType)

        await prisma.auditLog.create({
            data: {
                ...params,
                severity,
                ipAddress,
                userAgent,
                details: params.details || undefined,
            },
        })
    } catch (error) {
        // Log error but don't throw - audit logging shouldn't break app functionality
        console.error('Failed to create audit log:', error)
    }
}

// Helper para determinar severidad automáticamente
function determineSeverity(eventType: AuditEventType): AuditSeverity {
    const criticalEvents = [
        'LOGIN_FAILED',
        'TRANSACTION_DELETED',
        'CATEGORY_DELETED',
        'MEMBER_DELETED',
        'USER_REMOVED',
        'INVITATION_REVOKED',
    ]

    const warnEvents = [
        'TRANSACTION_UPDATED',
        'CATEGORY_UPDATED',
        'MEMBER_UPDATED',
    ]

    if (criticalEvents.includes(eventType)) return 'CRITICAL'
    if (warnEvents.includes(eventType)) return 'WARN'
    return 'INFO'
}

// Helper para crear diff de cambios
export function createChangeDiff<T extends Record<string, any>>(
    previous: T,
    updated: T
): { previous: Partial<T>; new: Partial<T> } {
    const diff: { previous: Partial<T>; new: Partial<T> } = {
        previous: {},
        new: {},
    }

    for (const key in updated) {
        if (previous[key] !== updated[key]) {
            diff.previous[key] = previous[key]
            diff.new[key] = updated[key]
        }
    }

    return diff
}

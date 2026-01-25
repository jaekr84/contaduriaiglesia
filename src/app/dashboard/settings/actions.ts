'use server'

import { revalidatePath } from 'next/cache'
import prisma from '@/lib/prisma'
import { requireProfile } from '@/lib/auth'

export async function getSettings() {
    const profile = await requireProfile()

    if (profile.role !== 'ADMIN') {
        throw new Error('No autorizado')
    }

    const org = await prisma.organization.findUnique({
        where: { id: profile.organizationId },
        select: { auditEnabled: true }
    })

    return {
        auditEnabled: org?.auditEnabled ?? true
    }
}

export async function updateAuditSetting(enabled: boolean) {
    const profile = await requireProfile()

    if (profile.role !== 'ADMIN') {
        return { error: 'No autorizado. Solo los administradores pueden cambiar esta configuración.' }
    }

    try {
        await prisma.organization.update({
            where: { id: profile.organizationId },
            data: { auditEnabled: enabled }
        })

        revalidatePath('/dashboard/settings')
        return { success: true }
    } catch (error) {
        console.error('Error updating audit setting:', error)
        return { error: 'Error al actualizar la configuración' }
    }
}

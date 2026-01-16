'use server'

import { requireProfile } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { Role } from '@prisma/client'
import { revalidatePath } from 'next/cache'
import { randomBytes } from 'crypto'

export async function getUsers() {
    const profile = await requireProfile()

    // Only allow admins to see users
    if (profile.role !== 'ADMIN') {
        throw new Error('No autorizado')
    }

    const profiles = await prisma.profile.findMany({
        where: { organizationId: profile.organizationId },
        orderBy: { createdAt: 'desc' }
    })

    const invitations = await prisma.invitation.findMany({
        where: {
            organizationId: profile.organizationId,
            status: 'PENDING'
        },
        orderBy: { createdAt: 'desc' }
    })

    return { profiles, invitations }
}

export async function inviteUser(email: string, role: Role) {
    const profile = await requireProfile()

    if (profile.role !== 'ADMIN') {
        return { error: 'No autorizado' }
    }

    // Check if user already exists in org
    const existingProfile = await prisma.profile.findFirst({
        where: {
            email: email,
            organizationId: profile.organizationId
        }
    })

    if (existingProfile) {
        return { error: 'El usuario ya es miembro de la organización' }
    }

    // Check availability of pending invitation
    const existingInvitation = await prisma.invitation.findFirst({
        where: {
            email,
            organizationId: profile.organizationId,
            status: 'PENDING'
        }
    })

    if (existingInvitation) {
        return { error: 'Ya existe una invitación pendiente para este email' }
    }

    try {
        const token = randomBytes(32).toString('hex')
        const expiresAt = new Date()
        expiresAt.setDate(expiresAt.getDate() + 7) // 7 days expiration

        const invitation = await prisma.invitation.create({
            data: {
                email,
                role,
                organizationId: profile.organizationId,
                token,
                status: 'PENDING',
                expiresAt
            }
        })

        revalidatePath('/dashboard/users')
        return {
            success: true,
            invitationLink: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/invite/${token}`
        }
    } catch (e) {
        console.error(e)
        return { error: 'Error al crear la invitación' }
    }
}

export async function revokeInvitation(id: string) {
    const profile = await requireProfile()

    if (profile.role !== 'ADMIN') {
        return { error: 'No autorizado' }
    }

    try {
        await prisma.invitation.update({
            where: { id, organizationId: profile.organizationId },
            data: { status: 'REVOKED' }
        })

        revalidatePath('/dashboard/users')
        return { success: true }
    } catch (e) {
        return { error: 'Error al revocar invitación' }
    }
}

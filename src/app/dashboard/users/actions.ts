'use server'

import { requireProfile } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { getAppUrl } from '@/lib/utils'
import { createAdminClient } from '@/lib/supabase/server'
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

    return { profiles, invitations, currentUserId: profile.id }
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

        await prisma.invitation.create({
            data: {
                email,
                role,
                organizationId: profile.organizationId,
                token,
                status: 'PENDING',
                expiresAt
            }
        })

        const baseUrl = getAppUrl()
        const inviteLink = `${baseUrl}/invite/${token}`



        revalidatePath('/dashboard/users')
        return {
            success: true,
            invitationLink: inviteLink
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

export async function deleteUser(userId: string) {
    const profile = await requireProfile()

    if (profile.role !== 'ADMIN') {
        return { error: 'No autorizado' }
    }

    if (profile.id === userId) {
        return { error: 'No puedes eliminar tu propia cuenta' }
    }

    try {
        // 1. Delete from Supabase Auth (requires Admin Client)
        const supabaseAdmin = await createAdminClient()
        const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(userId)

        if (authError) {
            // If user is not found in Auth, we should still proceed to delete from DB
            if (authError.message.includes('User not found') || authError.code === 'user_not_found') {
                console.warn('User not found in Supabase Auth, preceding to delete from DB:', userId)
            } else {
                console.error('Error deleting auth user:', authError)
                return { error: 'Error al eliminar usuario de autenticación' }
            }
        }


        // 2. Delete Profile and related data will be handled by cascade or manual deletion if needed
        // Assuming cascade delete is not set up perfectly, we explicitly delete profile
        await prisma.profile.delete({
            where: { id: userId, organizationId: profile.organizationId }
        })

        revalidatePath('/dashboard/users')
        return { success: true }
    } catch (e) {
        console.error('Error deleting user:', e)
        return { error: 'Error al eliminar usuario' }
    }
}


export async function updateUserRole(userId: string, newRole: Role) {
    const profile = await requireProfile()

    if (profile.role !== 'ADMIN') {
        return { error: 'No autorizado' }
    }

    if (profile.id === userId) {
        return { error: 'No puedes cambiar tu propio rol' }
    }

    try {
        await prisma.profile.update({
            where: {
                id: userId,
                organizationId: profile.organizationId
            },
            data: { role: newRole }
        })

        revalidatePath('/dashboard/users')
        return { success: true }
    } catch (e) {
        console.error('Error updating role:', e)
        return { error: 'Error al actualizar el rol' }
    }
}

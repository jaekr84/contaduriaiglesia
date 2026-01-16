'use server'

import prisma from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function getInvitation(token: string) {
    const invitation = await prisma.invitation.findUnique({
        where: { token },
        include: { organization: true }
    })

    if (!invitation || invitation.status !== 'PENDING' || invitation.expiresAt < new Date()) {
        return null
    }

    return invitation
}

export async function acceptInvitation(token: string, formData: FormData) {
    const invitation = await getInvitation(token)

    if (!invitation) {
        return { error: 'Invitación inválida o expirada' }
    }

    const fullName = formData.get('fullName') as string
    const password = formData.get('password') as string

    if (!fullName || !password) {
        return { error: 'Todos los campos son obligatorios' }
    }

    const supabase = await createClient()

    // 1. Create Supabase Auth User
    const { data, error } = await supabase.auth.signUp({
        email: invitation.email,
        password,
        options: {
            data: {
                full_name: fullName,
            }
        }
    })

    if (error) {
        return { error: error.message }
    }

    if (!data.user) {
        return { error: 'Error al crear el usuario' }
    }

    try {
        // 2. Create Profile and Link to Organization
        await prisma.$transaction(async (tx) => {
            // Create Profile
            await tx.profile.create({
                data: {
                    id: data.user!.id,
                    email: invitation.email,
                    fullName,
                    role: invitation.role,
                    organizationId: invitation.organizationId
                }
            })

            // Update Invitation Status
            await tx.invitation.update({
                where: { id: invitation.id },
                data: { status: 'ACCEPTED' }
            })
        })
    } catch (dbError) {
        console.error(dbError)
        // Cleanup: Ideally we should delete the auth user here if DB fails, 
        // but for now we'll just return error.
        return { error: 'Error al configurar el perfil. Contacte a soporte.' }
    }

    redirect('/dashboard')
}

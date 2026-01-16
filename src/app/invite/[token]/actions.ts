'use server'

import prisma from '@/lib/prisma'
import { createAdminClient, createClient } from '@/lib/supabase/server'
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

    // Use admin client to create user with email confirmation
    const supabaseAdmin = await createAdminClient()

    // 1. Create Supabase Auth User (Verified)
    const { data: userData, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email: invitation.email,
        password,
        email_confirm: true,
        user_metadata: {
            full_name: fullName
        }
    })

    if (createError) {
        return { error: createError.message }
    }

    if (!userData.user) {
        return { error: 'Error al crear el usuario' }
    }

    try {
        // 2. Create Profile and Link to Organization
        await prisma.$transaction(async (tx) => {
            // Create Profile
            await tx.profile.create({
                data: {
                    id: userData.user!.id,
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

        // 3. Sign in the user immediately
        const supabase = await createClient()
        const { error: signInError } = await supabase.auth.signInWithPassword({
            email: invitation.email,
            password
        })

        if (signInError) {
            console.error('Error signing in after creation:', signInError)
            return { error: 'Usuario creado pero error al iniciar sesión. Intente loguearse manualmente.' }
        }

    } catch (dbError) {
        console.error(dbError)
        // Cleanup: Ideally we should delete the auth user here if DB fails, 
        // but for now we'll just return error.
        return { error: 'Error al configurar el perfil. Contacte a soporte.' }
    }

    redirect('/dashboard')
}

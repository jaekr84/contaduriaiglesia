'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

import { createClient } from '@/lib/supabase/server'

import { cookies } from 'next/headers'
import { createAuditLog } from '@/lib/audit'
import { getCurrentProfile } from '@/lib/auth'

export async function login(formData: FormData) {
    const supabase = await createClient()

    // Type-casting here for convenience
    const email = (formData.get('email') as string).trim()
    const password = (formData.get('password') as string).trim()

    const { data: { user }, error } = await supabase.auth.signInWithPassword({
        email,
        password,
    })

    if (error || !user) {
        // Log failed login attempt
        try {
            const profile = await prisma.profile.findFirst({
                where: { email }
            })
            if (profile) {
                await createAuditLog({
                    eventType: 'LOGIN_FAILED',
                    userEmail: email,
                    organizationId: profile.organizationId,
                    details: { reason: error?.message || 'Error desconocido' }
                })
            }
        } catch (auditError) {
            console.error('Failed to log failed login:', auditError)
        }
        return { error: error?.message || 'Error al iniciar sesión' }
    }

    // Generate and save session ID
    const sessionId = crypto.randomUUID()

    const profile = await prisma.profile.update({
        where: { id: user.id },
        data: { sessionId }
    })

    // Set session cookie
    const cookieStore = await cookies()
    cookieStore.set('device_session', sessionId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 7 // 1 week
    })

    // Log successful login
    await createAuditLog({
        eventType: 'LOGIN_SUCCESS',
        userId: user.id,
        userEmail: email,
        organizationId: profile.organizationId
    })

    revalidatePath('/', 'layout')
    redirect('/dashboard')
}

import prisma from '@/lib/prisma'
import { Role } from '@prisma/client'

export async function signup(formData: FormData) {
    const supabase = await createClient()

    const email = (formData.get('email') as string).trim()
    const password = (formData.get('password') as string).trim()

    const { data, error } = await supabase.auth.signUp({
        email,
        password,
    })

    if (error) {
        return { error: error.message }
    }

    if (data.user) {
        try {
            // Create a default organization for the new user
            // We use a transaction to ensure both are created or neither
            let newOrgId: string
            const sessionId = crypto.randomUUID()

            await prisma.$transaction(async (tx) => {
                const orgName = `Iglesia de ${email.split('@')[0]}`

                const newOrg = await tx.organization.create({
                    data: {
                        name: orgName,
                    },
                })

                newOrgId = newOrg.id

                await tx.profile.create({
                    data: {
                        id: data.user!.id, // Link to Supabase Auth ID
                        email: email,
                        fullName: email.split('@')[0], // Default name
                        role: Role.ADMIN,
                        organizationId: newOrg.id,
                        sessionId: sessionId
                    },
                })
            })

            // Log successful signup
            await createAuditLog({
                eventType: 'LOGIN_SUCCESS',
                userId: data.user.id,
                userEmail: email,
                organizationId: newOrgId!,
                details: { action: 'signup', organizationCreated: true }
            })

            // Set session cookie after successful transaction
            const cookieStore = await cookies()
            cookieStore.set('device_session', sessionId, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                path: '/',
                maxAge: 60 * 60 * 24 * 7 // 1 week
            })
        } catch (dbError) {
            console.error('Error creating user profile:', dbError)
            return { error: 'Error configurando la cuenta. Por favor intente nuevamente.' }
        }
    }

    revalidatePath('/', 'layout')
    redirect('/dashboard')
}

export async function signout() {
    const supabase = await createClient()

    // Get current user info before signing out
    try {
        const profile = await getCurrentProfile()
        if (profile) {
            await createAuditLog({
                eventType: 'LOGOUT',
                userId: profile.id,
                userEmail: profile.email,
                organizationId: profile.organizationId
            })
        }
    } catch (error) {
        console.error('Failed to log logout:', error)
    }

    await supabase.auth.signOut()
    revalidatePath('/', 'layout')
    redirect('/login')
}

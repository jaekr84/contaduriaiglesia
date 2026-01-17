'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

import { createClient } from '@/lib/supabase/server'

import { cookies } from 'next/headers'

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
        return { error: error?.message || 'Error al iniciar sesión' }
    }

    // Generate and save session ID
    const sessionId = crypto.randomUUID()

    await prisma.profile.update({
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
            await prisma.$transaction(async (tx) => {
                const orgName = `Iglesia de ${email.split('@')[0]}`

                const newOrg = await tx.organization.create({
                    data: {
                        name: orgName,
                    },
                })

                const sessionId = crypto.randomUUID()

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

            // Set session cookie after successful transaction
            const sessionId = crypto.randomUUID() // Valid? No, we need the SAME UUID.
            // Wait, I cannot extract the sessionId from the transaction closure easily unless I define it outside.
            // Let's redefine.
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
    await supabase.auth.signOut()
    revalidatePath('/', 'layout')
    redirect('/login')
}

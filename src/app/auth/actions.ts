'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

import { createClient } from '@/lib/supabase/server'

export async function login(formData: FormData) {
    const supabase = await createClient()

    // Type-casting here for convenience
    const email = (formData.get('email') as string).trim()
    const password = (formData.get('password') as string).trim()

    const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
    })

    if (error) {
        return { error: error.message }
    }

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

                await tx.profile.create({
                    data: {
                        id: data.user!.id, // Link to Supabase Auth ID
                        email: email,
                        fullName: email.split('@')[0], // Default name
                        role: Role.ADMIN,
                        organizationId: newOrg.id,
                    },
                })
            })
        } catch (dbError) {
            console.error('Error creating user profile:', dbError)
            // Optional: Delete auth user if DB fails to keep consistency? 
            // For now, just return error.
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

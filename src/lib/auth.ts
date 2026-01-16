import { createClient } from '@/lib/supabase/server'
import prisma from '@/lib/prisma'
import { cache } from 'react'

export const getCurrentProfile = cache(async () => {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return null
    }

    const profile = await prisma.profile.findUnique({
        where: { id: user.id },
        include: { organization: true }
    })

    return profile
})

export const requireProfile = async () => {
    const profile = await getCurrentProfile()
    if (!profile) {
        throw new Error('No autorizado')
    }
    return profile
}

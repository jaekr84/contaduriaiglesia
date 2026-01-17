import { createClient } from '@/lib/supabase/server'
import prisma from '@/lib/prisma'
import { cache } from 'react'

import { cookies } from 'next/headers'

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

    if (!profile) return null

    // Enforce Single Session
    const cookieStore = await cookies()
    const currentSessionId = cookieStore.get('device_session')?.value

    if (profile.sessionId && profile.sessionId !== currentSessionId) {
        // Session mismatch - invalid
        return null
    }

    return profile
})

export const requireProfile = async () => {
    const profile = await getCurrentProfile()
    if (!profile) {
        throw new Error('No autorizado')
    }
    return profile
}


import { Role } from '@prisma/client'

export const requireRole = async (role: Role) => {
    const profile = await requireProfile()

    if (profile.role === 'ADMIN') {
        return profile
    }

    if (profile.role === role) {
        return profile
    }

    throw new Error('No autorizado: Permisos insuficientes')
}

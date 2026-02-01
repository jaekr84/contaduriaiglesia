'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function changePassword(prevState: any, formData: FormData) {
    const supabase = await createClient()

    const currentPassword = (formData.get('currentPassword') as string).trim()
    const newPassword = (formData.get('newPassword') as string).trim()
    const confirmPassword = (formData.get('confirmPassword') as string).trim()

    if (newPassword !== confirmPassword) {
        return { error: 'Las nuevas contraseñas no coinciden' }
    }

    if (newPassword.length < 6) {
        return { error: 'La nueva contraseña debe tener al menos 6 caracteres' }
    }

    // 1. Verify current session/user first
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user || !user.email) {
        return { error: 'Sesión no válida' }
    }

    // 2. Verify old password by attempting a sign-in (without storing session)
    // Note: Supabase doesn't have a direct "verify password" API without sign-in.
    const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: currentPassword,
    })

    if (signInError) {
        return { error: 'La contraseña actual es incorrecta' }
    }

    // 3. Update password
    const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword
    })

    if (updateError) {
        return { error: updateError.message || 'Error al actualizar la contraseña' }
    }

    revalidatePath('/dashboard/profile')
    return { success: 'Contraseña actualizada correctamente' }
}


import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://sskzjvuiqnlrqsvrhwwy.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNza3pqdnVpcW5scnFzdnJod3d5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODU1Nzg4NywiZXhwIjoyMDg0MTMzODg3fQ.4IYLEESZXLu8p9ys_HqKZ74dT87q0KyaynYwAVmkqmY'

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
})

const userId = 'c7f96880-1de9-4d05-b378-d48b919ca322'
const newPassword = 'Iglesia2024!'

async function resetPassword() {
    console.log('Attempting to reset password for user:', userId)

    const { data, error } = await supabase.auth.admin.updateUserById(
        userId,
        { password: newPassword }
    )

    if (error) {
        console.error('Error resetting password:', error.message)
        process.exit(1)
    } else {
        console.log('Password reset successfully for user:', data.user.email)
        process.exit(0)
    }
}

resetPassword()

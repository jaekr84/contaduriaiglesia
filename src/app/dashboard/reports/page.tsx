import { getCurrentProfile } from '@/lib/auth'
import { redirect } from 'next/navigation'
import ReportsClient from './ReportsClient'

export default async function ReportsPage() {
    const profile = await getCurrentProfile()

    // Allowed: ADMIN, TREASURER
    if (!profile || !['ADMIN', 'TREASURER'].includes(profile.role)) {
        redirect('/dashboard')
    }

    return <ReportsClient />
}

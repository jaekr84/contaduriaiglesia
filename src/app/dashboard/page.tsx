import { redirect } from 'next/navigation'
import { getCurrentProfile } from '@/lib/auth'

export default async function DashboardPage() {
    const profile = await getCurrentProfile()
    if (!profile) redirect('/login')

    if (profile.role === 'RRHH') {
        redirect('/dashboard/members')
    } else if (profile.role === 'VIEWER') {
        redirect('/dashboard/annual-summary')
    } else {
        redirect('/dashboard/finance')
    }
}

import { getCurrentProfile } from '@/lib/auth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { User, Mail, Shield } from 'lucide-react'
import { ChangePasswordForm } from './change-password-form'

export default async function ProfilePage() {
    const profile = await getCurrentProfile()

    if (!profile) {
        return null // Should be handled by layout/middleware
    }

    return (
        <div className="space-y-6 max-w-2xl mx-auto">
            <div className="flex items-center gap-2 mb-8">
                <User className="h-6 w-6 text-zinc-900 dark:text-zinc-50" />
                <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">Mi Perfil</h1>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Información Personal</CardTitle>
                    <CardDescription>
                        Información básica de su cuenta.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid gap-1">
                        <div className="flex items-center gap-2 text-sm font-medium text-zinc-500 dark:text-zinc-400">
                            <Mail className="h-4 w-4" />
                            Email
                        </div>
                        <div className="text-sm font-medium">{profile.email}</div>
                    </div>

                    <div className="grid gap-1">
                        <div className="flex items-center gap-2 text-sm font-medium text-zinc-500 dark:text-zinc-400">
                            <User className="h-4 w-4" />
                            Nombre
                        </div>
                        <div className="text-sm font-medium">{profile.fullName || 'Sin nombre'}</div>
                    </div>

                    <div className="grid gap-1">
                        <div className="flex items-center gap-2 text-sm font-medium text-zinc-500 dark:text-zinc-400">
                            <Shield className="h-4 w-4" />
                            Rol
                        </div>
                        <div className="text-sm font-medium">
                            <span className="inline-flex items-center rounded-md bg-zinc-100 px-2 py-1 text-xs font-medium text-zinc-600 ring-1 ring-inset ring-zinc-500/10 dark:bg-zinc-400/10 dark:text-zinc-400 dark:ring-zinc-400/20">
                                {profile.role}
                            </span>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <ChangePasswordForm />
        </div>
    )
}

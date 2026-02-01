import { getCurrentProfile } from '@/lib/auth'
import { signout } from '@/app/auth/actions'
import { Lock, LogOut } from 'lucide-react'
import { redirect } from 'next/navigation'
import { LockForm } from './lock-form'

export default async function LockPage() {
    const profile = await getCurrentProfile()

    if (!profile) {
        redirect('/login')
    }

    return (
        <div className="flex min-h-screen w-full flex-col items-center justify-center bg-zinc-50 dark:bg-zinc-950 p-4">
            <div className="w-full max-w-sm">
                <div className="flex flex-col items-center space-y-6 text-center">
                    <div className="flex h-20 w-20 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-900">
                        <Lock className="h-10 w-10 text-zinc-400" />
                    </div>

                    <div className="space-y-2">
                        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
                            Pantalla Bloqueada
                        </h1>
                        <p className="text-sm text-zinc-500 dark:text-zinc-400">
                            Hola, <span className="font-medium text-zinc-900 dark:text-zinc-50">{profile.email}</span>
                        </p>
                    </div>

                    <LockForm />

                    <div className="text-sm">
                        <form action={signout}>
                            <button className="text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50 flex items-center gap-2">
                                <LogOut className="h-4 w-4" />
                                <span>O iniciar sesión con otra cuenta</span>
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    )
}

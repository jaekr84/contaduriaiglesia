'use client'

import { updatePassword } from '@/app/auth/actions'
import { useTransition } from 'react'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'

export default function UpdatePasswordPage() {
    const [isPending, startTransition] = useTransition()

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault()
        const formData = new FormData(event.currentTarget)
        const password = formData.get('password') as string
        const confirmPassword = formData.get('confirmPassword') as string

        if (password !== confirmPassword) {
            toast.error('Las contraseñas no coinciden')
            return
        }

        startTransition(async () => {
            const result = await updatePassword(formData)
            if (result?.error) {
                toast.error(result.error)
            } else {
                toast.success('Contraseña actualizada exitosamente')
            }
        })
    }

    return (
        <div className="flex min-h-screen w-full flex-col items-center justify-center bg-zinc-50 dark:bg-zinc-950 p-4">
            <div className="w-full max-w-sm space-y-8">
                <div className="text-center space-y-2">
                    <div className="flex justify-center">
                        <div className="h-12 w-12 rounded-xl bg-zinc-900 dark:bg-white flex items-center justify-center">
                            <span className="text-white dark:text-black font-bold text-xl">I</span>
                        </div>
                    </div>
                    <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
                        Actualizar Contraseña
                    </h1>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">
                        Ingresa y confirma tu nueva contraseña
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <label htmlFor="password" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-zinc-900 dark:text-zinc-50">
                            Nueva Contraseña
                        </label>
                        <input
                            id="password"
                            name="password"
                            type="password"
                            required
                            className="flex h-10 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-zinc-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-800 dark:bg-zinc-950 dark:ring-offset-zinc-950 dark:placeholder:text-zinc-400 dark:focus-visible:ring-zinc-300"
                        />
                    </div>
                    <div className="space-y-2">
                        <label htmlFor="confirmPassword" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-zinc-900 dark:text-zinc-50">
                            Confirmar Contraseña
                        </label>
                        <input
                            id="confirmPassword"
                            name="confirmPassword"
                            type="password"
                            required
                            className="flex h-10 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-zinc-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-800 dark:bg-zinc-950 dark:ring-offset-zinc-950 dark:placeholder:text-zinc-400 dark:focus-visible:ring-zinc-300"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={isPending}
                        className="inline-flex h-10 w-full items-center justify-center rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-zinc-50 shadow transition-colors hover:bg-zinc-900/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-950 disabled:pointer-events-none disabled:opacity-50 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-50/90 dark:focus-visible:ring-zinc-300"
                    >
                        {isPending ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                            'Actualizar Contraseña'
                        )}
                    </button>
                </form>
            </div>
        </div>
    )
}

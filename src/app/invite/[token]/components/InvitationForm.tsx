'use client'

import { acceptInvitation } from '../actions'
import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Check, Loader2, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'

interface Props {
    token: string
    dbInvitation: any // We'll pass the full invitation object for context
}

export default function InvitationPage({ token, dbInvitation }: Props) {
    const [isPending, startTransition] = useTransition()
    const router = useRouter()

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        const formData = new FormData(e.currentTarget)

        const password = formData.get('password') as string
        const confirmPassword = formData.get('confirmPassword') as string

        if (password !== confirmPassword) {
            toast.error('Las contraseñas no coinciden')
            return
        }

        startTransition(async () => {
            const result = await acceptInvitation(token, formData)
            if (result?.error) {
                toast.error(result.error)
            } else {
                toast.success('¡Bienvenido! Redirigiendo...')
            }
        })
    }

    if (!dbInvitation) {
        return (
            <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 p-4 dark:bg-black">
                <div className="flex max-w-md flex-col items-center space-y-4 text-center">
                    <div className="rounded-full bg-red-100 p-3 text-red-600 dark:bg-red-900/30 dark:text-red-400">
                        <AlertCircle className="h-8 w-8" />
                    </div>
                    <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">Invitación Inválida</h1>
                    <p className="text-zinc-500 dark:text-zinc-400">
                        El enlace de invitación ha expirado o no es válido. Por favor solicitá uno nuevo al administrador.
                    </p>
                </div>
            </div>
        )
    }

    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 p-4 dark:bg-black">
            <div className="w-full max-w-md space-y-8 rounded-xl bg-white p-8 shadow-sm dark:bg-zinc-950 dark:border dark:border-zinc-800">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">Bienvenido a Iglesia App</h1>
                    <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
                        Estás aceptando la invitación para unirte a <strong>{dbInvitation.organization.name}</strong> como <strong>{dbInvitation.role === 'ADMIN' ? 'Administrador' : dbInvitation.role === 'TREASURER' ? 'Tesorero' : 'Visualizador'}</strong>.
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-zinc-900 dark:text-zinc-50">
                            Email
                        </label>
                        <input
                            type="email"
                            value={dbInvitation.email}
                            disabled
                            className="mt-1 block w-full rounded-md border border-zinc-200 bg-zinc-100 px-3 py-2 text-zinc-500 shadow-sm sm:text-sm dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-zinc-900 dark:text-zinc-50">
                            Nombre Completo
                        </label>
                        <input
                            name="fullName"
                            type="text"
                            required
                            placeholder="Juan Pérez"
                            className="mt-1 block w-full rounded-md border border-zinc-200 px-3 py-2 shadow-sm focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900 sm:text-sm dark:border-zinc-800 dark:bg-zinc-900 dark:text-white dark:focus:border-zinc-50 dark:focus:ring-zinc-50"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-zinc-900 dark:text-zinc-50">
                            Contraseña
                        </label>
                        <input
                            name="password"
                            type="password"
                            required
                            className="mt-1 block w-full rounded-md border border-zinc-200 px-3 py-2 shadow-sm focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900 sm:text-sm dark:border-zinc-800 dark:bg-zinc-900 dark:text-white dark:focus:border-zinc-50 dark:focus:ring-zinc-50"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-zinc-900 dark:text-zinc-50">
                            Confirmar Contraseña
                        </label>
                        <input
                            name="confirmPassword"
                            type="password"
                            required
                            className="mt-1 block w-full rounded-md border border-zinc-200 px-3 py-2 shadow-sm focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900 sm:text-sm dark:border-zinc-800 dark:bg-zinc-900 dark:text-white dark:focus:border-zinc-50 dark:focus:ring-zinc-50"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={isPending}
                        className="flex w-full justify-center rounded-md border border-transparent bg-zinc-900 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:ring-offset-2 disabled:opacity-50 dark:bg-zinc-50 dark:text-black dark:hover:bg-zinc-200"
                    >
                        {isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Crear Cuenta y Unirme'}
                    </button>
                </form>
            </div>
        </div>
    )
}

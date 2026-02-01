'use client'

import { useActionState } from 'react'
import { unlockSession } from '@/app/auth/actions'
import { useFormStatus } from 'react-dom'

function SubmitButton() {
    const { pending } = useFormStatus()

    return (
        <button
            type="submit"
            disabled={pending}
            className="inline-flex h-10 w-full items-center justify-center rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-zinc-50 shadow transition-colors hover:bg-zinc-900/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-950 disabled:pointer-events-none disabled:opacity-50 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-50/90 dark:focus-visible:ring-zinc-300"
        >
            {pending ? 'Desbloqueando...' : 'Desbloquear'}
        </button>
    )
}

export function LockForm() {
    const [state, formAction] = useActionState(unlockSession, null)

    return (
        <form action={formAction} className="w-full space-y-4">
            <div className="space-y-2">
                <input
                    type="password"
                    name="password"
                    placeholder="Contraseña"
                    required
                    className="flex h-10 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-zinc-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-800 dark:bg-zinc-950 dark:ring-offset-zinc-950 dark:placeholder:text-zinc-400 dark:focus-visible:ring-zinc-300"
                />
            </div>
            {state?.error && (
                <div className="text-sm font-medium text-red-500 dark:text-red-400">
                    {state.error}
                </div>
            )}
            <SubmitButton />
        </form>
    )
}

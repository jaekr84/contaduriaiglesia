'use client'

import { useState, useTransition } from 'react'
import { inviteUser, revokeInvitation } from '../actions'
import { Plus, Copy, Check, Loader2, Trash2, Shield, User } from 'lucide-react'
import { toast } from 'sonner'
import { Role } from '@prisma/client'

interface Props {
    profiles: any[]
    invitations: any[]
}

export function UsersList({ profiles, invitations }: Props) {
    const [isPending, startTransition] = useTransition()
    const [isInviteModalOpen, setIsInviteModalOpen] = useState(false)
    const [copiedToken, setCopiedToken] = useState<string | null>(null)
    const [generatedLink, setGeneratedLink] = useState<string | null>(null)

    const handleCopy = (token: string, link: string) => {
        navigator.clipboard.writeText(link)
        setCopiedToken(token)
        toast.success('Link copiado al portapapeles')
        setTimeout(() => setCopiedToken(null), 2000)
    }

    const handleRevoke = (id: string) => {
        if (!confirm('¿Estás seguro de que querés revocar esta invitación?')) return

        startTransition(async () => {
            const result = await revokeInvitation(id)
            if (result.error) toast.error(result.error)
            else toast.success('Invitación revocada')
        })
    }

    const handleInvite = async (e: React.FormEvent<HTMLFormElement>) => {
        try {
            e.preventDefault()
            const formData = new FormData(e.currentTarget)
            const email = formData.get('email') as string
            const role = formData.get('role') as Role

            startTransition(async () => {
                const result = await inviteUser(email, role)
                if (result.error) {
                    toast.error(result.error)
                } else if (result.success && result.invitationLink) {
                    setGeneratedLink(result.invitationLink)
                    toast.success('Invitación creada correctamente')
                    // Don't close modal yet, let them copy the link
                }
            })
        } catch (error) {
            console.error(error)
            toast.error('Ocurrió un error inesperado. Intente nuevamente.')
        }
    }

    const closeInviteModal = () => {
        setIsInviteModalOpen(false)
        setGeneratedLink(null)
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">Usuarios</h1>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">Gestioná los miembros de tu equipo</p>
                </div>
                <button
                    onClick={() => setIsInviteModalOpen(true)}
                    className="inline-flex items-center gap-2 rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-zinc-50 hover:bg-zinc-900/90 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-50/90"
                >
                    <Plus className="h-4 w-4" />
                    Invitar Usuario
                </button>
            </div>

            {/* Active Users Table */}
            <div className="rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
                <div className="border-b border-zinc-200 px-6 py-4 dark:border-zinc-800">
                    <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">Miembros Activos</h2>
                </div>
                <div className="relative w-full overflow-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-zinc-50 text-zinc-500 dark:bg-zinc-900 dark:text-zinc-400">
                            <tr>
                                <th className="h-10 px-6 font-medium">Nombre</th>
                                <th className="h-10 px-6 font-medium">Email</th>
                                <th className="h-10 px-6 font-medium">Rol</th>
                                <th className="h-10 px-6 font-medium text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                            {profiles.map((profile) => (
                                <tr key={profile.id} className="transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-900/50">
                                    <td className="px-6 py-4 font-medium text-zinc-900 dark:text-zinc-50">
                                        {profile.fullName || 'Sin nombre'}
                                    </td>
                                    <td className="px-6 py-4 text-zinc-600 dark:text-zinc-400">{profile.email}</td>
                                    <td className="px-6 py-4">
                                        <div className="inline-flex items-center gap-1.5 rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200">
                                            {profile.role === 'ADMIN' ? (
                                                <Shield className="h-3 w-3" />
                                            ) : (
                                                <User className="h-3 w-3" />
                                            )}
                                            {profile.role === 'ADMIN' ? 'Administrador' : profile.role === 'TREASURER' ? 'Tesorero' : 'Visualizador'}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        {/* Don't allow deleting yourself or if there's only 1 admin logic needed later */}
                                        <button className="text-zinc-400 hover:text-red-500 disabled:opacity-50" disabled>
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Pending Invitations Table */}
            {invitations.length > 0 && (
                <div className="rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
                    <div className="border-b border-zinc-200 px-6 py-4 dark:border-zinc-800">
                        <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">Invitaciones Pendientes</h2>
                    </div>
                    <div className="relative w-full overflow-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-zinc-50 text-zinc-500 dark:bg-zinc-900 dark:text-zinc-400">
                                <tr>
                                    <th className="h-10 px-6 font-medium">Email</th>
                                    <th className="h-10 px-6 font-medium">Rol</th>
                                    <th className="h-10 px-6 font-medium">Creada</th>
                                    <th className="h-10 px-6 font-medium text-right">Link</th>
                                    <th className="h-10 px-6 font-medium text-right">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                                {invitations.map((inv) => {
                                    const link = `${window.location.origin}/invite/${inv.token}`
                                    return (
                                        <tr key={inv.id} className="transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-900/50">
                                            <td className="px-6 py-4 font-medium text-zinc-900 dark:text-zinc-50">
                                                {inv.email}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="inline-flex rounded-full bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                                                    {inv.role === 'ADMIN' ? 'Administrador' : inv.role === 'TREASURER' ? 'Tesorero' : 'Visualizador'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-zinc-600 dark:text-zinc-400">
                                                {new Date(inv.createdAt).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <button
                                                    onClick={() => handleCopy(inv.token, link)}
                                                    className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-50"
                                                >
                                                    {copiedToken === inv.token ? (
                                                        <>
                                                            <Check className="h-3 w-3 text-green-500" />
                                                            Copiado
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Copy className="h-3 w-3" />
                                                            Copiar
                                                        </>
                                                    )}
                                                </button>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <button
                                                    onClick={() => handleRevoke(inv.id)}
                                                    className="text-zinc-400 hover:text-red-500"
                                                    title="Revocar invitación"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Invite Modal */}
            {isInviteModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl dark:bg-zinc-950">
                        <h2 className="mb-4 text-lg font-bold text-zinc-900 dark:text-zinc-50">Invitar Usuario</h2>

                        {!generatedLink ? (
                            <form onSubmit={handleInvite} className="space-y-4">
                                <div>
                                    <label className="mb-2 block text-sm font-medium text-zinc-900 dark:text-zinc-50">
                                        Email
                                    </label>
                                    <input
                                        name="email"
                                        type="email"
                                        required
                                        placeholder="usuario@ejemplo.com"
                                        className="w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 dark:border-zinc-800 dark:bg-zinc-900 dark:focus:border-zinc-50 dark:focus:ring-zinc-50"
                                    />
                                </div>
                                <div>
                                    <label className="mb-2 block text-sm font-medium text-zinc-900 dark:text-zinc-50">
                                        Rol
                                    </label>
                                    <select
                                        name="role"
                                        className="w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 dark:border-zinc-800 dark:bg-zinc-900 dark:focus:border-zinc-50 dark:focus:ring-zinc-50"
                                    >
                                        <option value="TREASURER">Tesorero</option>
                                        <option value="ADMIN">Administrador</option>
                                        <option value="VIEWER">Visualizador</option>
                                    </select>
                                    <p className="mt-1 text-xs text-zinc-500">
                                        El Tesorero tiene acceso a Finanzas y Miembros, pero no a Usuarios.
                                    </p>
                                </div>
                                <div className="flex justify-end gap-3 pt-4">
                                    <button
                                        type="button"
                                        onClick={closeInviteModal}
                                        className="rounded-md px-4 py-2 text-sm font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isPending}
                                        className="inline-flex items-center gap-2 rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-zinc-50 hover:bg-zinc-900/90 disabled:opacity-50 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-50/90"
                                    >
                                        {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                                        Crear Invitación
                                    </button>
                                </div>
                            </form>
                        ) : (
                            <div className="space-y-4">
                                <div className="rounded-md bg-green-50 p-4 text-sm text-green-700 dark:bg-green-900/20 dark:text-green-400">
                                    ¡Invitación creada! Compartí el siguiente link con el usuario:
                                </div>
                                <div className="flex items-center gap-2 rounded-md border border-zinc-200 bg-zinc-50 p-2 dark:border-zinc-800 dark:bg-zinc-900">
                                    <code className="flex-1 overflow-x-auto text-xs">{generatedLink}</code>
                                    <button
                                        onClick={() => handleCopy('new', generatedLink)}
                                        className="rounded-md p-1.5 hover:bg-zinc-200 dark:hover:bg-zinc-800"
                                    >
                                        {copiedToken === 'new' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                                    </button>
                                </div>
                                <div className="flex justify-end pt-2">
                                    <button
                                        onClick={closeInviteModal}
                                        className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-zinc-50 hover:bg-zinc-900/90 dark:bg-zinc-50 dark:text-zinc-900"
                                    >
                                        Listo
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}

'use client'

import { useState, useTransition } from 'react'
import { Pencil, X, Loader2, Trash2 } from 'lucide-react'
import { updateMember, deleteMember } from '../actions'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { Member } from '@prisma/client'

interface Props {
    member: Member
}

export function EditMemberDialog({ member }: Props) {
    const [isOpen, setIsOpen] = useState(false)
    const [isPending, startTransition] = useTransition()
    const router = useRouter()

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault()
        const formData = new FormData(event.currentTarget)

        startTransition(async () => {
            const result = await updateMember(member.id, formData)

            if (result?.error) {
                toast.error(result.error)
            } else {
                toast.success('Miembro actualizado correctly')
                setIsOpen(false)
                router.refresh()
            }
        })
    }

    const handleDelete = async () => {
        if (!confirm('¿Estás seguro de eliminar este miembro?')) return

        startTransition(async () => {
            const result = await deleteMember(member.id)
            if (result?.error) {
                toast.error(result.error)
            } else {
                toast.success('Miembro eliminado')
                setIsOpen(false)
                router.refresh()
            }
        })
    }

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                className="rounded-md p-2 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800 dark:hover:text-zinc-300 transition-colors"
                title="Editar Miembro"
            >
                <Pencil className="h-4 w-4" />
            </button>

            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-200">
                    <div className="relative w-full max-w-md rounded-xl bg-white p-6 shadow-lg animate-in zoom-in-95 duration-200 dark:bg-zinc-950 dark:border dark:border-zinc-800">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">Editar Miembro</h2>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="rounded-full p-2 text-zinc-500 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label htmlFor="firstName" className="text-sm font-medium text-zinc-900 dark:text-zinc-50">Nombre</label>
                                    <input
                                        id="firstName"
                                        name="firstName"
                                        defaultValue={member.firstName}
                                        required
                                        className="flex h-9 w-full rounded-md border border-zinc-200 bg-white px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-zinc-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-950 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-800 dark:bg-zinc-950 dark:placeholder:text-zinc-400 dark:focus-visible:ring-zinc-300"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label htmlFor="lastName" className="text-sm font-medium text-zinc-900 dark:text-zinc-50">Apellido</label>
                                    <input
                                        id="lastName"
                                        name="lastName"
                                        defaultValue={member.lastName}
                                        required
                                        className="flex h-9 w-full rounded-md border border-zinc-200 bg-white px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-zinc-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-950 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-800 dark:bg-zinc-950 dark:placeholder:text-zinc-400 dark:focus-visible:ring-zinc-300"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label htmlFor="email" className="text-sm font-medium text-zinc-900 dark:text-zinc-50">Email</label>
                                <input
                                    id="email"
                                    name="email"
                                    type="email"
                                    defaultValue={member.email || ''}
                                    className="flex h-9 w-full rounded-md border border-zinc-200 bg-white px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-zinc-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-950 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-800 dark:bg-zinc-950 dark:placeholder:text-zinc-400 dark:focus-visible:ring-zinc-300"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label htmlFor="phone" className="text-sm font-medium text-zinc-900 dark:text-zinc-50">Teléfono</label>
                                    <input
                                        id="phone"
                                        name="phone"
                                        type="tel"
                                        defaultValue={member.phone || ''}
                                        className="flex h-9 w-full rounded-md border border-zinc-200 bg-white px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-zinc-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-950 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-800 dark:bg-zinc-950 dark:placeholder:text-zinc-400 dark:focus-visible:ring-zinc-300"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label htmlFor="birthDate" className="text-sm font-medium text-zinc-900 dark:text-zinc-50">Fecha de Nacimiento</label>
                                    <input
                                        id="birthDate"
                                        name="birthDate"
                                        type="date"
                                        defaultValue={member.birthDate ? new Date(member.birthDate).toISOString().split('T')[0] : ''}
                                        className="flex h-9 w-full rounded-md border border-zinc-200 bg-white px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-zinc-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-950 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-800 dark:bg-zinc-950 dark:placeholder:text-zinc-400 dark:focus-visible:ring-zinc-300"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label htmlFor="address" className="text-sm font-medium text-zinc-900 dark:text-zinc-50">Dirección</label>
                                <input
                                    id="address"
                                    name="address"
                                    defaultValue={member.address || ''}
                                    className="flex h-9 w-full rounded-md border border-zinc-200 bg-white px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-zinc-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-950 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-800 dark:bg-zinc-950 dark:placeholder:text-zinc-400 dark:focus-visible:ring-zinc-300"
                                />
                            </div>

                            <div className="flex justify-between items-center mt-6">
                                <button
                                    type="button"
                                    onClick={handleDelete}
                                    disabled={isPending}
                                    className="inline-flex items-center justify-center rounded-md text-sm font-medium text-red-500 hover:bg-red-50 hover:text-red-600 transition-colors h-9 px-4 py-2 dark:hover:bg-red-950/20"
                                >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Eliminar
                                </button>

                                <div className="flex gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setIsOpen(false)}
                                        className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-950 disabled:pointer-events-none disabled:opacity-50 border border-zinc-200 bg-transparent text-zinc-900 shadow-sm hover:bg-zinc-100 h-9 px-4 py-2 dark:border-zinc-800 dark:text-zinc-50 dark:hover:bg-zinc-800"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isPending}
                                        className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-950 disabled:pointer-events-none disabled:opacity-50 bg-zinc-900 text-zinc-50 shadow hover:bg-zinc-900/90 h-9 px-4 py-2 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-50/90"
                                    >
                                        {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        Guardar
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    )
}

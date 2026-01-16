import { getMembers } from './actions'
import { Plus, Search } from 'lucide-react'
import { CreateMemberDialog } from './components/CreateMemberDialog'

export default async function MembersPage({
    searchParams,
}: {
    searchParams: Promise<{ q?: string }>
}) {
    const params = await searchParams
    const query = params.q || ''
    const members = await getMembers(query)

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">Miembros</h1>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">
                        Gestiona el registro de miembros de tu iglesia.
                    </p>
                </div>
                <CreateMemberDialog />
            </div>

            {/* Search Bar - Todo: Make this a client component for debounce */}
            <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
                <form>
                    <input
                        name="q"
                        defaultValue={query}
                        placeholder="Buscar por nombre o email..."
                        className="flex h-10 w-full rounded-md border border-zinc-200 bg-white pl-10 pr-3 py-2 text-sm ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-zinc-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-800 dark:bg-zinc-950 dark:ring-offset-zinc-950 dark:placeholder:text-zinc-400 dark:focus-visible:ring-zinc-300"
                    />
                </form>
            </div>

            <div className="rounded-md border border-zinc-200 dark:border-zinc-800">
                <div className="relative w-full overflow-auto">
                    <table className="w-full caption-bottom text-sm text-left">
                        <thead className="[&_tr]:border-b">
                            <tr className="border-b border-zinc-200 transition-colors hover:bg-zinc-100/50 data-[state=selected]:bg-zinc-100 dark:border-zinc-800 dark:hover:bg-zinc-800/50 dark:data-[state=selected]:bg-zinc-800">
                                <th className="h-12 px-4 align-middle font-medium text-zinc-500 dark:text-zinc-400">Nombre</th>
                                <th className="h-12 px-4 align-middle font-medium text-zinc-500 dark:text-zinc-400">Email</th>
                                <th className="h-12 px-4 align-middle font-medium text-zinc-500 dark:text-zinc-400">Teléfono</th>
                                <th className="h-12 px-4 align-middle font-medium text-zinc-500 dark:text-zinc-400 text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="[&_tr:last-child]:border-0">
                            {members.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="p-4 text-center text-zinc-500">
                                        No se encontraron miembros.
                                    </td>
                                </tr>
                            ) : (
                                members.map((member) => (
                                    <tr
                                        key={member.id}
                                        className="border-b border-zinc-200 transition-colors hover:bg-zinc-100/50 data-[state=selected]:bg-zinc-100 dark:border-zinc-800 dark:hover:bg-zinc-800/50 dark:data-[state=selected]:bg-zinc-800"
                                    >
                                        <td className="p-4 align-middle font-medium text-zinc-900 dark:text-zinc-50">
                                            {member.firstName} {member.lastName}
                                        </td>
                                        <td className="p-4 align-middle text-zinc-600 dark:text-zinc-400">{member.email || '-'}</td>
                                        <td className="p-4 align-middle text-zinc-600 dark:text-zinc-400">{member.phone || '-'}</td>
                                        <td className="p-4 align-middle text-right">
                                            {/* Dropdown or Edit button placeholder */}
                                            <span className="text-zinc-400">...</span>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}

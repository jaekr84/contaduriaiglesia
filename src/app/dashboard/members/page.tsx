import { getMembers, getMemberStats } from './actions'
import { Search, Users } from 'lucide-react'
import { CreateMemberCard } from './components/CreateMemberCard'
import { EditMemberDialog } from './components/EditMemberDialog'
import { getCurrentProfile } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { formatDate } from '@/lib/dateUtils'
import { MemberStats } from './components/MemberStats'

export default async function MembersPage({
    searchParams,
}: {
    searchParams: Promise<{ q?: string }>
}) {
    const profile = await getCurrentProfile()

    // Allowed: ADMIN, RRHH, VIEWER
    if (!profile || !['ADMIN', 'RRHH', 'VIEWER'].includes(profile.role)) {
        redirect('/dashboard')
    }

    const canManageMembers = ['ADMIN', 'RRHH'].includes(profile.role)

    const params = await searchParams
    const query = params.q || ''

    // Conditional Data Fetching
    let members: any[] = []
    let stats: any = {}

    if (canManageMembers) {
        const [fetchedMembers, fetchedStats] = await Promise.all([
            getMembers(query),
            getMemberStats()
        ])
        members = fetchedMembers
        stats = fetchedStats
    } else {
        // Viewer only gets stats
        stats = await getMemberStats()
    }

    // Use totalMembers from stats if available (added for Viewer), otherwise from array length
    const totalMembers = stats.totalMembers ?? members.length

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">Miembros</h1>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                    Gestiona el registro de miembros de tu iglesia.
                </p>
            </div>

            {/* Advanced Stats Visualizations */}
            <MemberStats stats={stats} totalMembers={totalMembers} />

            {canManageMembers && (
                <>
                    <CreateMemberCard />

                    {/* Search Bar - Todo: Make this a client component for debounce */}
                    <div className="relative">
                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
                        <form>
                            <input
                                name="q"
                                defaultValue={query}
                                placeholder="Buscar por nombre o email..."
                                className="flex h-10 w-full rounded-md border border-zinc-200 bg-white py-2 pl-10 pr-3 text-sm ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-zinc-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-800 dark:bg-zinc-950 dark:ring-offset-zinc-950 dark:placeholder:text-zinc-400 dark:focus-visible:ring-zinc-300"
                            />
                        </form>
                    </div>

                    <div className="rounded-md border border-zinc-200 dark:border-zinc-800">
                        <div className="relative w-full overflow-auto">
                            <table className="w-full caption-bottom text-sm text-left">
                                <thead className="[&_tr]:border-b">
                                    <tr className="border-b border-zinc-200 transition-colors hover:bg-zinc-100/50 data-[state=selected]:bg-zinc-100 dark:border-zinc-800 dark:hover:bg-zinc-800/50 dark:data-[state=selected]:bg-zinc-800">
                                        <th className="h-12 px-4 align-middle font-medium text-zinc-500 dark:text-zinc-400">Nombre</th>
                                        <th className="h-12 px-4 align-middle font-medium text-zinc-500 dark:text-zinc-400">Apellido</th>
                                        <th className="h-12 px-4 align-middle font-medium text-zinc-500 dark:text-zinc-400">Fecha Nac.</th>
                                        <th className="h-12 px-4 align-middle font-medium text-zinc-500 dark:text-zinc-400">Género</th>
                                        <th className="h-12 px-4 align-middle font-medium text-zinc-500 dark:text-zinc-400">Teléfono</th>
                                        <th className="h-12 px-4 align-middle font-medium text-zinc-500 dark:text-zinc-400">País</th>
                                        <th className="h-12 px-4 align-middle font-medium text-zinc-500 dark:text-zinc-400">Provincia</th>
                                        <th className="h-12 px-4 align-middle font-medium text-zinc-500 dark:text-zinc-400">Localidad</th>
                                        <th className="h-12 px-4 align-middle font-medium text-zinc-500 dark:text-zinc-400">Dirección</th>
                                        <th className="text-right h-12 px-4 align-middle font-medium text-zinc-500 dark:text-zinc-400">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody className="[&_tr:last-child]:border-0">
                                    {members.length === 0 ? (
                                        <tr>
                                            <td colSpan={10} className="p-4 text-center text-zinc-500">
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
                                                    {member.firstName}
                                                </td>
                                                <td className="p-4 align-middle font-medium text-zinc-900 dark:text-zinc-50">
                                                    {member.lastName}
                                                </td>
                                                <td className="p-4 align-middle text-zinc-600 dark:text-zinc-400">
                                                    {member.birthDate ? formatDate(member.birthDate) : '-'}
                                                </td>
                                                <td className="p-4 align-middle text-zinc-600 dark:text-zinc-400">{member.gender || '-'}</td>
                                                <td className="p-4 align-middle text-zinc-600 dark:text-zinc-400">{member.phone || '-'}</td>
                                                <td className="p-4 align-middle text-zinc-600 dark:text-zinc-400">{member.country || '-'}</td>
                                                <td className="p-4 align-middle text-zinc-600 dark:text-zinc-400">{member.state || '-'}</td>
                                                <td className="p-4 align-middle text-zinc-600 dark:text-zinc-400">{member.city || '-'}</td>
                                                <td className="p-4 align-middle text-zinc-600 dark:text-zinc-400 max-w-[200px] truncate" title={member.address || ''}>
                                                    {member.address || '-'}
                                                </td>
                                                <td className="p-4 align-middle text-right">
                                                    <EditMemberDialog member={member} />
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            )}
        </div>
    )
}

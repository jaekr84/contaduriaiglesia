import { redirect } from 'next/navigation'
import { signout } from '@/app/auth/actions'
import { getCurrentProfile } from '@/lib/auth'
import Link from 'next/link'
import { LayoutDashboard, Users, Banknote, Menu, LineChart, ShieldCheck as UsersKey } from 'lucide-react'

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const profile = await getCurrentProfile()
    if (!profile) {
        redirect('/login')
    }

    return (
        <div className="flex h-screen w-full bg-zinc-50 dark:bg-black">
            {/* Sidebar - Hidden on mobile, fixed on desktop */}
            <aside className="hidden w-64 flex-col border-r border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950 md:flex">
                <div className="flex h-16 items-center border-b border-zinc-200 px-6 dark:border-zinc-800">
                    <span className="text-lg font-bold text-zinc-900 dark:text-zinc-50">Iglesia App</span>
                </div>
                <nav className="flex-1 space-y-1 p-4">
                    <Link
                        href="/dashboard"
                        className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-50"
                    >
                        <LayoutDashboard className="h-4 w-4" />
                        Dashboard
                    </Link>
                    <Link
                        href="/dashboard/members"
                        className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-50"
                    >
                        <Users className="h-4 w-4" />
                        Miembros
                    </Link>
                    <Link
                        href="/dashboard/finance"
                        className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-50"
                    >
                        <Banknote className="h-4 w-4" />
                        Finanzas
                    </Link>
                    <Link
                        href="/dashboard/balance"
                        className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-50"
                    >
                        <LineChart className="h-4 w-4" />
                        Estado Financiero
                    </Link>

                    {profile.role === 'ADMIN' && (
                        <Link
                            href="/dashboard/users"
                            className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-50"
                        >
                            <UsersKey className="h-4 w-4" />
                            Usuarios
                        </Link>
                    )}
                </nav>
                <div className="border-t border-zinc-200 p-4 dark:border-zinc-800">
                    <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-zinc-200 dark:bg-zinc-800" />
                        <div className="flex flex-col">
                            <span className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
                                {profile.email.split('@')[0]}
                            </span>
                            <span className="text-xs text-zinc-500 dark:text-zinc-400">Admin</span>
                        </div>
                    </div>
                    <form action={signout} className="mt-4">
                        <button
                            type="submit"
                            className="w-full text-left text-sm text-red-500 hover:text-red-600 dark:text-red-400"
                        >
                            Cerrar Sesión
                        </button>
                    </form>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex flex-1 flex-col overflow-y-auto">
                {/* Mobile Header */}
                <div className="flex h-16 items-center justify-between border-b border-zinc-200 bg-white px-4 dark:border-zinc-800 dark:bg-zinc-950 md:hidden">
                    <span className="font-bold text-zinc-900 dark:text-zinc-50">Iglesia App</span>
                    <button className="rounded-md p-2 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-900">
                        <Menu className="h-5 w-5" />
                    </button>
                </div>

                <div className="flex-1 p-8">
                    {children}
                </div>
            </main>
        </div>
    )
}

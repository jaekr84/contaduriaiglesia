import { redirect } from 'next/navigation'
import { signout } from '@/app/auth/actions'
import { getCurrentProfile } from '@/lib/auth'
import Link from 'next/link'
import { LayoutDashboard, Users, Banknote, Menu, LineChart, PieChart, ShieldCheck as UsersKey, FileText, LogOut, Settings } from 'lucide-react'

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const profile = await getCurrentProfile()
    if (!profile) {
        redirect('/login')
    }

    const navItems = []

    // Finanzas: ADMIN, TREASURER
    if (['ADMIN', 'TREASURER'].includes(profile.role)) {
        navItems.push({ href: '/dashboard/finance', label: 'Finanzas', icon: Banknote })
    }

    // Reportes (Annual Summary): ADMIN, TREASURER, VIEWER
    if (['ADMIN', 'TREASURER', 'VIEWER'].includes(profile.role)) {
        navItems.push({ href: '/dashboard/annual-summary', label: 'Reportes', icon: PieChart })
    }

    // Descargas: ADMIN, TREASURER
    if (['ADMIN', 'TREASURER'].includes(profile.role)) {
        navItems.push({ href: '/dashboard/reports', label: 'Descargas', icon: FileText })
    }

    // Miembros: ADMIN, RRHH, VIEWER
    if (['ADMIN', 'RRHH', 'VIEWER'].includes(profile.role)) {
        navItems.push({ href: '/dashboard/members', label: 'Miembros', icon: Users })
    }

    // Admin Only
    if (profile.role === 'ADMIN') {
        navItems.push(
            { href: '/dashboard/users', label: 'Usuarios', icon: UsersKey },
            { href: '/dashboard/audit-logs', label: 'Auditoría', icon: FileText },
            { href: '/dashboard/settings', label: 'Configuración', icon: Settings }
        )
    }

    return (
        <div className="flex min-h-screen w-full flex-col bg-zinc-50 dark:bg-black">
            {/* Top Navigation Bar */}
            <header className="sticky top-0 z-50 flex h-14 items-center justify-between border-b border-zinc-200 bg-white px-4 dark:border-zinc-800 dark:bg-zinc-950 shadow-sm">
                <div className="flex items-center gap-4">
                    <span className="text-lg font-bold text-zinc-900 dark:text-zinc-50 mr-4">Iglesia App</span>

                    {/* Desktop/Tablet Navigation - Scrollable if too many items */}
                    <nav className="flex items-center gap-1 overflow-x-auto no-scrollbar">
                        {navItems.map((item) => (
                            <Link
                                key={item.href}
                                href={item.href}
                                title={item.label}
                                className="flex h-10 items-center justify-center rounded-md px-3 gap-2 text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-900 focus:bg-zinc-100 focus:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-50"
                            >
                                <item.icon className="h-5 w-5" />
                                <span className="text-sm font-medium whitespace-nowrap">{item.label}</span>
                            </Link>
                        ))}
                    </nav>
                </div>

                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-3 border-l border-zinc-200 pl-4 dark:border-zinc-800">
                        <div className="flex flex-col text-right hidden sm:flex">
                            <span className="text-xs font-medium text-zinc-900 dark:text-zinc-50">
                                {profile.email.split('@')[0]}
                            </span>
                            <span className="text-[10px] text-zinc-500 dark:text-zinc-400">
                                {profile.role}
                            </span>
                        </div>
                        <div className="h-8 w-8 rounded-full bg-zinc-200 dark:bg-zinc-800" />

                        <form action={signout}>
                            <button
                                type="submit"
                                title="Cerrar Sesión"
                                className="flex h-10 w-10 items-center justify-center rounded-md text-zinc-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20 dark:hover:text-red-400"
                            >
                                <LogOut className="h-5 w-5" />
                            </button>
                        </form>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto w-full">
                <div className="w-full h-full p-4 md:p-8">
                    {children}
                </div>
            </main>
        </div>
    )
}

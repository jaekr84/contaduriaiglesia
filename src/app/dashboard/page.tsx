export default function DashboardPage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">Dashboard</h1>
                <p className="text-zinc-500 dark:text-zinc-400">Bienvenido al panel de control de tu iglesia.</p>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
                {/* KPI Card 1 */}
                <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Miembros Totales</span>
                    </div>
                    <div className="mt-2 text-2xl font-bold text-zinc-900 dark:text-zinc-50">120</div>
                </div>

                {/* KPI Card 2 */}
                <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Ingresos del Mes</span>
                    </div>
                    <div className="mt-2 text-2xl font-bold text-zinc-900 dark:text-zinc-50">$850.000</div>
                </div>

                {/* KPI Card 3 */}
                <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Gastos del Mes</span>
                    </div>
                    <div className="mt-2 text-2xl font-bold text-zinc-900 dark:text-zinc-50">$320.000</div>
                </div>
            </div>
        </div>
    )
}

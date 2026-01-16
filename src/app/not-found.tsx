import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default function NotFound() {
    return (
        <div className="flex h-screen w-full flex-col items-center justify-center bg-zinc-50 p-4 text-center dark:bg-black">
            <div className="max-w-md space-y-6">
                <div className="flex justify-center">
                    <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-zinc-100 shadow-sm dark:bg-zinc-900">
                        <span className="text-4xl font-bold text-zinc-900 dark:text-zinc-50">404</span>
                    </div>
                </div>
                <div className="space-y-2">
                    <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
                        Página no encontrada
                    </h1>
                    <p className="text-zinc-500 dark:text-zinc-400">
                        Lo sentimos, no pudimos encontrar la página que estás buscando. Puede que haya sido movida o eliminada.
                    </p>
                </div>
                <div>
                    <Link
                        href="/"
                        className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-zinc-900 px-8 text-sm font-medium text-zinc-50 transition-colors hover:bg-zinc-900/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-950 disabled:pointer-events-none disabled:opacity-50 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-50/90 dark:focus-visible:ring-zinc-300"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Volver al inicio
                    </Link>
                </div>
            </div>
        </div>
    )
}

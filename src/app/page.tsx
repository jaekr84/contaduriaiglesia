import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 dark:bg-black p-4 text-center">
      <div className="max-w-md space-y-8">
        <div className="flex justify-center">
          <div className="h-16 w-16 rounded-2xl bg-zinc-900 dark:bg-white flex items-center justify-center shadow-lg">
            <span className="text-white dark:text-black font-bold text-3xl">I</span>
          </div>
        </div>

        <div className="space-y-4">
          <h1 className="text-4xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-5xl">
            Iglesia App
          </h1>
          <p className="text-lg text-zinc-600 dark:text-zinc-400">
            Sistema de gestión integral para administración, miembros y finanzas eclesiásticas.
          </p>
        </div>

        <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
          <Link
            href="/dashboard"
            className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-zinc-900 px-8 text-sm font-medium text-white transition-colors hover:bg-zinc-900/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950 disabled:pointer-events-none disabled:opacity-50 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-50/90"
          >
            Ingresar al Sistema
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <p className="text-xs text-zinc-500 dark:text-zinc-500">
          © 2026 Iglesia App. Todos los derechos reservados.
        </p>
      </div>
    </div>
  );
}

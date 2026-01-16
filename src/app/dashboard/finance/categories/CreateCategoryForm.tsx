'use client'

import { createCategory } from '../actions'
import { Plus, Loader2 } from 'lucide-react'
import { useRef, useTransition } from 'react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { Category } from '@prisma/client'

// Extended type to include relations if needed, but here simple Category is enough for the dropdown
interface Props {
    type: 'INCOME' | 'EXPENSE'
}

export function CreateCategoryForm({ type }: Props) {
    const [isPending, startTransition] = useTransition()
    const formRef = useRef<HTMLFormElement>(null)
    const router = useRouter()

    const action = async (formData: FormData) => {
        formData.set('type', type)
        startTransition(async () => {
            const result = await createCategory(formData)
            if (result?.error) {
                toast.error(result.error)
            } else {
                toast.success('Categoría agregada')
                formRef.current?.reset()
                router.refresh()
            }
        })
    }

    return (
        <form ref={formRef} action={action} className="flex gap-2 items-center">
            <div className="flex-1">
                <input
                    name="name"
                    required
                    placeholder="Nueva categoría principal (ej: Luz, Agua, Internet)"
                    className="flex h-9 w-full rounded-md border border-zinc-200 bg-white px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-zinc-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-950 dark:border-zinc-800 dark:bg-zinc-950 dark:placeholder:text-zinc-400 dark:focus-visible:ring-zinc-300"
                />
            </div>

            <button
                type="submit"
                disabled={isPending}
                className="inline-flex items-center justify-center rounded-md bg-zinc-900 px-3 h-9 text-sm font-medium text-zinc-50 shadow hover:bg-zinc-900/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-950 disabled:pointer-events-none disabled:opacity-50 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-50/90"
            >
                {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            </button>
        </form>
    )
}

import { getCategories } from '../actions'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { CreateCategoryForm } from './CreateCategoryForm'
import { CategoryList } from './CategoryList'

export default async function CategoriesPage() {
    const categories = await getCategories()

    const incomeCategories = categories.filter(c => c.type === 'INCOME')
    const expenseCategories = categories.filter(c => c.type === 'EXPENSE')

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Link
                    href="/dashboard/finance"
                    className="rounded-full p-2 text-zinc-500 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
                >
                    <ArrowLeft className="h-4 w-4" />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">Gestionar Categorías</h1>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">
                        Crea categorías principales y subcategorías.
                    </p>
                </div>
            </div>

            <div className="grid gap-8 md:grid-cols-2">
                {/* Income Section */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between rounded-lg border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900">
                        <h2 className="font-semibold text-green-700 dark:text-green-400">Categorías de Ingreso</h2>
                    </div>

                    {/* Form receives potential parents (top-level only to keep depth 2, or all?) */}
                    {/* Let's pass all income categories, but logic inside might want to filter 'child' ones to avoid infinite nesting loop if strict 2-level. */}
                    {/* For now, just passing filtering root ones (parentId null) as candidates for Parents is safer for 2-level hierarchy. */}
                    <CreateCategoryForm
                        type="INCOME"
                    />

                    <CategoryList categories={incomeCategories} />
                </div>

                {/* Expense Section */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between rounded-lg border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900">
                        <h2 className="font-semibold text-red-700 dark:text-red-400">Categorías de Gasto</h2>
                    </div>

                    <CreateCategoryForm
                        type="EXPENSE"
                    />

                    <CategoryList categories={expenseCategories} />
                </div>
            </div>
        </div>
    )
}

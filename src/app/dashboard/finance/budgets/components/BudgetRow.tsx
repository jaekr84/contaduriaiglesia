'use client'

import { BudgetRow as BudgetRowType } from '../../budget-actions'
import { MoneyInput } from '../../components/MoneyInput'
import { cn } from '@/lib/utils'

// If Progress component doesn't exist, I'll use a simple div
// I'll assume standard shadcn/ui or simple div

interface Props {
    row: BudgetRowType
    month: number
    year: number
    isEditing: boolean
    inputValue: string
    onInputChange: (value: string) => void
}

export function BudgetRow({ row, month, year, isEditing, inputValue, onInputChange }: Props) {
    const percentage = Math.min(row.percentage, 100)
    let progressColor = 'bg-green-500'
    if (percentage >= 80) progressColor = 'bg-yellow-500'
    if (percentage >= 100) progressColor = 'bg-red-500'

    // MoneyInput doesn't have onBlur prop exposed that we want to hook into for SAVING, 
    // it has internal onBlur for formatting.
    // Wait, MoneyInput DOES accept onBlur? No, looking at the code:
    // `onBlur={handleBlur}` (internal). It doesn't propagate `props.onBlur` or call it.
    // I should modify MoneyInput to accept onBlur or wrap it.
    // Or I can add a save button?
    // Inline editing usually saves on blur.
    // I will use `onKeyDown` for Enter, and maybe I can modify MoneyInput to forward onBlur.
    // But modification is risky if used elsewhere.
    // Actually, `MoneyInput` lines 123: `onBlur={handleBlur}`. It takes `handleBlur` which formats.
    // It doesn't accept `onBlur` in props interface.
    // So I can't detect blur easily on the component instance.
    // I will wrap it in a div and catch focusOut? Or just use a "Check" button?
    // Using a button is clearer. "Guardar".
    // Or just saving on "Enter".
    // Let's add a small save button that appears if changed?
    // Changed? `budget` !== `row.budgetAmount`.



    return (
        <div className="grid grid-cols-12 gap-4 py-3 items-center border-b border-zinc-100 dark:border-zinc-800 last:border-0 hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors px-4">
            {/* Category Name */}
            <div className="col-span-4 flex flex-col justify-center">
                <span className={cn("font-medium text-sm text-zinc-700 dark:text-zinc-200", row.categoryParentName && "pl-4 border-l-2 border-zinc-200 dark:border-zinc-700", row.hasChildren && "font-bold text-base")}>
                    {row.categoryName}
                </span>
                {row.categoryParentName && (
                    <span className="text-xs text-zinc-400 pl-4">
                        {row.categoryParentName}
                    </span>
                )}
            </div>

            {/* Budget Input */}
            <div className="col-span-3">
                {row.hasChildren ? (
                    <div className="w-full text-right h-8 text-sm font-bold flex items-center justify-end">
                        {new Intl.NumberFormat('es-AR', { style: 'currency', currency: row.currency }).format(row.budgetAmount)}
                    </div>
                ) : (
                    isEditing ? (
                        <div className="relative flex items-center justify-end">
                            <MoneyInput
                                value={inputValue}
                                onChange={onInputChange}
                                className="w-full text-right h-8 text-sm"
                                placeholder="0.00"
                            />
                        </div>
                    ) : (
                        <div className="flex items-center justify-end h-8">
                            <span className="text-sm">
                                {new Intl.NumberFormat('es-AR', { style: 'currency', currency: row.currency }).format(inputValue ? parseFloat(inputValue) : row.budgetAmount)}
                            </span>
                        </div>
                    )
                )}
            </div>

            {/* Spent Amount */}
            <div className="col-span-2 text-right text-sm text-zinc-600 dark:text-zinc-400">
                {new Intl.NumberFormat('es-AR', { minimumFractionDigits: 2 }).format(row.spentAmount)}
            </div>

            {/* Progress & Remaining */}
            <div className="col-span-3 flex flex-col gap-1">
                <div className="flex justify-between text-xs">
                    <span className={cn(
                        "font-medium",
                        row.remaining < 0 ? "text-red-500" : "text-zinc-500"
                    )}>
                        {row.remaining < 0 ? 'Excedido: ' : 'Restante: '}
                        {new Intl.NumberFormat('es-AR', { style: 'currency', currency: row.currency }).format(Math.abs(row.remaining))}
                    </span>
                    <span className="text-zinc-400">{Math.round(row.percentage)}%</span>
                </div>
                <div className="h-2 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                    <div
                        className={cn("h-full transition-all duration-500", progressColor)}
                        style={{ width: `${percentage}%` }}
                    />
                </div>
            </div>
        </div>
    )
}

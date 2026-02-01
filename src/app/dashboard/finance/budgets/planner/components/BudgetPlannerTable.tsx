'use client'

import { useState, useTransition, useEffect } from 'react'
import { BudgetOverview, saveAnnualBudget } from '../../../budget-actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ArrowLeft, Check, Loader2, RefreshCw, Calculator, ArrowRight, Download, Repeat, Lock, Unlock, Pencil, X, Plus } from 'lucide-react'
import { AddCategoryCard } from './AddCategoryCard'
import { MoneyInput } from '../../../components/MoneyInput'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import Link from 'next/link'
import { exportToExcel } from '@/lib/excel-export'
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

interface Props {
    baseOverview: BudgetOverview
    baseYear: number
    targetYear: number
    initialData?: Record<string, { ARS: number[], USD: number[] }>
}

type PlannerRow = {
    categoryId: string
    categoryName: string
    baseBudget: number
    baseSpent: number
    newBudget: number
    hasChildren: boolean
    parentId: string | null
    annualBaseBudget: number
    annualBaseSpent: number
}

export function BudgetPlannerTable({ baseOverview, baseYear, targetYear, initialData }: Props) {
    const [currency, setCurrency] = useState<'ARS' | 'USD'>('ARS')

    // State: map[categoryId] -> Array(12) of numbers.
    const [draftValues, setDraftValues] = useState<Record<string, number[]>>(() => {
        if (!initialData) return {}
        const initial: Record<string, number[]> = {}
        Object.entries(initialData).forEach(([catId, values]) => {
            initial[catId] = values['ARS'] // Default to ARS
        })
        return initial
    })

    // Sync draft values when currency changes or initialData loads
    useEffect(() => {
        if (initialData) {
            setDraftValues(prev => {
                const next = { ...prev }
                Object.entries(initialData).forEach(([catId, values]) => {
                    // Only overwrite if not already set? Or always overwrite on currency switch?
                    // Issue: If user edits ARS, then switches to USD, we want to see USD saved values.
                    // But if user edits ARS, switches back to ARS, we want to keep edits?
                    // Current simplifiction: Reset to initialData[currency] on currency switch?
                    // Better: Merge mechanism is complex. 
                    // Let's just load the appropriate currency data into draftValues.
                    next[catId] = values[currency]
                })
                return next
            })
        }
    }, [currency, initialData])

    // 'annual' or '1'..'12'
    const [activeTab, setActiveTab] = useState<string>('annual')

    const [showEmpty, setShowEmpty] = useState(false)
    const [inflationRate, setInflationRate] = useState('0')
    const [isSaving, startTransition] = useTransition()

    // Safety: Edit Modes
    const [isGlobalEditing, setIsGlobalEditing] = useState(false)
    const [editingCategories, setEditingCategories] = useState<Set<string>>(new Set())

    const toggleRowEditing = (categoryId: string) => {
        setEditingCategories(prev => {
            const next = new Set(prev)
            if (next.has(categoryId)) {
                next.delete(categoryId)
            } else {
                next.add(categoryId)
            }
            return next
        })
    }

    const rows = baseOverview[currency]

    // Helper: Get monthly values for a row (init with 0s if empty)
    const getValues = (categoryId: string) => {
        if (!draftValues[categoryId]) {
            // Can we init from "base"?
            // We only have Base Annual. We don't know monthly breakdown of base here effectively unless we fetch it.
            // Assumption: New Budget starts at 0.
            return Array(12).fill(0)
        }
        return draftValues[categoryId]
    }

    const updateValue = (categoryId: string, newValue: number) => {
        const current = getValues(categoryId)
        const next = [...current]

        if (activeTab === 'annual') {
            // Distribute equally
            const monthly = newValue / 12
            for (let i = 0; i < 12; i++) next[i] = monthly
        } else {
            // Update specific month (0-indexed)
            const monthIndex = parseInt(activeTab) - 1
            if (monthIndex >= 0 && monthIndex < 12) {
                next[monthIndex] = newValue
            }
        }
        setDraftValues(prev => ({ ...prev, [categoryId]: next }))
    }

    const getRowData = (row: any): PlannerRow => {
        const values = getValues(row.categoryId)
        let newBudget = 0

        // Parent Logic: Sum children
        if (row.hasChildren) {
            const children = rows.filter((r: any) => r.parentId === row.categoryId)
            const childrenValuesSum = children.reduce((acc: number[], child: any) => {
                const cVals = getValues(child.categoryId)
                // Element-wise sum
                return acc.map((v, i) => v + cVals[i])
            }, Array(12).fill(0))

            // Now decide what to return based on activeTab
            if (activeTab === 'annual') {
                newBudget = childrenValuesSum.reduce((a, b) => a + b, 0)
            } else {
                const idx = parseInt(activeTab) - 1
                newBudget = childrenValuesSum[idx] || 0
            }
        } else {
            // Leaf Node
            if (activeTab === 'annual') {
                newBudget = values.reduce((a, b) => a + b, 0)
            } else {
                const idx = parseInt(activeTab) - 1
                newBudget = values[idx] || 0
            }
        }

        // Base Budget/Spent:
        // Current 'row' has ANNUAL base amounts.
        // In monthly view, should we divide by 12 to show "Average Base"? 
        // User requested: "presupuesto anterior en monto y %".
        // Let's show Annual/12 as a reference for monthly view.
        let displayBaseBudget = row.budgetAmount
        let displayBaseSpent = row.spentAmount

        if (activeTab !== 'annual') {
            displayBaseBudget = row.budgetAmount / 12
            displayBaseSpent = row.spentAmount / 12 // Approximation, as we don't have monthly history loaded
        }

        return {
            categoryId: row.categoryId,
            categoryName: row.categoryName,
            baseBudget: displayBaseBudget,
            baseSpent: displayBaseSpent,
            newBudget,
            hasChildren: row.hasChildren || false,
            parentId: row.parentId || null,
            annualBaseBudget: row.budgetAmount,
            annualBaseSpent: row.spentAmount,
        }
    }

    const plannerRows = rows.map(getRowData)

    const filteredRows = plannerRows.filter(r => {
        if (showEmpty) return true
        return r.baseBudget > 0 || r.baseSpent > 0 || r.newBudget > 0
    })

    // Actions
    const handleCopyBaseBudget = () => {
        const newDraft: Record<string, number[]> = {}
        rows.forEach(r => {
            if (!r.hasChildren) {
                // Copy Annual / 12 to all months
                const monthly = r.budgetAmount / 12
                newDraft[r.categoryId] = Array(12).fill(monthly)
            }
        })
        setDraftValues(newDraft)
        toast.success(`Valores copiados del presupuesto ${baseYear}`)
    }

    const handleCopyBaseSpent = () => {
        const newDraft: Record<string, number[]> = {}
        rows.forEach(r => {
            if (!r.hasChildren) {
                const monthly = r.spentAmount / 12
                newDraft[r.categoryId] = Array(12).fill(monthly)
            }
        })
        setDraftValues(newDraft)
        toast.success(`Valores copiados del gasto ${baseYear}`)
    }

    const handleApplyInflation = () => {
        const rate = parseFloat(inflationRate)
        if (isNaN(rate) || rate === 0) return

        setDraftValues(prev => {
            const next = { ...prev }
            Object.keys(next).forEach(key => {
                const current = next[key]
                next[key] = current.map(v => v * (1 + rate / 100))
            })
            return next
        })
        toast.success(`Inflación de ${rate}% aplicada`)
    }

    const handlePropagateValue = (categoryId: string, value: number) => {
        setDraftValues(prev => ({
            ...prev,
            [categoryId]: Array(12).fill(value)
        }))
        toast.success('Valor aplicado a todos los meses')
    }

    const handleSave = () => {
        startTransition(async () => {
            const updates = Object.entries(draftValues).map(([categoryId, amounts]) => ({
                categoryId,
                amounts, // Array of 12
                currency
            }))

            const result = await saveAnnualBudget(updates, targetYear)
            if (result.error) {
                toast.error(result.error)
            } else {
                toast.success('Presupuesto anual creado correctamente')
                setIsGlobalEditing(false) // Disable editing mode after save
            }
        })
    }

    const handleExport = () => {
        const monthNames = ['Anual', 'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']
        const sheets = []

        // Iterate 0 (Annual) to 12
        for (let m = 0; m <= 12; m++) {
            const sheetRows = filteredRows.map(row => {
                // Calculate New Budget for this specific month/annual
                let newBudget = 0
                const vals = getValues(row.categoryId) // Always array of 12

                if (row.hasChildren) {
                    const children = rows.filter((r: any) => r.parentId === row.categoryId)
                    const childrenValuesSum = children.reduce((acc: number[], child: any) => {
                        const cVals = getValues(child.categoryId)
                        return acc.map((v, i) => v + cVals[i])
                    }, Array(12).fill(0))

                    if (m === 0) { // Annual
                        newBudget = childrenValuesSum.reduce((a, b) => a + b, 0)
                    } else {
                        newBudget = childrenValuesSum[m - 1] || 0
                    }
                } else {
                    if (m === 0) {
                        newBudget = vals.reduce((a, b) => a + b, 0)
                    } else {
                        newBudget = vals[m - 1] || 0
                    }
                }

                // Base Budget/Spent approximation (Annual / 12) or Total
                // Base is ALWAYS annual in incoming data 'row.baseBudget'.
                // Base Budget/Spent approximation (Annual / 12) or Total
                // Use explicit annualBaseBudget from row to avoid view-dependent errors
                let baseBudget = row.annualBaseBudget
                let baseSpent = row.annualBaseSpent
                if (m > 0) {
                    baseBudget = row.annualBaseBudget / 12
                    baseSpent = row.annualBaseSpent / 12
                }

                const diff = newBudget - baseBudget
                const diffPercent = baseBudget > 0 ? (diff / baseBudget) * 100 : 0

                return {
                    'Categoría': row.categoryName,
                    [`Presupuesto Base`]: baseBudget, // Simplified header
                    [`Gastado Base`]: baseSpent,
                    [`Nuevo Presupuesto`]: newBudget,
                    'Variación $': diff,
                    'Variación %': diffPercent.toFixed(2) + '%'
                }
            })

            sheets.push({
                name: monthNames[m],
                data: sheetRows
            })
        }

        exportToExcel(sheets, `Planificacion_${targetYear}_Completa_${currency}`)
    }

    // Totals
    const totalBaseBudget = filteredRows.reduce((acc, r) => acc + r.baseBudget, 0)
    const totalNewBudget = filteredRows.reduce((acc, r) => acc + r.newBudget, 0)
    const totalDiff = totalNewBudget - totalBaseBudget
    const totalDiffPercent = totalBaseBudget > 0 ? (totalDiff / totalBaseBudget) * 100 : 0

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">Planificador de Presupuesto</h1>

            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-zinc-50 dark:bg-zinc-900/50 p-4 rounded-lg border">
                <div className="flex items-center gap-4">
                    <Tabs value={currency} onValueChange={(v) => setCurrency(v as 'ARS' | 'USD')} className="w-auto">
                        <TabsList>
                            <TabsTrigger value="ARS">Pesos (ARS)</TabsTrigger>
                            <TabsTrigger value="USD">Dólares (USD)</TabsTrigger>
                        </TabsList>
                    </Tabs>

                    <div className="flex items-center space-x-2">
                        <Switch id="show-empty" checked={showEmpty} onCheckedChange={setShowEmpty} />
                        <Label htmlFor="show-empty">Mostrar vacíos</Label>
                    </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                    <Button variant="outline" size="sm" onClick={handleExport}>
                        <Download className="h-4 w-4 mr-2" />
                        Exportar
                    </Button>

                    <Button variant="outline" size="sm" onClick={() => setIsGlobalEditing(!isGlobalEditing)} className={cn("min-w-[140px]", isGlobalEditing ? "bg-amber-50 text-amber-600 border-amber-200 hover:bg-amber-100 hover:text-amber-700 dark:bg-amber-900/10 dark:text-amber-400 dark:border-amber-800" : "")}>
                        {isGlobalEditing ? <Unlock className="h-4 w-4 mr-2" /> : <Lock className="h-4 w-4 mr-2" />}
                        {isGlobalEditing ? 'Edición Habilitada' : 'Habilitar Edición'}
                    </Button>
                    {isGlobalEditing && (
                        <>
                            <Button variant="outline" size="sm" onClick={handleCopyBaseBudget}>
                                Copiar Presupuesto {baseYear}
                            </Button>
                            <Button variant="outline" size="sm" onClick={handleCopyBaseSpent}>
                                Copiar Gastado {baseYear}
                            </Button>
                        </>
                    )}
                </div>
            </div>

            <div>
                {isGlobalEditing && (
                    <AddCategoryCard
                        allCategories={plannerRows.map(r => ({ id: r.categoryId, name: r.categoryName, parentId: r.parentId }))}
                        targetYear={targetYear}
                        onSuccess={() => setIsGlobalEditing(false)}
                    />
                )}            </div>

            <div className="space-y-4">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="w-full justify-start overflow-x-auto">
                        <TabsTrigger value="annual" className="font-bold">Anual Total</TabsTrigger>
                        {Array.from({ length: 12 }, (_, i) => (
                            <TabsTrigger key={i} value={(i + 1).toString()} className="capitalize">
                                {new Date(2000, i, 1).toLocaleDateString('es-AR', { month: 'long' })}
                            </TabsTrigger>
                        ))}
                    </TabsList>
                </Tabs>

                <div className="rounded-md border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[300px]">Categoría</TableHead>
                                <TableHead className="text-right">
                                    {activeTab === 'annual' ? `Presupuesto Base ${baseYear}` : 'Promedio Base'}
                                </TableHead>
                                <TableHead className="text-right">
                                    {activeTab === 'annual' ? `Gastado Base ${baseYear}` : 'Promedio Gastado'}
                                </TableHead>
                                <TableHead className="text-right bg-zinc-50 dark:bg-zinc-800/50 min-w-[150px]">
                                    {activeTab === 'annual' ? `Nuevo Total ${targetYear}` : `Nuevo ${new Date(2000, parseInt(activeTab) - 1).toLocaleDateString('es-AR', { month: 'long' })}`}
                                </TableHead>
                                <TableHead className="text-right">Variación $</TableHead>
                                <TableHead className="text-right">Variación %</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredRows.map((row) => {
                                const diff = row.newBudget - row.baseBudget
                                const diffPercent = row.baseBudget > 0 ? (diff / row.baseBudget) * 100 : 0

                                if (row.hasChildren) {
                                    return (
                                        <TableRow key={row.categoryId} className="bg-zinc-50/50 dark:bg-zinc-900/50 font-bold">
                                            <TableCell className="font-bold">{row.categoryName}</TableCell>
                                            <TableCell className="text-right text-zinc-500">
                                                {new Intl.NumberFormat('es-AR', { style: 'currency', currency }).format(row.baseBudget)}
                                            </TableCell>
                                            <TableCell className="text-right text-zinc-500">
                                                {new Intl.NumberFormat('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(row.baseSpent)}
                                            </TableCell>
                                            <TableCell className="text-right font-medium">
                                                {new Intl.NumberFormat('es-AR', { style: 'currency', currency }).format(row.newBudget)}
                                            </TableCell>
                                            <TableCell className={cn("text-right font-medium", diff > 0 ? "text-red-500" : diff < 0 ? "text-green-600" : "text-zinc-500")}>
                                                {diff > 0 && '+'}{new Intl.NumberFormat('es-AR', { minimumFractionDigits: 0 }).format(diff)}
                                            </TableCell>
                                            <TableCell className={cn("text-right text-xs", diff > 0 ? "text-red-500" : diff < 0 ? "text-green-600" : "text-zinc-500")}>
                                                {diff !== 0 && (
                                                    <span className="bg-zinc-100 dark:bg-zinc-800 px-1 py-0.5 rounded">
                                                        {diffPercent.toFixed(1)}%
                                                    </span>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    )
                                }

                                return (
                                    <TableRow key={row.categoryId}>
                                        <TableCell className="font-medium">{row.categoryName}</TableCell>
                                        <TableCell className="text-right text-zinc-500">
                                            {new Intl.NumberFormat('es-AR', { style: 'currency', currency }).format(row.baseBudget)}
                                        </TableCell>
                                        <TableCell className="text-right text-zinc-500">
                                            {new Intl.NumberFormat('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(row.baseSpent)}
                                        </TableCell>
                                        <TableCell className="text-right bg-zinc-50 dark:bg-zinc-800/50">
                                            <div className="flex items-center justify-end gap-1">
                                                <MoneyInput
                                                    value={row.newBudget === 0 ? '' : row.newBudget.toString()}
                                                    placeholder="0"
                                                    disabled={!isGlobalEditing && !editingCategories.has(row.categoryId)}
                                                    onChange={(val) => {
                                                        const num = parseFloat(val)
                                                        if (isNaN(num)) {
                                                            updateValue(row.categoryId, 0)
                                                        } else {
                                                            updateValue(row.categoryId, num)
                                                        }
                                                    }}
                                                    className={cn(
                                                        "h-8 text-right border-zinc-200 dark:border-zinc-700 transition-colors",
                                                        (!isGlobalEditing && !editingCategories.has(row.categoryId))
                                                            ? "bg-zinc-50 text-zinc-500 dark:bg-zinc-800/50 dark:text-zinc-500 cursor-not-allowed"
                                                            : "bg-white dark:bg-zinc-900"
                                                    )}
                                                />
                                                {!isGlobalEditing && (
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 ml-1 text-zinc-400 hover:text-zinc-600 dark:text-zinc-600 dark:hover:text-zinc-400"
                                                        title={editingCategories.has(row.categoryId) ? "Terminar edición" : "Editar fila"}
                                                        onClick={() => toggleRowEditing(row.categoryId)}
                                                    >
                                                        {editingCategories.has(row.categoryId) ? <Check className="h-3 w-3" /> : <Pencil className="h-3 w-3" />}
                                                    </Button>
                                                )}
                                                {(isGlobalEditing || editingCategories.has(row.categoryId)) && activeTab !== 'annual' && (
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 ml-1 text-zinc-400 hover:text-zinc-600 dark:text-zinc-600 dark:hover:text-zinc-400"
                                                        title="Repetir este valor en todos los meses"
                                                        onClick={() => handlePropagateValue(row.categoryId, row.newBudget)}
                                                    >
                                                        <Repeat className="h-3 w-3" />
                                                    </Button>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell className={cn("text-right font-medium", diff > 0 ? "text-red-500" : diff < 0 ? "text-green-600" : "text-zinc-500")}>
                                            {diff > 0 && '+'}{new Intl.NumberFormat('es-AR', { minimumFractionDigits: 0 }).format(diff)}
                                        </TableCell>
                                        <TableCell className={cn("text-right text-xs", diff > 0 ? "text-red-500" : diff < 0 ? "text-green-600" : "text-zinc-500")}>
                                            {diff !== 0 && (
                                                <span className="bg-zinc-100 dark:bg-zinc-800 px-1 py-0.5 rounded">
                                                    {diffPercent.toFixed(1)}%
                                                </span>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                )
                            })}

                            <TableRow className="bg-zinc-100 dark:bg-zinc-800 font-bold hover:bg-zinc-100">
                                <TableCell>TOTAL</TableCell>
                                <TableCell className="text-right">
                                    {new Intl.NumberFormat('es-AR', { style: 'currency', currency }).format(totalBaseBudget)}
                                </TableCell>
                                <TableCell className="text-right"></TableCell>
                                <TableCell className="text-right">
                                    {new Intl.NumberFormat('es-AR', { style: 'currency', currency }).format(totalNewBudget)}
                                </TableCell>
                                <TableCell className="text-right">
                                    {new Intl.NumberFormat('es-AR', { style: 'currency', currency }).format(totalDiff)}
                                </TableCell>
                                <TableCell className="text-right">
                                    {totalDiffPercent.toFixed(1)}%
                                </TableCell>
                            </TableRow>
                        </TableBody>
                    </Table>
                </div>
            </div>

            {isGlobalEditing && (
                <div className="flex justify-end gap-3 sticky bottom-4 bg-white dark:bg-zinc-950 p-4 border rounded-lg shadow-lg">
                    <Button variant="ghost" asChild>
                        <Link href="/dashboard/finance/budgets">Cancelar</Link>
                    </Button>

                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button disabled={isSaving || filteredRows.length === 0} className="w-auto px-6 bg-green-600 hover:bg-green-700 text-white">
                                {isSaving ? <Loader2 className="animate-spin mr-2" /> : <Check className="mr-2" />}
                                Guardar Presupuesto {targetYear}
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>¿Confirmar nuevo presupuesto?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    Estás a punto de sobrescribir el presupuesto del año {targetYear}.
                                    Esta acción guardará los montos definidos para cada mes y categoría.
                                    <br /><br />
                                    Por favor, asegúrate de haber revisado todos los meses antes de continuar.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction onClick={handleSave} className="bg-green-600 hover:bg-green-700">
                                    Confirmar y Guardar
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </div>
            )}
        </div >
    )
}

'use client'

import { useState, useTransition } from 'react'
import { BudgetOverview, saveAnnualBudget } from '../../../budget-actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ArrowLeft, Check, Loader2, RefreshCw, Calculator, ArrowRight, Download } from 'lucide-react'
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
}

type SimulatorRow = {
    categoryId: string
    categoryName: string
    baseBudget: number
    baseSpent: number
    newBudget: number
    hasChildren: boolean
}

export function BudgetSimulatorTable({ baseOverview, baseYear, targetYear }: Props) {
    const [currency, setCurrency] = useState<'ARS' | 'USD'>('ARS')

    // State: map[categoryId] -> Array(12) of numbers.
    const [draftValues, setDraftValues] = useState<Record<string, number[]>>({})

    // 'annual' or '1'..'12'
    const [activeTab, setActiveTab] = useState<string>('annual')

    const [showEmpty, setShowEmpty] = useState(false)
    const [inflationRate, setInflationRate] = useState('0')
    const [isSaving, startTransition] = useTransition()

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

    const getRowData = (row: any): SimulatorRow => {
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
            hasChildren: row.hasChildren || false
        }
    }

    const simulatorRows = rows.map(getRowData)

    const filteredRows = simulatorRows.filter(r => {
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
                let baseBudget = row.baseBudget
                let baseSpent = row.baseSpent
                if (m > 0) {
                    baseBudget = row.baseBudget / 12
                    baseSpent = row.baseSpent / 12
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

        exportToExcel(sheets, `Simulacion_${targetYear}_Completa_${currency}`)
    }

    // Totals
    const totalBaseBudget = filteredRows.reduce((acc, r) => acc + r.baseBudget, 0)
    const totalNewBudget = filteredRows.reduce((acc, r) => acc + r.newBudget, 0)
    const totalDiff = totalNewBudget - totalBaseBudget
    const totalDiffPercent = totalBaseBudget > 0 ? (totalDiff / totalBaseBudget) * 100 : 0

    return (
        <div className="space-y-6">
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
                    <Button variant="outline" size="sm" onClick={handleCopyBaseBudget}>
                        Copiar Presupuesto {baseYear}
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleCopyBaseSpent}>
                        Copiar Gastado {baseYear}
                    </Button>

                    <div className="flex items-center gap-2 border-l pl-2 dark:border-zinc-700">
                        <div className="relative">
                            <Input
                                className="w-20 h-8"
                                placeholder="%"
                                value={inflationRate}
                                onChange={e => setInflationRate(e.target.value)}
                            />
                            <span className="absolute right-2 top-1.5 text-xs text-zinc-400">%</span>
                        </div>
                        <Button variant="secondary" size="sm" onClick={handleApplyInflation}>
                            <Calculator className="h-4 w-4 mr-2" />
                            Ajustar
                        </Button>
                    </div>
                </div>
            </div>

            <div className="space-y-4">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="w-full justify-start overflow-x-auto">
                        <TabsTrigger value="annual" className="font-bold">Anual Total</TabsTrigger>
                        {Array.from({ length: 12 }, (_, i) => (
                            <TabsTrigger key={i} value={(i + 1).toString()}>
                                {new Date(2000, i, 1).toLocaleDateString('es-AR', { month: 'short' })}
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
                                                {new Intl.NumberFormat('es-AR', { minimumFractionDigits: 2 }).format(row.baseSpent)}
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
                                            {new Intl.NumberFormat('es-AR', { minimumFractionDigits: 2 }).format(row.baseSpent)}
                                        </TableCell>
                                        <TableCell className="text-right bg-zinc-50 dark:bg-zinc-800/50">
                                            <MoneyInput
                                                value={row.newBudget.toString()}
                                                onChange={(val) => {
                                                    const num = parseFloat(val)
                                                    if (!isNaN(num)) {
                                                        updateValue(row.categoryId, num)
                                                    }
                                                }}
                                                className="h-8 text-right bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700"
                                            />
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
        </div>
    )
}



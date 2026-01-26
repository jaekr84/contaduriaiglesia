'use client'

import { BudgetOverview, getYearlyExportData, updateBatchBudgets } from '../../budget-actions'
import { BudgetRow } from './BudgetRow'
import { BudgetSummary } from './BudgetSummary'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Download, Loader2, Check, Pencil } from 'lucide-react'
import { exportToExcel } from '@/lib/excel-export'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'

import { toast } from 'sonner'

interface Props {
    overview: BudgetOverview
    month: number
    year: number
    userRole: string
}

export function BudgetList({ overview, month, year, userRole }: Props) {
    const [activeTab, setActiveTab] = useState<'ARS' | 'USD'>('ARS')
    const [isExporting, setIsExporting] = useState(false)

    const handleExport = async () => {
        setIsExporting(true)
        try {
            const data = await getYearlyExportData(year)
            if ('error' in data) {
                toast.error(data.error as string)
                return
            }

            const sheets = []

            // 1. Annual Sheet
            const formatRows = (rows: any[]) => rows.map((row: any) => ({
                'Categoría': row.categoryName,
                'Padre': row.categoryParentName || '-',
                'Presupuesto': row.budgetAmount,
                'Gastado': row.spentAmount,
                'Disponible': row.remaining,
                '% Ejecución': (row.percentage).toFixed(2) + '%'
            }))

            sheets.push({
                name: 'Anual',
                data: formatRows(data[0][activeTab])
            })

            // 2. Monthly Sheets
            const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']

            for (let m = 1; m <= 12; m++) {
                sheets.push({
                    name: monthNames[m - 1],
                    data: formatRows(data[m][activeTab])
                })
            }

            exportToExcel(sheets, `Presupuesto_Completo_${year}_${activeTab}`)
            toast.success('Exportación completa')
        } catch (error) {
            console.error(error)
            toast.error('Error al exportar')
        } finally {
            setIsExporting(false)
        }
    }

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>Detalle de Presupuesto</CardTitle>
                    <CardDescription>Gestión de presupuestos por categoría</CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={handleExport} disabled={isExporting}>
                    {isExporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                    Exportar Excel
                </Button>
            </CardHeader>
            <CardContent>
                <BudgetSummary overview={overview} />

                <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'ARS' | 'USD')} className="w-full">
                    <TabsList className="grid w-full grid-cols-2 mb-4">
                        <TabsTrigger value="ARS">Pesos (ARS)</TabsTrigger>
                        <TabsTrigger value="USD">Dólares (USD)</TabsTrigger>
                    </TabsList>

                    <TabsContent value="ARS">
                        <BudgetTable rows={overview.ARS} month={month} year={year} currency="ARS" userRole={userRole} />
                    </TabsContent>

                    <TabsContent value="USD">
                        <BudgetTable rows={overview.USD} month={month} year={year} currency="USD" userRole={userRole} />
                    </TabsContent>
                </Tabs>
            </CardContent>
        </Card>
    )
}

function BudgetTable({ rows, month, year, currency, userRole }: { rows: any[], month: number, year: number, currency: string, userRole: string }) {
    const [isEditing, setIsEditing] = useState(false)
    const [draftValues, setDraftValues] = useState<Record<string, number>>({})
    const [isSaving, startTransition] = useTransition()
    const [showAll, setShowAll] = useState(true)

    const canEdit = ['ADMIN', 'TREASURER'].includes(userRole)

    const filteredRows = rows.filter(row => {
        if (showAll) return true
        return row.budgetAmount > 0 || row.spentAmount > 0
    })

    if (rows.length === 0) {
        return (
            <div className="text-center py-8 text-zinc-500">
                No hay categorías disponibles para {currency}.
            </div>
        )
    }

    // Initialize draft on edit
    const handleEdit = () => {
        const initialDraft: Record<string, number> = {}
        rows.forEach(r => {
            if (!r.hasChildren) {
                initialDraft[r.categoryId] = r.budgetAmount
            }
        })
        setDraftValues(initialDraft)
        setIsEditing(true)
    }

    const handleCancel = () => {
        setIsEditing(false)
        setDraftValues({})
    }

    const handleSave = () => {
        startTransition(async () => {
            // Prepare updates
            const updates = Object.entries(draftValues).map(([categoryId, amount]) => ({
                categoryId,
                amount,
                currency: currency as any
            }))

            const result = await updateBatchBudgets(updates, month, year)
            if (result.error) {
                toast.error(result.error)
            } else {
                toast.success('Cambios guardados')
                setIsEditing(false)
            }
        })
    }

    const handleInputChange = (categoryId: string, value: string) => {
        const num = parseFloat(value)
        if (!isNaN(num)) {
            setDraftValues(prev => ({ ...prev, [categoryId]: num }))
        }
    }

    // Calculate totals based on FILTERED rows or ALL rows? 
    // Usually totals should reflect what is visible? Or the real total?
    // "Real total" is safer financially. 
    // "Visible total" is less confusing if filtering.
    // Let's use ALL rows for grand totals so user knows there are hidden costs.
    const totalBudget = rows.reduce((acc, row) => acc + row.budgetAmount, 0)
    const totalSpent = rows.reduce((acc, row) => acc + row.spentAmount, 0)
    const totalRemaining = totalBudget - totalSpent

    return (
        <div className="space-y-4">
            {/* Action Bar */}
            <div className="flex justify-between items-center bg-zinc-50 dark:bg-zinc-900/50 p-2 rounded-lg border border-zinc-100 dark:border-zinc-800">
                <div className="text-sm font-medium text-zinc-500">
                    {isEditing ? 'Modificando presupuesto...' : 'Vista de lectura'}
                </div>
                <div className="flex gap-2">
                    <div className="flex items-center space-x-2 mr-4">
                        <Switch id="show-empty" checked={showAll} onCheckedChange={setShowAll} />
                        <Label htmlFor="show-empty">Mostrar vacíos</Label>
                    </div>

                    {isEditing ? (
                        <>
                            <Button
                                size="sm"
                                variant="ghost"
                                onClick={handleCancel}
                                disabled={isSaving}
                            >
                                Cancelar
                            </Button>
                            <Button
                                size="sm"
                                onClick={handleSave}
                                disabled={isSaving}
                                className="bg-green-600 hover:bg-green-700 text-white"
                            >
                                {isSaving ? (
                                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                ) : (
                                    <Check className="h-4 w-4 mr-2" />
                                )}
                                Guardar Cambios
                            </Button>
                        </>
                    ) : (
                        month !== 0 && canEdit && (
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={handleEdit}
                            >
                                <Pencil className="h-4 w-4 mr-2" />
                                Modificar
                            </Button>
                        )
                    )}
                </div>
            </div>

            {/* Header */}
            <div className="grid grid-cols-12 gap-4 px-4 py-2 bg-zinc-100 dark:bg-zinc-800 rounded-lg text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                <div className="col-span-4">Categoría</div>
                <div className="col-span-3 text-right">Presupuesto</div>
                <div className="col-span-2 text-right">Gastado</div>
                <div className="col-span-3">Progreso</div>
            </div>

            {/* Rows */}
            <div className="space-y-1">
                {filteredRows.map((row) => (
                    <BudgetRow
                        key={row.categoryId}
                        row={row}
                        month={month}
                        year={year}
                        isEditing={isEditing}
                        inputValue={draftValues[row.categoryId]?.toString() ?? ''}
                        onInputChange={(val) => handleInputChange(row.categoryId, val)}
                    />
                ))}
            </div>

            {/* Footer / Total */}
            <div className="grid grid-cols-12 gap-4 px-4 py-4 border-t-2 border-zinc-100 dark:border-zinc-800 mt-4 bg-zinc-50/50 dark:bg-zinc-900/50 rounded-b-lg">
                <div className="col-span-4 font-bold text-zinc-900 dark:text-zinc-50 text-base">
                    TOTAL
                </div>
                <div className="col-span-3 text-right font-bold text-zinc-900 dark:text-zinc-50 text-base">
                    {new Intl.NumberFormat('es-AR', { style: 'currency', currency }).format(totalBudget)}
                </div>
                <div className="col-span-2 text-right font-bold text-zinc-900 dark:text-zinc-50 text-base">
                    {new Intl.NumberFormat('es-AR', { minimumFractionDigits: 2 }).format(totalSpent)}
                </div>
                <div className="col-span-3 font-medium text-right text-base">
                    <span className={totalRemaining < 0 ? "text-red-500" : "text-green-600"}>
                        {new Intl.NumberFormat('es-AR', { style: 'currency', currency }).format(totalRemaining)}
                    </span>
                </div>
            </div>
        </div>
    )
}

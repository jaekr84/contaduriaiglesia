'use client'

import { useState, useTransition, useRef, useMemo } from 'react'
import { createCategoryWithBudget } from '@/app/dashboard/finance/budget-actions'
import { Loader2, Plus, Check, ChevronsUpDown, Copy } from 'lucide-react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from '@/components/ui/button'
import { MoneyInput } from '../../../components/MoneyInput'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

interface CategoryOption {
    id: string
    name: string
    parentId: string | null
}

interface Props {
    allCategories: CategoryOption[]
    targetYear: number
    onSuccess?: () => void
}

const MONTHS = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
]

export function AddCategoryCard({ allCategories, targetYear, onSuccess }: Props) {
    const [name, setName] = useState('')
    const [selectedSubId, setSelectedSubId] = useState<string | null>(null)
    const [subOpen, setSubOpen] = useState(false)

    const [parentId, setParentId] = useState<string>('none')

    // Monthly budgets (12 values as strings) - empty by default for easier input
    const [monthlyBudgets, setMonthlyBudgets] = useState<string[]>(Array(12).fill(''))

    // Quick Create Dialog States
    const [createMainOpen, setCreateMainOpen] = useState(false)
    const [createSubOpen, setCreateSubOpen] = useState(false)
    const [newCategoryName, setNewCategoryName] = useState('')

    const currency = 'ARS'

    const [isPending, startTransition] = useTransition()
    const router = useRouter()

    // Derived Options
    const parentOptions = useMemo(() =>
        allCategories.filter(c => !c.parentId).sort((a, b) => a.name.localeCompare(b.name)),
        [allCategories])

    const subOptions = useMemo(() => {
        if (!parentId || parentId === 'none') return []
        return allCategories
            .filter(c => c.parentId === parentId)
            .sort((a, b) => a.name.localeCompare(b.name))
    }, [allCategories, parentId])

    // Calculate annual total
    const annualTotal = useMemo(() => {
        return monthlyBudgets.reduce((sum, val) => sum + (parseFloat(val) || 0), 0)
    }, [monthlyBudgets])

    const handleMonthChange = (monthIndex: number, value: string) => {
        const newBudgets = [...monthlyBudgets]
        newBudgets[monthIndex] = value
        setMonthlyBudgets(newBudgets)
    }

    const handleRepeatToAll = () => {
        // Take the first month's value and repeat it to all months
        const firstValue = monthlyBudgets[0]
        setMonthlyBudgets(Array(12).fill(firstValue))
        toast.success('Valor replicado a todos los meses')
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()

        const finalName = name.trim()

        if (!finalName) {
            toast.error('Ingrese o seleccione un nombre de subcategoría')
            return
        }

        const normalizedParentId = parentId === 'none' ? null : parentId

        // Convert monthly budgets to numbers
        const monthlyAmounts = monthlyBudgets.map(val => parseFloat(val) || 0)

        startTransition(async () => {
            const result = await createCategoryWithBudget(
                finalName,
                normalizedParentId,
                monthlyAmounts,
                targetYear,
                currency
            )

            if (result?.error) {
                toast.error(result.error)
            } else {
                toast.success('Partida guardada exitosamente')
                setName('')
                setSelectedSubId(null)
                setMonthlyBudgets(Array(12).fill(''))
                router.refresh()
                onSuccess?.() // Disable editing mode
            }
        })
    }

    const handleQuickCreate = async (type: 'MAIN' | 'SUB') => {
        if (!newCategoryName.trim()) return

        const parent = type === 'MAIN' ? null : parentId
        if (type === 'SUB' && (!parent || parent === 'none')) {
            toast.error('Debe seleccionar una categoría padre primero')
            return
        }

        startTransition(async () => {
            const result = await createCategoryWithBudget(
                newCategoryName,
                parent === 'none' ? null : parent,
                Array(12).fill(0), // No budget initially
                targetYear,
                currency
            )

            if (result?.error) {
                toast.error(result.error)
            } else {
                toast.success(`${type === 'MAIN' ? 'Categoría' : 'Subcategoría'} creada`)
                setNewCategoryName('')
                if (type === 'MAIN') {
                    setCreateMainOpen(false)
                    if (result.category) {
                        setParentId(result.category.id)
                    }
                } else {
                    setCreateSubOpen(false)
                    if (result.category) {
                        setName(result.category.name)
                        setSelectedSubId(result.category.id)
                    }
                }
                router.refresh()
            }
        })
    }

    return (
        <>
            <div className="rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950 shadow-sm mb-4 p-4">
                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Category Selection Row - 3 Equal Columns */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        {/* Parent Selector + Plus Button */}
                        <div className="flex gap-1">
                            <Select value={parentId} onValueChange={(val) => { setParentId(val); setName(''); setSelectedSubId(null); }}>
                                <SelectTrigger className="h-9 flex-1 bg-zinc-50 dark:bg-zinc-900 border-0 ring-1 ring-zinc-200 dark:ring-zinc-800">
                                    <SelectValue placeholder="Categoría Padre..." />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">-- Seleccionar --</SelectItem>
                                    {parentOptions.map(cat => (
                                        <SelectItem key={cat.id} value={cat.id}>
                                            {cat.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <Button
                                type="button"
                                size="icon"
                                variant="outline"
                                className="h-9 w-9 shrink-0"
                                onClick={() => setCreateMainOpen(true)}
                                title="Crear nueva categoría principal"
                            >
                                <Plus className="h-4 w-4" />
                            </Button>
                        </div>

                        {/* Subcategory Combobox + Plus Button */}
                        <div className="flex gap-1">
                            <Popover open={subOpen} onOpenChange={setSubOpen}>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        role="combobox"
                                        aria-expanded={subOpen}
                                        className="flex-1 justify-between h-9 bg-zinc-50 dark:bg-zinc-900 border-0 ring-1 ring-zinc-200 dark:ring-zinc-800 font-normal text-zinc-900 dark:text-zinc-100"
                                        disabled={!parentId || parentId === 'none'}
                                    >
                                        {name || "Seleccionar subcategoría..."}
                                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-[300px] p-0" align="start">
                                    <Command>
                                        <CommandInput
                                            placeholder="Buscar subcategoría..."
                                            value={name}
                                            onValueChange={setName}
                                        />
                                        <CommandList>
                                            <CommandEmpty>No existe.</CommandEmpty>
                                            <CommandGroup>
                                                {subOptions.map((sub) => (
                                                    <CommandItem
                                                        key={sub.id}
                                                        value={sub.name}
                                                        onSelect={(currentValue) => {
                                                            setName(sub.name)
                                                            setSelectedSubId(sub.id)
                                                            setSubOpen(false)
                                                        }}
                                                    >
                                                        <Check
                                                            className={cn(
                                                                "mr-2 h-4 w-4",
                                                                selectedSubId === sub.id ? "opacity-100" : "opacity-0"
                                                            )}
                                                        />
                                                        {sub.name}
                                                    </CommandItem>
                                                ))}
                                            </CommandGroup>
                                        </CommandList>
                                    </Command>
                                </PopoverContent>
                            </Popover>
                            <Button
                                type="button"
                                size="icon"
                                variant="outline"
                                className="h-9 w-9 shrink-0"
                                onClick={() => setCreateSubOpen(true)}
                                disabled={!parentId || parentId === 'none'}
                                title="Crear nueva subcategoría"
                            >
                                <Plus className="h-4 w-4" />
                            </Button>
                        </div>

                        {/* Submit Button */}
                        <Button
                            type="submit"
                            disabled={isPending}
                            className="h-9 bg-zinc-900 text-zinc-50 hover:bg-zinc-900/90 dark:bg-zinc-50 dark:text-zinc-900"
                        >
                            {isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
                            Agregar Partida
                        </Button>
                    </div>

                    {/* Monthly Budget Inputs */}
                    <div className="space-y-2">
                        <Label className="text-sm font-medium">Presupuesto Mensual</Label>

                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
                            {MONTHS.map((month, index) => (
                                <div key={index} className="space-y-1">
                                    <Label className="text-xs text-zinc-500">{month}</Label>
                                    <div className="flex gap-1">
                                        <MoneyInput
                                            value={monthlyBudgets[index]}
                                            onChange={(val) => handleMonthChange(index, val)}
                                            placeholder="0"
                                            className="h-8 text-sm bg-zinc-50 dark:bg-zinc-900 border-0 ring-1 ring-zinc-200 dark:ring-zinc-800"
                                        />
                                        {index === 0 && (
                                            <Button
                                                type="button"
                                                size="icon"
                                                variant="outline"
                                                onClick={handleRepeatToAll}
                                                className="h-8 w-8 shrink-0"
                                                title="Repetir a todos los meses"
                                            >
                                                <Copy className="h-3 w-3" />
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Annual Total Display */}
                        <div className="flex items-center justify-between pt-2 border-t border-zinc-200 dark:border-zinc-800">
                            <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Total Anual:</span>
                            <span className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                                {new Intl.NumberFormat('es-AR', {
                                    style: 'currency',
                                    currency: 'ARS',
                                    minimumFractionDigits: 0,
                                    maximumFractionDigits: 0
                                }).format(annualTotal)}
                            </span>
                        </div>
                    </div>
                </form>
            </div>

            {/* Create Main Category Dialog */}
            <Dialog open={createMainOpen} onOpenChange={setCreateMainOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Nueva Categoría Principal</DialogTitle>
                        <DialogDescription>
                            Crear una nueva categoría para agrupar gastos.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        <Label>Nombre</Label>
                        <Input
                            value={newCategoryName}
                            onChange={(e) => setNewCategoryName(e.target.value)}
                            placeholder="Ej: Mantenimiento, Librería..."
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setCreateMainOpen(false)}>Cancelar</Button>
                        <Button onClick={() => handleQuickCreate('MAIN')} disabled={isPending}>
                            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Crear
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Create Sub Category Dialog */}
            <Dialog open={createSubOpen} onOpenChange={setCreateSubOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Nueva Subcategoría</DialogTitle>
                        <DialogDescription>
                            Crear una nueva subcategoría dentro de la categoría seleccionada.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        <Label>Nombre</Label>
                        <Input
                            value={newCategoryName}
                            onChange={(e) => setNewCategoryName(e.target.value)}
                            placeholder="Ej: Reparaciones, Limpieza..."
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setCreateSubOpen(false)}>Cancelar</Button>
                        <Button onClick={() => handleQuickCreate('SUB')} disabled={isPending}>
                            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Crear
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    )
}

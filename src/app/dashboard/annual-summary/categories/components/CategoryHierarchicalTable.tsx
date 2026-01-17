'use client'

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CategoryBreakdownItem } from "../../actions"
import { FolderIcon, FolderOpenIcon, ChevronDown, ChevronRight } from "lucide-react" // Ensure lucide-react is installed or use alternatives
import { useState } from "react"
import { cn } from "@/lib/utils"

interface CategoryHierarchicalTableProps {
    data: CategoryBreakdownItem[]
}

export function CategoryHierarchicalTable({ data }: CategoryHierarchicalTableProps) {
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('es-AR', {
            style: 'currency',
            currency: 'ARS',
            maximumFractionDigits: 0
        }).format(amount)
    }

    // State to track expanded category IDs
    const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())

    const toggleExpand = (id: string) => {
        const newExpanded = new Set(expandedIds)
        if (newExpanded.has(id)) {
            newExpanded.delete(id)
        } else {
            newExpanded.add(id)
        }
        setExpandedIds(newExpanded)
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Detalle de Gastos por Categoría</CardTitle>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[500px]">Categoría</TableHead>
                            <TableHead className="text-right">Total</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {data.map((group) => {
                            const isExpanded = expandedIds.has(group.id)
                            const hasSubcategories = group.subcategories.length > 1 || (group.subcategories.length === 1 && group.subcategories[0].id !== group.id)

                            return (
                                <>
                                    <TableRow
                                        key={group.id}
                                        className={cn("cursor-pointer hover:bg-muted/50", hasSubcategories && "font-medium")}
                                        onClick={() => hasSubcategories && toggleExpand(group.id)}
                                    >
                                        <TableCell className="flex items-center gap-2">
                                            {hasSubcategories ? (
                                                isExpanded ? <ChevronDown className="h-4 w-4 text-muted-foreground mr-1" /> : <ChevronRight className="h-4 w-4 text-muted-foreground mr-1" />
                                            ) : <span className="w-5 mr-1"></span>}
                                            {group.name}
                                        </TableCell>
                                        <TableCell className="text-right font-bold">{formatCurrency(group.total)}</TableCell>
                                    </TableRow>

                                    {isExpanded && group.subcategories.map(sub => (
                                        <TableRow key={sub.id} className="bg-muted/20 border-0">
                                            <TableCell className="pl-10 text-sm text-muted-foreground">
                                                {sub.name}
                                            </TableCell>
                                            <TableCell className="text-right text-sm text-muted-foreground">
                                                {formatCurrency(sub.total)}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </>
                            )
                        })}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    )
}

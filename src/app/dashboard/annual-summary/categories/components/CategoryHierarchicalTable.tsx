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
import { useState, Fragment } from "react"
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
    const [expandedIds, setExpandedIds] = useState<Set<string>>(() => {
        return new Set(data.map(item => item.id))
    })

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
        <Card className="border shadow-sm">
            <CardContent className="p-0">
                <Table>
                    <TableHeader>
                        <TableRow className="hover:bg-transparent">
                            <TableHead className="uppercase text-xs font-bold text-muted-foreground tracking-wider h-12 pl-6">Categoría</TableHead>
                            <TableHead className="uppercase text-xs font-bold text-muted-foreground tracking-wider h-12 text-right w-[200px] pr-6">Total</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {data.map((group, index) => {
                            const isExpanded = expandedIds.has(group.id)
                            const hasSubcategories = group.subcategories.length > 1 || (group.subcategories.length === 1 && group.subcategories[0].id !== group.id)

                            return (
                                <Fragment key={group.id}>
                                    <TableRow
                                        key={group.id}
                                        className={cn(
                                            "cursor-pointer hover:bg-sky-100 transition-colors border-b-0",
                                            index % 2 === 0 ? "bg-white" : "bg-sky-50"
                                        )}
                                        onClick={() => hasSubcategories && toggleExpand(group.id)}
                                    >
                                        <TableCell className="pl-6 py-4">
                                            <div className="flex items-center gap-2">
                                                {hasSubcategories ? (
                                                    isExpanded ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                                ) : <span className="w-4"></span>}
                                                <span className="font-bold text-sm tracking-tight">{group.name}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right py-4 font-bold tabular-nums text-sm pr-6">
                                            {formatCurrency(group.total)}
                                        </TableCell>
                                    </TableRow>

                                    {isExpanded && hasSubcategories && group.subcategories.map(sub => (
                                        <TableRow key={sub.id} className="bg-sky-50/50 border-b-0 hover:bg-sky-100/50">
                                            <TableCell className="pl-14 py-2">
                                                <span className="text-sm text-muted-foreground">{sub.name}</span>
                                            </TableCell>
                                            <TableCell className="text-right py-2 text-sm text-muted-foreground tabular-nums pr-6">
                                                {formatCurrency(sub.total)}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </Fragment>
                            )
                        })}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    )
}

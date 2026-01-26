'use client'

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Card, CardContent } from "@/components/ui/card"
import { CategoryBreakdownItem } from "../../actions"
import { useMemo, Fragment } from "react"
import { cn } from "@/lib/utils"
import { formatDate } from "@/lib/dateUtils"

interface CategoryHierarchicalTableProps {
    data: CategoryBreakdownItem[]
}

interface GroupedCategory {
    id: string
    name: string
    total: number
    transactions: {
        id: string
        date: Date
        subcategory: string
        description: string
        amount: number
    }[]
}

export function CategoryHierarchicalTable({ data }: CategoryHierarchicalTableProps) {
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('es-AR', {
            style: 'currency',
            currency: 'ARS',
            maximumFractionDigits: 0
        }).format(amount)
    }

    const groupedData = useMemo(() => {
        const groups: GroupedCategory[] = []

        data.forEach(group => {
            const groupTransactions: GroupedCategory['transactions'] = []

            group.subcategories.forEach(sub => {
                if (sub.transactions && sub.transactions.length > 0) {
                    sub.transactions.forEach(tx => {
                        groupTransactions.push({
                            id: tx.id,
                            date: tx.date,
                            subcategory: sub.name,
                            description: tx.description,
                            amount: tx.amount
                        })
                    })
                }
            })

            if (groupTransactions.length > 0) {
                // Sort transactions by date descending
                groupTransactions.sort((a, b) => b.date.getTime() - a.date.getTime())

                groups.push({
                    id: group.id,
                    name: group.name,
                    total: group.total,
                    transactions: groupTransactions
                })
            }
        })

        // Sort groups by total amount descending
        return groups.sort((a, b) => b.total - a.total)
    }, [data])

    if (groupedData.length === 0) {
        return (
            <Card className="border shadow-sm">
                <CardContent className="p-8 text-center text-muted-foreground">
                    No hay movimientos para mostrar.
                </CardContent>
            </Card>
        )
    }

    return (
        <Card className="border shadow-sm">
            <CardContent className="p-0">
                <Table>
                    <TableHeader>
                        <TableRow className="hover:bg-transparent bg-muted/50 border-b-2 border-gray-200">
                            <TableHead className="uppercase text-xs font-bold text-muted-foreground tracking-wider h-10 w-[120px]">Fecha</TableHead>
                            <TableHead className="uppercase text-xs font-bold text-muted-foreground tracking-wider h-10 w-[200px]">Subcategoría</TableHead>
                            <TableHead className="uppercase text-xs font-bold text-muted-foreground tracking-wider h-10">Detalle</TableHead>
                            <TableHead className="uppercase text-xs font-bold text-muted-foreground tracking-wider h-10 text-right w-[150px] pr-6">Monto</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {groupedData.map((group) => (
                            <Fragment key={group.id}>
                                {/* Group Header */}
                                <TableRow className="bg-sky-100 hover:bg-sky-200/80 border-b border-sky-200">
                                    <TableCell colSpan={3} className="py-2 text-sm font-bold text-sky-900 pl-4">
                                        {group.name}
                                    </TableCell>
                                    <TableCell className="text-right py-2 text-sm font-bold text-sky-900 tabular-nums pr-6">
                                        {formatCurrency(group.total)}
                                    </TableCell>
                                </TableRow>

                                {/* Transactions */}
                                {group.transactions.map((tx, index) => (
                                    <TableRow
                                        key={tx.id}
                                        className={cn(
                                            "border-b border-gray-100 hover:bg-muted/50 transition-colors h-10",
                                            index % 2 !== 0 ? "bg-gray-50/30" : "bg-white"
                                        )}
                                    >
                                        <TableCell className="py-2 text-xs font-medium tabular-nums text-muted-foreground">
                                            {formatDate(tx.date)}
                                        </TableCell>
                                        <TableCell className="py-2 text-xs text-muted-foreground">
                                            {tx.subcategory}
                                        </TableCell>
                                        <TableCell className="py-2 text-xs text-muted-foreground truncate max-w-[300px]" title={tx.description}>
                                            {tx.description}
                                        </TableCell>
                                        <TableCell className="text-right py-2 text-xs font-medium tabular-nums pr-6">
                                            {formatCurrency(tx.amount)}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </Fragment>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    )
}

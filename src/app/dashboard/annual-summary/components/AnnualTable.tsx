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
import { MonthlySummary } from "../actions"

interface AnnualTableProps {
    monthlyDataARS: MonthlySummary[]
    monthlyDataUSD: MonthlySummary[]
}

export function AnnualTable({ monthlyDataARS, monthlyDataUSD }: AnnualTableProps) {
    const months = [
        'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];

    const formatARS = (amount: number) => {
        return new Intl.NumberFormat('es-AR', {
            style: 'currency',
            currency: 'ARS',
            maximumFractionDigits: 0
        }).format(amount)
    }

    const formatUSD = (amount: number) => {
        return new Intl.NumberFormat('es-AR', {
            style: 'currency',
            currency: 'USD',
            maximumFractionDigits: 0
        }).format(amount)
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Detalle Mensual</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[100px]">Mes</TableHead>
                                <TableHead className="text-center bg-muted/50" colSpan={4}>Pesos (ARS)</TableHead>
                                <TableHead className="text-center bg-muted/30" colSpan={4}>Dólares (USD)</TableHead>
                            </TableRow>
                            <TableRow>
                                <TableHead></TableHead>
                                {/* ARS Columns */}
                                <TableHead className="text-right bg-muted/50">Ingresos</TableHead>
                                <TableHead className="text-right bg-muted/50">Gastos</TableHead>
                                <TableHead className="text-right bg-muted/50">Balance</TableHead>
                                <TableHead className="text-right bg-muted/50">%</TableHead>
                                {/* USD Columns */}
                                <TableHead className="text-right bg-muted/30">Ingresos</TableHead>
                                <TableHead className="text-right bg-muted/30">Gastos</TableHead>
                                <TableHead className="text-right bg-muted/30">Balance</TableHead>
                                <TableHead className="text-right bg-muted/30">%</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {monthlyDataARS.map((dataARS, index) => {
                                const dataUSD = monthlyDataUSD[index];
                                const savingsRateARS = dataARS.income > 0 ? ((dataARS.balance) / dataARS.income) * 100 : 0
                                const savingsRateUSD = dataUSD.income > 0 ? ((dataUSD.balance) / dataUSD.income) * 100 : 0

                                return (
                                    <TableRow key={dataARS.month}>
                                        <TableCell className="font-medium">{months[dataARS.month]}</TableCell>

                                        {/* ARS Data */}
                                        <TableCell className="text-right text-emerald-600 bg-muted/50">{formatARS(dataARS.income)}</TableCell>
                                        <TableCell className="text-right text-red-600 bg-muted/50">{formatARS(dataARS.expense)}</TableCell>
                                        <TableCell className={`text-right font-bold bg-muted/50 ${dataARS.balance >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
                                            {formatARS(dataARS.balance)}
                                        </TableCell>
                                        <TableCell className="text-right bg-muted/50">{savingsRateARS.toFixed(1)}%</TableCell>

                                        {/* USD Data */}
                                        <TableCell className="text-right text-emerald-600 bg-muted/30">{formatUSD(dataUSD.income)}</TableCell>
                                        <TableCell className="text-right text-red-600 bg-muted/30">{formatUSD(dataUSD.expense)}</TableCell>
                                        <TableCell className={`text-right font-bold bg-muted/30 ${dataUSD.balance >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
                                            {formatUSD(dataUSD.balance)}
                                        </TableCell>
                                        <TableCell className="text-right bg-muted/30">{savingsRateUSD.toFixed(1)}%</TableCell>
                                    </TableRow>
                                )
                            })}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
    )
}

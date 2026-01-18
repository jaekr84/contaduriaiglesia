'use client'

import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement,
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MonthlySummary, CategorySummary } from "../actions";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import Link from 'next/link'
import { Button } from "@/components/ui/button"

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement
);

interface SummaryChartsProps {
    monthlyData: MonthlySummary[];
    categoryData: CategorySummary[];
    incomeCategoryData: CategorySummary[];
    year: number;
    currency?: 'ARS' | 'USD';
    title?: string;
}

export function SummaryCharts({ monthlyData, categoryData, incomeCategoryData, year, currency = 'ARS', title }: SummaryChartsProps) {
    const months = [
        'En', 'Fe', 'Ma', 'Ab', 'Ma', 'Ju', 'Ju', 'Ag', 'Se', 'Oc', 'No', 'Di'
    ];

    const barData = {
        labels: months,
        datasets: [
            {
                label: 'Ingresos',
                data: monthlyData.map(d => d.income),
                backgroundColor: '#10b981', // emerald-500
                borderRadius: 4,
            },
            {
                label: 'Gastos',
                data: monthlyData.map(d => d.expense),
                backgroundColor: '#ef4444', // red-500
                borderRadius: 4,
            },
        ],
    };



    const barOptions = {
        responsive: true,
        plugins: {
            legend: {
                position: 'top' as const,
            },
        },
        scales: {
            y: {
                beginAtZero: true,
                ticks: {
                    callback: (value: any) => new Intl.NumberFormat('es-AR', { notation: "compact", compactDisplay: "short", style: 'currency', currency: currency }).format(value)
                }
            }
        }
    };

    // Calculate totals for Doughnut
    const totalIncome = monthlyData.reduce((acc, curr) => acc + curr.income, 0);
    const totalExpense = monthlyData.reduce((acc, curr) => acc + curr.expense, 0);

    const doughnutData = {
        labels: ['Ingresos', 'Gastos'],
        datasets: [
            {
                data: [totalIncome, totalExpense],
                backgroundColor: [
                    '#10b981', // emerald-500
                    '#ef4444', // red-500
                ],
                borderWidth: 1,
            },
        ],
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('es-AR', {
            style: 'currency',
            currency: currency,
            maximumFractionDigits: 0
        }).format(amount)
    }

    return (
        <div className="space-y-4">
            {title && <h3 className="text-xl font-semibold tracking-tight">{title}</h3>}
            <div className="grid gap-4 md:grid-cols-3">
                <Card className="md:col-span-2">
                    <CardHeader>
                        <CardTitle>Flujo de Caja Anual</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Bar options={barOptions} data={barData} />
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>Ingresos vs Gastos</CardTitle>
                    </CardHeader>
                    <CardContent className="flex justify-center items-center h-[300px]">
                        <div className="relative w-full max-w-[250px]">
                            <Doughnut data={doughnutData} />
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
                <Card className="flex flex-col">
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <CardTitle>Ingresos por Categoría</CardTitle>
                            <Link href={`/dashboard/annual-summary/categories?year=${year}&type=INCOME&currency=${currency}`}>
                                <Button variant="ghost" size="sm" className="h-8 text-xs">
                                    Ver detalle
                                </Button>
                            </Link>
                        </div>
                    </CardHeader>
                    <CardContent className="flex-1 min-h-0">
                        <div className="max-h-[400px] overflow-auto pr-2">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Categoría</TableHead>
                                        <TableHead className="text-right">Monto</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {incomeCategoryData.length > 0 ? (
                                        incomeCategoryData.map((category) => (
                                            <TableRow key={category.id}>
                                                <TableCell>{category.name}</TableCell>
                                                <TableCell className="text-right">{formatCurrency(category.amount)}</TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={2} className="text-center text-muted-foreground">
                                                No hay datos de ingresos
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>

                <Card className="flex flex-col">
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <CardTitle>Gastos por Categoría</CardTitle>
                            <Link href={`/dashboard/annual-summary/categories?year=${year}&type=EXPENSE&currency=${currency}`}>
                                <Button variant="ghost" size="sm" className="h-8 text-xs">
                                    Ver detalle
                                </Button>
                            </Link>
                        </div>
                    </CardHeader>
                    <CardContent className="flex-1 min-h-0">
                        <div className="max-h-[400px] overflow-auto pr-2">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Categoría</TableHead>
                                        <TableHead className="text-right">Monto</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {categoryData.length > 0 ? (
                                        categoryData.map((category) => (
                                            <TableRow key={category.id}>
                                                <TableCell>{category.name}</TableCell>
                                                <TableCell className="text-right">{formatCurrency(category.amount)}</TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={2} className="text-center text-muted-foreground">
                                                No hay datos de gastos
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

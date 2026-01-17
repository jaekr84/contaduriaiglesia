'use client'

import { useState, useEffect, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card' // Keeping Card for wrapping the table if needed, or just remove
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { pdf } from '@react-pdf/renderer'
import { AnnualReportPDF } from '@/components/reports/AnnualReportPDF'
import { AnnualSummaryData, getAnnualSummary } from '@/app/dashboard/annual-summary/actions'
import { FileDown, Loader2, FileText } from 'lucide-react'
import { formatCurrency } from '@/lib/dateUtils'

// Helper component for the download button to isolate PDF generation
const DownloadReportButton = ({ data, year, title, fileName }: { data: AnnualSummaryData, year: number, title: string, fileName: string }) => {
    const [loading, setLoading] = useState(false)

    const handleDownload = async () => {
        setLoading(true)
        try {
            const blob = await pdf(<AnnualReportPDF data={data} year={year} title={title} />).toBlob()
            const url = URL.createObjectURL(blob)
            const link = document.createElement('a')
            link.href = url
            link.download = fileName
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
            URL.revokeObjectURL(url)
        } catch (error) {
            console.error('Error generating PDF:', error)
        } finally {
            setLoading(false)
        }
    }

    return (
        <Button
            variant="ghost"
            size="sm"
            className="gap-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50"
            onClick={handleDownload}
            disabled={loading}
        >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileDown className="h-4 w-4" />}
            {loading ? 'Generando...' : 'Descargar'}
        </Button>
    )
}

import { generateExcelReport } from '@/components/reports/excelGenerator'
import * as XLSX from 'xlsx'
import { FileSpreadsheet } from 'lucide-react'

const DownloadExcelButton = ({ data, year, title, fileName }: { data: AnnualSummaryData, year: number, title: string, fileName: string }) => {
    const handleDownload = () => {
        const wb = generateExcelReport(data, year, title)
        XLSX.writeFile(wb, fileName)
    }

    return (
        <Button
            variant="ghost"
            size="sm"
            className="gap-2 text-green-600 hover:text-green-800 hover:bg-green-50"
            onClick={handleDownload}
        >
            <FileSpreadsheet className="h-4 w-4" />
            Excel
        </Button>
    )
}

const months = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
]

export default function ReportsPage() {
    const [year, setYear] = useState<string>(new Date().getFullYear().toString())
    const [loading, setLoading] = useState(false)
    const [reportData, setReportData] = useState<AnnualSummaryData | null>(null)

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true)
            try {
                const data = await getAnnualSummary(parseInt(year))
                setReportData(data)
            } catch (error) {
                console.error("Error fetching report data", error)
            } finally {
                setLoading(false)
            }
        }
        fetchData()
    }, [year])

    const currentYear = new Date().getFullYear()
    const years = Array.from({ length: 5 }, (_, i) => (currentYear - i).toString())

    // Helper to construct "AnnualSummaryData" shape for a single month
    // We basically mock the "totals" with the monthly data and provide empty "monthly" array for the PDF to ignore or display simply
    const getMonthlyReportData = (monthIndex: number): AnnualSummaryData | null => {
        if (!reportData) return null;

        const monthlyArs = reportData.ars.monthly[monthIndex]
        const monthlyUsd = reportData.usd.monthly[monthIndex]

        if (!monthlyArs || !monthlyUsd) return null;

        return {
            year: reportData.year,
            ars: {
                totals: {
                    income: monthlyArs.income,
                    expense: monthlyArs.expense,
                    balance: monthlyArs.balance,
                    initialBalance: monthlyArs.initialBalance,
                    savingsRate: monthlyArs.income > 0 ? ((monthlyArs.income - monthlyArs.expense) / monthlyArs.income) * 100 : 0
                },
                monthly: [monthlyArs], // Pass single month if needed for charts, or empty. The PDF mainly uses totals and categories.
                expensesByCategory: monthlyArs.expensesByCategory,
                incomeByCategory: monthlyArs.incomeByCategory
            },
            usd: {
                totals: {
                    income: monthlyUsd.income,
                    expense: monthlyUsd.expense,
                    balance: monthlyUsd.balance,
                    initialBalance: monthlyUsd.initialBalance,
                    savingsRate: monthlyUsd.income > 0 ? ((monthlyUsd.income - monthlyUsd.expense) / monthlyUsd.income) * 100 : 0
                },
                monthly: [monthlyUsd],
                expensesByCategory: monthlyUsd.expensesByCategory,
                incomeByCategory: monthlyUsd.incomeByCategory
            },
            exchanges: reportData.exchanges?.filter(e => new Date(e.date).getMonth() === monthIndex) || []
        }
    }

    return (
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">Reportes y Descargas</h2>
                <div className="flex items-center space-x-2">
                    <Select value={year} onValueChange={setYear}>
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Seleccionar año" />
                        </SelectTrigger>
                        <SelectContent>
                            {years.map(y => (
                                <SelectItem key={y} value={y}>{y}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Reportes Mensuales y Anuales</CardTitle>
                    <CardDescription>
                        Descargue los reportes financieros detallados por mes o el resumen anual completo.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="flex justify-center py-8">
                            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[200px]">Periodo</TableHead>
                                    <TableHead>Ingresos (ARS)</TableHead>
                                    <TableHead>Gastos (ARS)</TableHead>
                                    <TableHead>Balance (ARS)</TableHead>
                                    <TableHead className="text-right">Acciones</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {reportData && months.map((monthName, index) => {
                                    const mData = reportData.ars.monthly[index]
                                    return (
                                        <TableRow key={index}>
                                            <TableCell className="font-medium">
                                                <div className="flex items-center gap-2">
                                                    <FileText className="h-4 w-4 text-muted-foreground" />
                                                    {monthName}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-green-600 dark:text-green-400">
                                                {formatCurrency(mData?.income || 0, 'ARS')}
                                            </TableCell>
                                            <TableCell className="text-red-600 dark:text-red-400">
                                                {formatCurrency(mData?.expense || 0, 'ARS')}
                                            </TableCell>
                                            <TableCell className="font-semibold">
                                                {formatCurrency(mData?.balance || 0, 'ARS')}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-2">
                                                    <DownloadReportButton
                                                        data={getMonthlyReportData(index)!}
                                                        year={parseInt(year)}
                                                        title={`Reporte Mensual - ${monthName} ${year}`}
                                                        fileName={`reporte_${monthName.toLowerCase()}_${year}.pdf`}
                                                    />
                                                    <DownloadExcelButton
                                                        data={getMonthlyReportData(index)!}
                                                        year={parseInt(year)}
                                                        title={`Reporte Mensual - ${monthName} ${year}`}
                                                        fileName={`reporte_${monthName.toLowerCase()}_${year}.xlsx`}
                                                    />
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    )
                                })}

                                {reportData && (
                                    <TableRow className="bg-muted/50 font-medium">
                                        <TableCell className="font-bold">Resumen Anual {year}</TableCell>
                                        <TableCell className="text-green-700 dark:text-green-300 font-bold">
                                            {formatCurrency(reportData.ars.totals.income, 'ARS')}
                                        </TableCell>
                                        <TableCell className="text-red-700 dark:text-red-300 font-bold">
                                            {formatCurrency(reportData.ars.totals.expense, 'ARS')}
                                        </TableCell>
                                        <TableCell className="font-bold">
                                            {formatCurrency(reportData.ars.totals.balance, 'ARS')}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <DownloadReportButton
                                                    data={reportData}
                                                    year={parseInt(year)}
                                                    title={`Resumen Financiero Anual ${year}`}
                                                    fileName={`reporte_anual_${year}.pdf`}
                                                />
                                                <DownloadExcelButton
                                                    data={reportData}
                                                    year={parseInt(year)}
                                                    title={`Resumen Financiero Anual ${year}`}
                                                    fileName={`reporte_anual_${year}.xlsx`}
                                                />
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}

import { Document, Page, Text, View, Font } from '@react-pdf/renderer'
import { styles } from './styles'
import { AnnualSummaryData } from '@/app/dashboard/annual-summary/actions'

// Register Noto Sans KR for Korean support
Font.register({
    family: 'Noto Sans KR',
    fonts: [
        {
            src: 'https://cdn.jsdelivr.net/npm/@fontsource/noto-sans-kr@5.0.1/files/noto-sans-kr-korean-400-normal.woff',
            fontWeight: 400,
        },
        {
            src: 'https://cdn.jsdelivr.net/npm/@fontsource/noto-sans-kr@5.0.1/files/noto-sans-kr-korean-700-normal.woff',
            fontWeight: 700,
        },
    ],
})

interface AnnualReportPDFProps {
    data: AnnualSummaryData
    year: number
    title?: string
}

const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat(currency === 'ARS' ? 'es-AR' : 'en-US', {
        style: 'currency',
        currency: currency,
    }).format(amount)
}

export function AnnualReportPDF({ data, year, title }: AnnualReportPDFProps) {
    const isMonthlyReport = data.ars.monthly.length === 1

    const months = [
        'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ]

    const renderCategoryTable = (categories: { name: string; amount: number; subcategories?: { name: string; amount: number }[] }[], currency: string) => (
        <View style={styles.table}>
            <View style={styles.tableHeaderRow}>
                <View style={[styles.tableColLarge, { backgroundColor: '#f3f4f6' }]}>
                    <Text style={styles.tableCellHeader}>Categoría</Text>
                </View>
                <View style={[styles.tableCol, { backgroundColor: '#f3f4f6' }]}>
                    <Text style={styles.tableCellHeader}>Monto</Text>
                </View>
            </View>
            {categories.map((cat, i) => (
                <View key={i} style={{ flexDirection: 'column' }} wrap={false}>
                    {/* Parent Row */}
                    <View style={styles.tableRow}>
                        <View style={styles.tableColLarge}>
                            <Text style={[styles.tableCell, { fontWeight: 'bold' }]}>{cat.name}</Text>
                        </View>
                        <View style={styles.tableCol}>
                            <Text style={[styles.tableCell, { fontWeight: 'bold' }]}>{formatCurrency(cat.amount, currency)}</Text>
                        </View>
                    </View>
                    {/* Subcategories */}
                    {cat.subcategories?.map((sub, j) => (
                        <View key={`${i}-${j}`} style={styles.tableRow}>
                            <View style={styles.tableColLarge}>
                                <Text style={[styles.tableCell, { paddingLeft: 15, color: '#555' }]}>• {sub.name}</Text>
                            </View>
                            <View style={styles.tableCol}>
                                <Text style={[styles.tableCell, { color: '#555' }]}>{formatCurrency(sub.amount, currency)}</Text>
                            </View>
                        </View>
                    ))}
                </View>
            ))}
        </View>
    )

    const renderTransactionTable = (transactions: any[], currency: string) => (
        <View style={styles.table}>
            <View style={styles.tableHeaderRow}>
                <View style={[styles.tableColSmall, { width: '15%' }]}>
                    <Text style={styles.tableCellHeader}>Fecha</Text>
                </View>
                <View style={[styles.tableColLarge, { width: '40%' }]}>
                    <Text style={styles.tableCellHeader}>Descripción</Text>
                </View>
                <View style={[styles.tableCol, { width: '25%' }]}>
                    <Text style={styles.tableCellHeader}>Categoría</Text>
                </View>
                <View style={[styles.tableColSmall, { width: '20%' }]}>
                    <Text style={styles.tableCellHeader}>Monto</Text>
                </View>
            </View>
            {transactions.map((tx, i) => (
                <View key={i} style={styles.tableRow}>
                    <View style={[styles.tableColSmall, { width: '15%' }]}>
                        <Text style={styles.tableCell}>{new Date(tx.date).toLocaleDateString()}</Text>
                    </View>
                    <View style={[styles.tableColLarge, { width: '40%' }]}>
                        <Text style={styles.tableCell}>{tx.description}</Text>
                    </View>
                    <View style={[styles.tableCol, { width: '25%' }]}>
                        <Text style={styles.tableCell}>{tx.categoryName}</Text>
                    </View>
                    <View style={[styles.tableColSmall, { width: '20%' }]}>
                        <Text style={[styles.tableCell, { color: tx.type === 'INCOME' ? '#10b981' : '#ef4444' }]}>
                            {formatCurrency(tx.amount, currency)}
                        </Text>
                    </View>
                </View>
            ))}
        </View>
    )

    const renderMonthlySummaryTable = () => (
        <View style={[styles.table, { marginTop: 20 }]}>
            <View style={styles.tableHeaderRow}>
                <View style={[styles.tableColSmall, { width: '16%', backgroundColor: '#f3f4f6' }]}>
                    <Text style={styles.tableCellHeader}>Mes</Text>
                </View>
                <View style={[styles.tableCol, { width: '14%', backgroundColor: '#f3f4f6' }]}>
                    <Text style={[styles.tableCellHeader, { fontSize: 8 }]}>Ing. (ARS)</Text>
                </View>
                <View style={[styles.tableCol, { width: '14%', backgroundColor: '#f3f4f6' }]}>
                    <Text style={[styles.tableCellHeader, { fontSize: 8 }]}>Gas. (ARS)</Text>
                </View>
                <View style={[styles.tableCol, { width: '14%', backgroundColor: '#f3f4f6' }]}>
                    <Text style={[styles.tableCellHeader, { fontSize: 8 }]}>Bal. (ARS)</Text>
                </View>
                <View style={[styles.tableCol, { width: '14%', backgroundColor: '#f3f4f6' }]}>
                    <Text style={[styles.tableCellHeader, { fontSize: 8 }]}>Ing. (USD)</Text>
                </View>
                <View style={[styles.tableCol, { width: '14%', backgroundColor: '#f3f4f6' }]}>
                    <Text style={[styles.tableCellHeader, { fontSize: 8 }]}>Gas. (USD)</Text>
                </View>
                <View style={[styles.tableCol, { width: '14%', backgroundColor: '#f3f4f6' }]}>
                    <Text style={[styles.tableCellHeader, { fontSize: 8 }]}>Bal. (USD)</Text>
                </View>
            </View>
            {data.ars.monthly.map((arsMonth, i) => {
                const usdMonth = data.usd.monthly[i]
                return (
                    <View key={i} style={styles.tableRow}>
                        <View style={[styles.tableColSmall, { width: '16%' }]}>
                            <Text style={styles.tableCell}>{months[i]}</Text>
                        </View>
                        <View style={[styles.tableCol, { width: '14%' }]}>
                            <Text style={[styles.tableCell, { fontSize: 8, color: '#10b981' }]}>{formatCurrency(arsMonth.income, 'ARS')}</Text>
                        </View>
                        <View style={[styles.tableCol, { width: '14%' }]}>
                            <Text style={[styles.tableCell, { fontSize: 8, color: '#ef4444' }]}>{formatCurrency(arsMonth.expense, 'ARS')}</Text>
                        </View>
                        <View style={[styles.tableCol, { width: '14%' }]}>
                            <Text style={[styles.tableCell, { fontSize: 8, fontWeight: 'bold' }]}>{formatCurrency(arsMonth.balance, 'ARS')}</Text>
                        </View>
                        <View style={[styles.tableCol, { width: '14%' }]}>
                            <Text style={[styles.tableCell, { fontSize: 8, color: '#10b981' }]}>{formatCurrency(usdMonth.income, 'USD')}</Text>
                        </View>
                        <View style={[styles.tableCol, { width: '14%' }]}>
                            <Text style={[styles.tableCell, { fontSize: 8, color: '#ef4444' }]}>{formatCurrency(usdMonth.expense, 'USD')}</Text>
                        </View>
                        <View style={[styles.tableCol, { width: '14%' }]}>
                            <Text style={[styles.tableCell, { fontSize: 8, fontWeight: 'bold' }]}>{formatCurrency(usdMonth.balance, 'USD')}</Text>
                        </View>
                    </View>
                )
            })}
        </View>
    )

    return (
        <Document>
            {/* Executive Summary (Only for Annual Reports) */}
            {!isMonthlyReport && (
                <Page size="A4" style={styles.page}>
                    <View style={styles.header}>
                        <Text style={styles.title}>Resumen Ejecutivo Anual {year}</Text>
                        <Text style={styles.subtitle}>Generado el {new Date().toLocaleDateString()}</Text>
                    </View>

                    {/* Resumen General / Totals */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Estado Financiero General</Text>

                        {/* ARS Totals */}
                        <Text style={[styles.subtitle, { marginTop: 10, marginBottom: 5, fontWeight: 'bold', color: '#112233' }]}>Totales Pesos (ARS)</Text>
                        <View style={styles.statsContainer}>
                            <View style={styles.statBox}>
                                <Text style={styles.statLabel}>Ingresos</Text>
                                <Text style={styles.statValuePositive}>{formatCurrency(data.ars.totals.income, 'ARS')}</Text>
                            </View>
                            <View style={styles.statBox}>
                                <Text style={styles.statLabel}>Gastos</Text>
                                <Text style={styles.statValueNegative}>{formatCurrency(data.ars.totals.expense, 'ARS')}</Text>
                            </View>
                            <View style={styles.statBox}>
                                <Text style={styles.statLabel}>Balance</Text>
                                <Text style={styles.statValue}>{formatCurrency(data.ars.totals.balance, 'ARS')}</Text>
                            </View>
                        </View>

                        {/* USD Totals */}
                        <Text style={[styles.subtitle, { marginTop: 10, marginBottom: 5, fontWeight: 'bold', color: '#112233' }]}>Totales Dólares (USD)</Text>
                        <View style={styles.statsContainer}>
                            <View style={styles.statBox}>
                                <Text style={styles.statLabel}>Ingresos</Text>
                                <Text style={styles.statValuePositive}>{formatCurrency(data.usd.totals.income, 'USD')}</Text>
                            </View>
                            <View style={styles.statBox}>
                                <Text style={styles.statLabel}>Gastos</Text>
                                <Text style={styles.statValueNegative}>{formatCurrency(data.usd.totals.expense, 'USD')}</Text>
                            </View>
                            <View style={styles.statBox}>
                                <Text style={styles.statLabel}>Balance</Text>
                                <Text style={styles.statValue}>{formatCurrency(data.usd.totals.balance, 'USD')}</Text>
                            </View>
                        </View>
                    </View>

                    {/* Monthly Detail Table */}
                    <View style={styles.section} break>
                        <Text style={styles.sectionTitle}>Detalle Mensual Comparativo</Text>
                        {renderMonthlySummaryTable()}
                    </View>
                </Page>
            )}

            {/* Detailed Breakdown Pages */}
            <Page size="A4" style={styles.page}>
                <View style={styles.header}>
                    <Text style={styles.title}>{title || `Detalle Financiero ${year}`}</Text>
                    <Text style={styles.subtitle}>Desglose por Categorías y Moneda</Text>
                </View>

                {/* ARS Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Resumen Pesos (ARS)</Text>
                    <View style={styles.statsContainer}>
                        <View style={styles.statBox}>
                            <Text style={styles.statLabel}>Ingresos</Text>
                            <Text style={styles.statValuePositive}>{formatCurrency(data.ars.totals.income, 'ARS')}</Text>
                        </View>
                        <View style={styles.statBox}>
                            <Text style={styles.statLabel}>Gastos</Text>
                            <Text style={styles.statValueNegative}>{formatCurrency(data.ars.totals.expense, 'ARS')}</Text>
                        </View>
                        <View style={styles.statBox}>
                            <Text style={styles.statLabel}>Balance</Text>
                            <Text style={styles.statValue}>{formatCurrency(data.ars.totals.balance, 'ARS')}</Text>
                        </View>
                    </View>

                    {/* Revenue Breakdown ARS */}
                    {data.ars.incomeByCategory.length > 0 && (
                        <>
                            <Text style={[styles.subtitle, { marginBottom: 10, marginTop: 15 }]}>Detalle de Categorías (Ingresos)</Text>
                            {renderCategoryTable(data.ars.incomeByCategory, 'ARS')}
                        </>
                    )}

                    {/* Expense Breakdown ARS */}
                    <Text style={[styles.subtitle, { marginBottom: 10, marginTop: 15 }]}>Detalle de Categorías (Gastos)</Text>
                    {renderCategoryTable(data.ars.expensesByCategory, 'ARS')}

                    {/* Transaction Ledger for ARS (Only for Monthly Reports) */}
                    {isMonthlyReport && data.ars.monthly[0]?.transactions?.length > 0 && (
                        <View style={{ marginTop: 20 }} break>
                            <Text style={[styles.sectionTitle, { fontSize: 14 }]}>Detalle de Transacciones (ARS)</Text>
                            {renderTransactionTable(data.ars.monthly[0].transactions, 'ARS')}
                        </View>
                    )}
                </View>

                {/* USD Section with Page Break */}
                <View style={styles.section} break>
                    <Text style={styles.sectionTitle}>Resumen Dólares (USD)</Text>
                    <View style={styles.statsContainer}>
                        <View style={styles.statBox}>
                            <Text style={styles.statLabel}>Ingresos</Text>
                            <Text style={styles.statValuePositive}>{formatCurrency(data.usd.totals.income, 'USD')}</Text>
                        </View>
                        <View style={styles.statBox}>
                            <Text style={styles.statLabel}>Gastos</Text>
                            <Text style={styles.statValueNegative}>{formatCurrency(data.usd.totals.expense, 'USD')}</Text>
                        </View>
                        <View style={styles.statBox}>
                            <Text style={styles.statLabel}>Balance</Text>
                            <Text style={styles.statValue}>{formatCurrency(data.usd.totals.balance, 'USD')}</Text>
                        </View>
                    </View>

                    {/* Revenue Breakdown USD */}
                    {data.usd.incomeByCategory.length > 0 && (
                        <>
                            <Text style={[styles.subtitle, { marginBottom: 10, marginTop: 15 }]}>Detalle de Categorías (Ingresos)</Text>
                            {renderCategoryTable(data.usd.incomeByCategory, 'USD')}
                        </>
                    )}

                    {/* Expense Breakdown USD */}
                    <Text style={[styles.subtitle, { marginBottom: 10, marginTop: 15 }]}>Detalle de Categorías (Gastos)</Text>
                    {renderCategoryTable(data.usd.expensesByCategory, 'USD')}

                    {/* Transaction Ledger for USD */}
                    {isMonthlyReport && data.usd.monthly[0]?.transactions?.length > 0 && (
                        <View style={{ marginTop: 20 }} break>
                            <Text style={[styles.sectionTitle, { fontSize: 14 }]}>Detalle de Transacciones (USD)</Text>
                            {renderTransactionTable(data.usd.monthly[0].transactions, 'USD')}
                        </View>
                    )}
                </View>

                <View style={styles.footer}>
                    <Text>Sistema de Gestión Financiera Iglesia</Text>
                </View>
            </Page>


            {/* Currency Exchange Page (if any) */}
            {
                data.exchanges && data.exchanges.length > 0 && (
                    <Page size="A4" style={styles.page}>
                        <View style={styles.header}>
                            <Text style={styles.title}>{title || 'Reporte de Intercambios'} - Historial de Conversiones</Text>
                            <Text style={styles.subtitle}>Detalle de operaciones de cambio de divisa</Text>
                        </View>
                        <View style={styles.section}>
                            <View style={styles.table}>
                                <View style={styles.tableHeaderRow}>
                                    <View style={[styles.tableCol, { width: '15%' }]}>
                                        <Text style={styles.tableCellHeader}>Fecha</Text>
                                    </View>
                                    <View style={[styles.tableCol, { width: '25%' }]}>
                                        <Text style={styles.tableCellHeader}>Salida</Text>
                                    </View>
                                    <View style={[styles.tableCol, { width: '25%' }]}>
                                        <Text style={styles.tableCellHeader}>Entrada</Text>
                                    </View>
                                    <View style={[styles.tableCol, { width: '35%' }]}>
                                        <Text style={styles.tableCellHeader}>Tasa de Cambio (Descripción)</Text>
                                    </View>
                                </View>
                                {data.exchanges.map((ex, i) => (
                                    <View key={i} style={styles.tableRow}>
                                        <View style={[styles.tableCol, { width: '15%' }]}>
                                            <Text style={styles.tableCell}>{new Date(ex.date).toLocaleDateString()}</Text>
                                        </View>
                                        <View style={[styles.tableCol, { width: '25%' }]}>
                                            <Text style={[styles.tableCell, { color: '#ef4444' }]}>
                                                - {formatCurrency(ex.amountOut, ex.currencyOut)}
                                            </Text>
                                        </View>
                                        <View style={[styles.tableCol, { width: '25%' }]}>
                                            <Text style={[styles.tableCell, { color: '#10b981' }]}>
                                                + {formatCurrency(ex.amountIn, ex.currencyIn)}
                                            </Text>
                                        </View>
                                        <View style={[styles.tableCol, { width: '35%' }]}>
                                            <Text style={[styles.tableCell, { fontSize: 8, color: '#555' }]}>{ex.description}</Text>
                                        </View>
                                    </View>
                                ))}
                            </View>
                        </View>
                        <View style={styles.footer}>
                            <Text>Sistema de Gestión Financiera Iglesia</Text>
                        </View>
                    </Page>
                )
            }
        </Document >
    )
}

import { Document, Page, Text, View, Font } from '@react-pdf/renderer'
import { styles } from './styles'
import { AnnualSummaryData } from '@/app/dashboard/annual-summary/actions'
import { formatDate } from '@/lib/dateUtils' // REGLA: Uso obligatorio de tu utilidad

// Registro de una fuente más limpia y profesional
Font.register({
    family: 'Inter',
    fonts: [
        { src: 'https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hjp-Ek-_EeA.woff', fontWeight: 400 },
        { src: 'https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuGkyAZ9hjp-Ek-_EeA.woff', fontWeight: 700 },
    ],
})

interface AnnualReportPDFProps {
    data: AnnualSummaryData
    year: number
    title?: string
}

// Helper centralizado para moneda dentro del PDF
const formatMoney = (amount: number, currency: string) => {
    return new Intl.NumberFormat(currency === 'ARS' ? 'es-AR' : 'en-US', {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: 2
    }).format(amount)
}

export function AnnualReportPDF({ data, year, title }: AnnualReportPDFProps) {
    const isMonthlyReport = data.ars.monthly.length === 1
    const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']

    // Componente de Fila de Tabla con Zebra Striping
    const TableRow = ({ children, isEven, isHeader }: any) => (
        <View style={[
            styles.tableRow,
            isEven && !isHeader ? { backgroundColor: '#f9fafb' } : {},
            isHeader ? { backgroundColor: '#1e293b', borderBottomColor: '#0f172a' } : {}
        ]}>
            {children}
        </View>
    )

    const renderCategoryTable = (categories: any[], currency: string) => (
        <View style={styles.table}>
            <TableRow isHeader>
                <View style={styles.tableColLarge}><Text style={[styles.tableCellHeader, { color: 'white' }]}>Categoría</Text></View>
                <View style={styles.tableCol}><Text style={[styles.tableCellHeader, { color: 'white', textAlign: 'right' }]}>Monto</Text></View>
            </TableRow>
            {categories.map((cat, i) => (
                <View key={i} wrap={false}>
                    <TableRow isEven={i % 2 === 0}>
                        <View style={styles.tableColLarge}>
                            <Text style={[styles.tableCell, { fontWeight: 'bold' }]}>{cat.name.toUpperCase()}</Text>
                        </View>
                        <View style={styles.tableCol}>
                            <Text style={[styles.tableCell, { fontWeight: 'bold', textAlign: 'right' }]}>{formatMoney(cat.amount, currency)}</Text>
                        </View>
                    </TableRow>
                    {cat.subcategories?.map((sub: any, j: number) => (
                        <TableRow key={j}>
                            <View style={styles.tableColLarge}>
                                <Text style={[styles.tableCell, { paddingLeft: 12, color: '#4b5563', fontSize: 9 }]}>• {sub.name}</Text>
                            </View>
                            <View style={styles.tableCol}>
                                <Text style={[styles.tableCell, { textAlign: 'right', color: '#4b5563', fontSize: 9 }]}>{formatMoney(sub.amount, currency)}</Text>
                            </View>
                        </TableRow>
                    ))}
                </View>
            ))}
        </View>
    )

    return (
        <Document title={`Reporte_${year}`}>
            <Page size="A4" style={[styles.page, { fontFamily: 'Inter' }]}>
                {/* Header Profesional */}
                <View style={styles.header}>
                    <View>
                        <Text style={styles.title}>{title || `Balance Anual ${year}`}</Text>
                        <Text style={styles.subtitle}>Reporte Oficial de Contaduría</Text>
                    </View>
                    <View style={{ textAlign: 'right' }}>
                        <Text style={{ fontSize: 10, color: '#64748b' }}>Fecha de Emisión</Text>
                        <Text style={{ fontSize: 12, fontWeight: 'bold' }}>{formatDate(new Date())}</Text>
                    </View>
                </View>

                {/* Resumen Ejecutivo */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>1. RESUMEN GLOBAL</Text>

                    {/* ARS Section */}
                    <Text style={[styles.subtitle, { marginBottom: 4, marginTop: 4, fontSize: 10 }]}>PESOS ARGENTINOS (ARS)</Text>
                    <View style={styles.statsContainer}>
                        <View style={[styles.statBox, { borderLeft: '4pt solid #10b981' }]}>
                            <Text style={styles.statLabel}>INGRESOS</Text>
                            <Text style={styles.statValuePositive}>{formatMoney(data.ars.totals.income, 'ARS')}</Text>
                        </View>
                        <View style={[styles.statBox, { borderLeft: '4pt solid #ef4444' }]}>
                            <Text style={styles.statLabel}>GASTOS</Text>
                            <Text style={styles.statValueNegative}>{formatMoney(data.ars.totals.expense, 'ARS')}</Text>
                        </View>
                        <View style={[styles.statBox, { borderLeft: '4pt solid #3b82f6' }]}>
                            <Text style={styles.statLabel}>BALANCE</Text>
                            <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#1e293b' }}>{formatMoney(data.ars.totals.balance, 'ARS')}</Text>
                        </View>
                    </View>

                    {/* USD Section */}
                    <Text style={[styles.subtitle, { marginBottom: 4, marginTop: 8, fontSize: 10 }]}>DÓLARES (USD)</Text>
                    <View style={styles.statsContainer}>
                        <View style={[styles.statBox, { borderLeft: '4pt solid #10b981' }]}>
                            <Text style={styles.statLabel}>INGRESOS</Text>
                            <Text style={styles.statValuePositive}>{formatMoney(data.usd.totals.income, 'USD')}</Text>
                        </View>
                        <View style={[styles.statBox, { borderLeft: '4pt solid #ef4444' }]}>
                            <Text style={styles.statLabel}>GASTOS</Text>
                            <Text style={styles.statValueNegative}>{formatMoney(data.usd.totals.expense, 'USD')}</Text>
                        </View>
                        <View style={[styles.statBox, { borderLeft: '4pt solid #3b82f6' }]}>
                            <Text style={styles.statLabel}>BALANCE</Text>
                            <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#1e293b' }}>{formatMoney(data.usd.totals.balance, 'USD')}</Text>
                        </View>
                    </View>
                </View>

                {/* Tabla Mensual con fuentes ajustadas para que no se rompa */}
                {!isMonthlyReport && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>2. EVOLUCIÓN MENSUAL</Text>
                        <View style={styles.table}>
                            <TableRow isHeader>
                                <View style={{ width: '20%' }}><Text style={[styles.tableCellHeader, { color: 'white' }]}>Mes</Text></View>
                                <View style={{ width: '40%' }}><Text style={[styles.tableCellHeader, { color: 'white', textAlign: 'center' }]}>Pesos (ARS)</Text></View>
                                <View style={{ width: '40%' }}><Text style={[styles.tableCellHeader, { color: 'white', textAlign: 'center' }]}>Dólares (USD)</Text></View>
                            </TableRow>
                            {data.ars.monthly.map((m, i) => (
                                <TableRow key={i} isEven={i % 2 === 0}>
                                    <View style={{ width: '20%' }}><Text style={styles.tableCell}>{months[i]}</Text></View>
                                    <View style={{ width: '40%', textAlign: 'right' }}><Text style={styles.tableCell}>{formatMoney(m.balance, 'ARS')}</Text></View>
                                    <View style={{ width: '40%', textAlign: 'right' }}><Text style={styles.tableCell}>{formatMoney(data.usd.monthly[i].balance, 'USD')}</Text></View>
                                </TableRow>
                            ))}
                        </View>
                    </View>
                )}

                {/* Desglose por Categorías ARS */}
                <View style={styles.section} break>
                    <Text style={styles.sectionTitle}>3.1. DESGLOSE DE GASTOS POR CATEGORÍA (ARS)</Text>
                    {renderCategoryTable(data.ars.expensesByCategory, 'ARS')}
                </View>

                {/* Desglose por Categorías USD */}
                <View style={styles.section} break>
                    <Text style={styles.sectionTitle}>3.2. DESGLOSE DE GASTOS POR CATEGORÍA (USD)</Text>
                    {renderCategoryTable(data.usd.expensesByCategory, 'USD')}
                </View>

                {/* Intercambios de Divisa */}
                {data.exchanges && data.exchanges.length > 0 && (
                    <View style={styles.section} break>
                        <Text style={styles.sectionTitle}>4. HISTORIAL DE CAMBIO DE DIVISAS</Text>
                        <View style={styles.table}>
                            <TableRow isHeader>
                                <View style={{ width: '20%' }}><Text style={[styles.tableCellHeader, { color: 'white' }]}>Fecha</Text></View>
                                <View style={{ width: '30%' }}><Text style={[styles.tableCellHeader, { color: 'white' }]}>Origen</Text></View>
                                <View style={{ width: '30%' }}><Text style={[styles.tableCellHeader, { color: 'white' }]}>Destino</Text></View>
                                <View style={{ width: '20%' }}><Text style={[styles.tableCellHeader, { color: 'white' }]}>Tasa</Text></View>
                            </TableRow>
                            {data.exchanges.map((ex, i) => (
                                <TableRow key={i} isEven={i % 2 === 0}>
                                    <View style={{ width: '20%' }}><Text style={styles.tableCell}>{formatDate(ex.date)}</Text></View>
                                    <View style={{ width: '30%' }}><Text style={[styles.tableCell, { color: '#ef4444' }]}>{formatMoney(ex.amountOut, ex.currencyOut)}</Text></View>
                                    <View style={{ width: '30%' }}><Text style={[styles.tableCell, { color: '#10b981' }]}>{formatMoney(ex.amountIn, ex.currencyIn)}</Text></View>
                                    <View style={{ width: '20%' }}><Text style={styles.tableCell}>{ex.rate}</Text></View>
                                </TableRow>
                            ))}
                        </View>
                    </View>
                )}

                {/* Footer con Numeración de Página */}
                <Text
                    style={styles.pageNumber}
                    render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`}
                    fixed
                />
            </Page>
        </Document>
    )
}   
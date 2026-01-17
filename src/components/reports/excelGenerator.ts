import * as XLSX from 'xlsx';
import { AnnualSummaryData } from '@/app/dashboard/annual-summary/actions';
import { formatDate } from '@/lib/dateUtils'; // Siguiendo tus reglas de proyecto

export const generateExcelReport = (data: AnnualSummaryData, year: number, title?: string) => {
    const wb = XLSX.utils.book_new();

    // --- HELPER: Formato de Moneda para Excel ---
    const currencyFormat = '#,##0.00_ ;[Red]-#,##0.00 ';

    // --- SHEET 1: RESUMEN EJECUTIVO ---
    const summaryData = [
        ['REPORTE ANUAL DE FINANZAS', ''],
        ['Título:', title || `Gestión Año ${year}`],
        ['Generado el:', formatDate(new Date())], // Uso de tu utilidad local
        [],
        ['RESUMEN POR MONEDA', 'INGRESOS', 'GASTOS', 'BALANCE'],
        ['Pesos Argentinos (ARS)', data.ars.totals.income, data.ars.totals.expense, data.ars.totals.balance],
        ['Dólares (USD)', data.usd.totals.income, data.usd.totals.expense, data.usd.totals.balance],
    ];

    const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);

    // Aplicar anchos de columna para que sea legible
    wsSummary['!cols'] = [{ wch: 25 }, { wch: 15 }, { wch: 15 }, { wch: 15 }];

    XLSX.utils.book_append_sheet(wb, wsSummary, "Resumen");

    // --- SHEET 2: DETALLE MENSUAL ---
    const months = [
        'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];

    const monthlyHeader = [
        ['Mes', 'Ingresos (ARS)', 'Gastos (ARS)', 'Balance (ARS)', 'Ingresos (USD)', 'Gastos (USD)', 'Balance (USD)']
    ];

    const monthlyRows = data.ars.monthly.map((mArs, i) => {
        const mUsd = data.usd.monthly[i];
        return [
            months[i],
            mArs.income, mArs.expense, mArs.balance,
            mUsd.income, mUsd.expense, mUsd.balance
        ];
    });

    const wsMonthly = XLSX.utils.aoa_to_sheet([...monthlyHeader, ...monthlyRows]);
    wsMonthly['!cols'] = [{ wch: 12 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }];

    XLSX.utils.book_append_sheet(wb, wsMonthly, "Mensual");

    // --- SHEETS 3 & 4: CATEGORÍAS (Desglosado en hojas separadas) ---

    // Helper para generar hoja de categorías
    const createCategorySheet = (title: string, dataArs: any[], dataUsd: any[]) => {
        const rows: any[] = [['Categoría', 'Moneda', 'Monto Total']];

        const addData = (items: any[], currency: string) => {
            items.forEach(cat => {
                rows.push([cat.name.toUpperCase(), currency, cat.amount]);
                if (cat.subcategories) {
                    cat.subcategories.forEach((sub: any) => {
                        rows.push([`   • ${sub.name}`, currency, sub.amount]);
                    });
                }
            });
        };

        addData(dataArs, 'ARS');
        addData(dataUsd, 'USD');

        const ws = XLSX.utils.aoa_to_sheet(rows);
        ws['!cols'] = [{ wch: 40 }, { wch: 10 }, { wch: 15 }];
        XLSX.utils.book_append_sheet(wb, ws, title);
    };

    createCategorySheet("Categorías (Ingresos)", data.ars.incomeByCategory, data.usd.incomeByCategory);
    createCategorySheet("Categorías (Gastos)", data.ars.expensesByCategory, data.usd.expensesByCategory);

    // --- SHEET 4: INTERCAMBIOS (Divisas) ---
    if (data.exchanges && data.exchanges.length > 0) {
        const exchangeHeader = [['Fecha', 'Descripción', 'Sale', 'Monto', 'Entra', 'Monto', 'Tasa de Cambio']];
        const exchangeRows = data.exchanges.map(ex => [
            formatDate(ex.date), // Cumpliendo regla Argentina
            ex.description,
            ex.currencyOut,
            ex.amountOut,
            ex.currencyIn,
            ex.amountIn,
            ex.rate
        ]);
        const wsExchange = XLSX.utils.aoa_to_sheet([...exchangeHeader, ...exchangeRows]);
        wsExchange['!cols'] = [{ wch: 12 }, { wch: 30 }, { wch: 8 }, { wch: 12 }, { wch: 8 }, { wch: 12 }, { wch: 10 }];
        XLSX.utils.book_append_sheet(wb, wsExchange, "Intercambios");
    }

    return wb;
}
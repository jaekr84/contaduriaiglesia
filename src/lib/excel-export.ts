import * as XLSX from 'xlsx'

type SheetData = {
    name: string
    data: any[]
}

export const exportToExcel = (data: any[] | SheetData[], fileName: string, sheetName: string = 'Sheet1') => {
    // 1. Create a new workbook
    const wb = XLSX.utils.book_new()

    // 2. Check if data is array of objects or array of sheets
    if (data.length > 0 && 'name' in data[0] && 'data' in data[0]) {
        // Multi-sheet mode
        (data as SheetData[]).forEach(sheet => {
            const ws = XLSX.utils.json_to_sheet(sheet.data)
            XLSX.utils.book_append_sheet(wb, ws, sheet.name)
        })
    } else {
        // Single sheet mode (backward compatibility)
        const ws = XLSX.utils.json_to_sheet(data as any[])
        XLSX.utils.book_append_sheet(wb, ws, sheetName)
    }

    // 4. Generate buffer and download
    XLSX.writeFile(wb, `${fileName}.xlsx`)
}

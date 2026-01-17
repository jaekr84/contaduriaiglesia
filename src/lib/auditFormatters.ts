// Helper para formatear detalles de auditoría en formato legible
export function formatAuditDetails(details: Record<string, any>, eventType: string): string {
    if (!details || Object.keys(details).length === 0) {
        return 'Sin detalles adicionales'
    }

    // Mapeo de nombres de campos técnicos a nombres legibles en español
    const fieldLabels: Record<string, string> = {
        type: 'Tipo',
        amount: 'Monto',
        currency: 'Moneda',
        categoryId: 'Categoría (ID)',
        categoryName: 'Categoría',
        description: 'Descripción',
        date: 'Fecha',
        name: 'Nombre',
        email: 'Correo electrónico',
        role: 'Rol',
        parentId: 'Categoría padre',
        firstName: 'Nombre',
        lastName: 'Apellido',
        phone: 'Teléfono',
        address: 'Dirección',
        membershipDate: 'Fecha de membresía',
        isActive: 'Activo',
        fromAmount: 'Monto origen',
        toAmount: 'Monto destino',
        fromCurrency: 'Moneda origen',
        toCurrency: 'Moneda destino',
        exchangeRate: 'Tipo de cambio',
    }

    // Formatear valores según su tipo
    const formatValue = (key: string, value: any): string => {
        if (value === null || value === undefined) return 'N/A'

        // Montos
        if (key === 'amount' || key === 'fromAmount' || key === 'toAmount') {
            const numValue = typeof value === 'string' ? parseFloat(value) : value
            return new Intl.NumberFormat('es-AR', {
                style: 'currency',
                currency: 'ARS',
                minimumFractionDigits: 0,
            }).format(numValue)
        }

        // Tipo de transacción
        if (key === 'type') {
            const types: Record<string, string> = {
                INCOME: 'Ingreso',
                EXPENSE: 'Egreso',
                EXCHANGE: 'Cambio de moneda',
            }
            return types[value] || value
        }

        // Moneda
        if (key === 'currency' || key === 'fromCurrency' || key === 'toCurrency') {
            return value === 'ARS' ? 'Pesos argentinos' : value === 'USD' ? 'Dólares' : value
        }

        // Booleanos
        if (typeof value === 'boolean') {
            return value ? 'Sí' : 'No'
        }

        // Fechas
        if (key.includes('Date') || key === 'date') {
            try {
                const date = new Date(value)
                return date.toLocaleDateString('es-AR', {
                    timeZone: 'America/Argentina/Buenos_Aires',
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                })
            } catch {
                return value
            }
        }

        // Tipo de cambio
        if (key === 'exchangeRate') {
            return parseFloat(value).toFixed(2)
        }

        return String(value)
    }

    // Si es un diff (tiene previous y new), formatear como cambios
    if (details.previous && details.new) {
        const changes: string[] = []
        const allKeys = new Set([...Object.keys(details.previous), ...Object.keys(details.new)])

        allKeys.forEach((key) => {
            // Skip categoryId if categoryName is present
            if (key === 'categoryId' && (details.previous.categoryName || details.new.categoryName)) {
                return
            }

            const label = fieldLabels[key] || key
            const oldValue = formatValue(key, details.previous[key])
            const newValue = formatValue(key, details.new[key])

            if (oldValue !== newValue) {
                changes.push(`${label}: ${oldValue} → ${newValue}`)
            }
        })

        return changes.length > 0 ? changes.join('\n') : 'Sin cambios detectados'
    }

    // Formatear detalles normales
    const formatted: string[] = []
    Object.entries(details).forEach(([key, value]) => {
        // Skip categoryId if categoryName is present
        if (key === 'categoryId' && details.categoryName) {
            return
        }

        const label = fieldLabels[key] || key
        const formattedValue = formatValue(key, value)
        formatted.push(`${label}: ${formattedValue}`)
    })

    return formatted.join('\n')
}

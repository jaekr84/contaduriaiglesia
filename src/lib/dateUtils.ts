
export const formatDate = (date: Date | string): string => {
    return new Intl.DateTimeFormat('es-AR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        timeZone: 'America/Argentina/Buenos_Aires',
    }).format(new Date(date))
}

export const formatDateTime = (date: Date | string): string => {
    return new Intl.DateTimeFormat('es-AR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
        timeZone: 'America/Argentina/Buenos_Aires',
    }).format(new Date(date))
}

export const formatCurrency = (amount: number, currency: 'ARS' | 'USD'): string => {
    // ARS is formatting locale es-AR ($ 1.234,56)
    // USD is formatting locale en-US ($1,234.56) or we can standardise both to 'es-AR' depending on preference
    // User requested "formato regional de Argentina" for currency too, but often USD is kept in US format.
    // However, usually "formatCurrency" implies displaying the value. 
    // The request said "Aprovechando la localización, para pesos argentinos ($)".
    // I'll stick to 'es-AR' for ARS and 'en-US' for USD to allow clear differentiation, or 'es-AR' for both if desired.
    // Given usage in actions.ts/PDF, keeping the distinction is safer UX.
    const locale = currency === 'ARS' ? 'es-AR' : 'en-US'
    return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: currency,
    }).format(amount)
}

/**
 * Returns a Date object representing the start of the year in Argentina timezone.
 * Corresponds to YYYY-01-01 00:00:00 -03:00
 */
export const getStartOfYearArgentina = (year: number): Date => {
    // Construct ISO string with offset
    return new Date(`${year}-01-01T00:00:00-03:00`)
}

/**
 * Returns a Date object representing the start of the NEXT year in Argentina timezone.
 * Corresponds to (YYYY+1)-01-01 00:00:00 -03:00
 */
export const getEndOfYearArgentina = (year: number): Date => {
    return new Date(`${year + 1}-01-01T00:00:00-03:00`)
}

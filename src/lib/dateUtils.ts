
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
    if (currency === 'USD') {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
        }).format(amount).replace('$', 'US$ ')
    }

    return new Intl.NumberFormat('es-AR', {
        style: 'currency',
        currency: 'ARS',
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

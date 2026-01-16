'use client'

import { useState, useEffect } from 'react'

interface MoneyInputProps {
    value?: string
    onChange?: (value: string) => void
    name?: string
    placeholder?: string
    required?: boolean
    className?: string
    disabled?: boolean
}

export function MoneyInput({ value, onChange, name, placeholder, required, className, disabled }: MoneyInputProps) {
    const [displayValue, setDisplayValue] = useState('')

    // Format number to "1.234,56" or similar
    const format = (val: string) => {
        if (!val) return ''
        // Remove non-numeric chars except dot/comma
        const clean = val.replace(/[^\d.,]/g, '')
        // Just return as is for now, but really we want to ensure visual "dots" for thousands
        // A simple trick: use Intl.NumberFormat to formatting on blur, but valid input on focus?
        // Let's use a simpler heuristic for Argentina: 
        // 1234 -> 1.234
        // 1234.56 -> 1.234,56
        return clean
    }

    // Sync from parent
    useEffect(() => {
        if (value) {
            setDisplayValue(value)
        } else if (value === '') {
            setDisplayValue('')
        }
    }, [value])

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const raw = e.target.value
        // Allow Digits, Dot, Comma
        if (/^[0-9.,]*$/.test(raw)) {
            setDisplayValue(raw)
            if (onChange) {
                // Normalize to standard "1234.56" format for backend
                // Replace comma with dot for JS Number parsing? 
                // Or user might use different locale.
                // Standardize: remove dots (thousands), replace comma with dot (decimal).
                // "1.234,56" -> "1234.56"
                const normalized = raw.replace(/\./g, '').replace(',', '.')
                onChange(normalized)
            }
        }
    }

    const handleBlur = () => {
        // On blur, format nicely
        if (!displayValue) return

        // Parse current string
        // "1234.56" -> 1234.56
        // "1.234,56" -> 1234.56
        // "1234,56" -> 1234.56
        let raw = displayValue.replace(/\./g, '').replace(',', '.')
        const num = parseFloat(raw)
        if (!isNaN(num)) {
            // Format back to ES-AR
            // es-AR uses dot for thousands, comma for decimal
            const formatted = new Intl.NumberFormat('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(num)
            setDisplayValue(formatted)
        }
    }

    return (
        <>
            <input
                type="text"
                inputMode="decimal"
                value={displayValue}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder={placeholder}
                required={required}
                className={className}
                disabled={disabled}
            />
            {/* Hidden input for real form submission if name is present */}
            {name && (
                <input
                    type="hidden"
                    name={name}
                    value={displayValue ? displayValue.replace(/\./g, '').replace(',', '.') : ''}
                />
            )}
        </>
    )
}

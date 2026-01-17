'use client'

import { useState, useEffect } from 'react'

interface MoneyInputProps {
    value?: string
    onChange?: (value: string) => void
    name?: string
    form?: string
    placeholder?: string
    required?: boolean
    className?: string
    disabled?: boolean
    onKeyDown?: React.KeyboardEventHandler<HTMLInputElement>
}

export function MoneyInput({ value, onChange, name, form, placeholder, required, className, disabled, onKeyDown }: MoneyInputProps) {
    const [displayValue, setDisplayValue] = useState('')

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
        const cursorPosition = e.target.selectionStart || 0

        // Allow Digits, Dot, Comma
        if (/^[0-9.,]*$/.test(raw)) {
            // Normalize: remove dots (thousands), replace comma with dot (decimal)
            const normalized = raw.replace(/\./g, '').replace(',', '.')
            const num = parseFloat(normalized)

            if (!isNaN(num) && normalized) {
                // Format in real-time with thousands separators
                // Split into integer and decimal parts
                const parts = normalized.split('.')
                const integerPart = parts[0]
                const decimalPart = parts[1]

                // Format integer part with dots
                const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.')

                // Reconstruct with comma for decimal
                const formatted = decimalPart !== undefined
                    ? `${formattedInteger},${decimalPart}`
                    : formattedInteger

                setDisplayValue(formatted)

                // Adjust cursor position based on added/removed separators
                const oldDots = (raw.slice(0, cursorPosition).match(/\./g) || []).length
                const newDots = (formatted.slice(0, cursorPosition).match(/\./g) || []).length
                const newCursorPosition = cursorPosition + (newDots - oldDots)

                // Set cursor position after state update
                setTimeout(() => {
                    if (e.target) {
                        e.target.setSelectionRange(newCursorPosition, newCursorPosition)
                    }
                }, 0)

                if (onChange) {
                    onChange(normalized)
                }
            } else if (raw === '' || raw === '0') {
                setDisplayValue(raw)
                if (onChange) {
                    onChange(raw.replace(',', '.'))
                }
            } else {
                // Invalid number, just set the raw value
                setDisplayValue(raw)
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
                form={form}
                value={displayValue}
                onChange={handleChange}
                onKeyDown={onKeyDown}
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
                    form={form}
                    value={displayValue ? displayValue.replace(/\./g, '').replace(',', '.') : ''}
                />
            )}
        </>
    )
}

"use client"

import * as React from "react"
import { Command as CommandPrimitive } from "cmdk"
import { Check } from "lucide-react"

import { cn } from "@/lib/utils"
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandItem,
    CommandList,
} from "@/components/ui/command"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"

export interface Option {
    value: string;
    label: string;
}

interface ComboboxProps {
    options: Option[];
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    searchPlaceholder?: string;
    emptyText?: string;
    disabled?: boolean;
    className?: string; // Expecting things like "h-9 w-full"
}

export const Combobox = React.forwardRef<HTMLInputElement, ComboboxProps>(({
    options,
    value,
    onChange,
    placeholder = "Select...",
    searchPlaceholder = "Search...",
    emptyText = "No results found.",
    disabled = false,
    className
}, ref) => {
    const [open, setOpen] = React.useState(false)
    const [query, setQuery] = React.useState("")

    // Sync query with external value on mount or change
    React.useEffect(() => {
        const selectedOption = options.find(o => o.value === value)
        if (selectedOption) {
            setQuery(selectedOption.label)
        } else if (!value) {
            setQuery("")
        }
    }, [value, options])

    const handleBlur = () => {
        // Give a small moment for Item selection to happen (if clicked)
        setTimeout(() => {
            const match = options.find(o => o.label.toLowerCase() === query.trim().toLowerCase())
            if (match) {
                // If text matches an option (case-insensitive), select it
                if (match.value !== value) onChange(match.value)
                setQuery(match.label) // format correctly
            } else {
                // No match, revert to last valid value OR clear if empty
                if (query.trim() === "") {
                    onChange("")
                    setQuery("")
                } else {
                    // Revert
                    const current = options.find(o => o.value === value)
                    setQuery(current ? current.label : "")
                }
            }
            setOpen(false)
        }, 200)
    }

    return (
        <Command className="overflow-visible bg-transparent">
            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <div className="relative">
                        <CommandPrimitive.Input
                            ref={ref}
                            placeholder={placeholder}
                            value={query}
                            onValueChange={(val) => {
                                setQuery(val)
                                setOpen(true)
                                // Optional: Clear selection immediately if user clears text?
                                // For now, we wait for valid selection or blur
                                if (val === "") onChange("")
                            }}
                            onKeyDown={(e) => {
                                if (e.key === 'Tab' && open) {
                                    setOpen(false)
                                    // 1. Try to find the actually highlighted item in the DOM (cmdk manages this)
                                    // cmdk v1 uses 'data-selected', older might use 'aria-selected'. We check both.
                                    const activeItem = document.querySelector('[cmdk-item][data-selected="true"]') ||
                                        document.querySelector('[cmdk-item][aria-selected="true"]')

                                    if (activeItem) {
                                        // cmdk stores the value in data-value (usually lowercased)
                                        // or we can use textContent if clean.
                                        // Our value passed to CommandItem is option.label.
                                        const activeValue = activeItem.getAttribute('data-value')

                                        // Find option that matches this label (fuzzy match since cmdk might normalize)
                                        const match = options.find(o =>
                                            o.label.toLowerCase() === activeValue?.toLowerCase()
                                        )

                                        if (match) {
                                            onChange(match.value)
                                            setQuery(match.label)
                                            return // Allow Tab to propagate focus
                                        }
                                    }

                                    // 2. Fallback: If nothing highlighted (e.g. mouse hover logic vs keyboard), 
                                    // check query match like before
                                    if (query) {
                                        const match = options.find(o => o.label.toLowerCase().includes(query.toLowerCase()))
                                        if (match) {
                                            onChange(match.value)
                                            setQuery(match.label)
                                        }
                                    }
                                }
                            }}
                            onFocus={() => setOpen(true)}
                            onBlur={handleBlur}
                            disabled={disabled}
                            className={cn(
                                "flex h-9 w-full rounded-md border border-zinc-200 bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-zinc-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-950 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-800 dark:text-zinc-50 dark:placeholder:text-zinc-400 dark:focus-visible:ring-zinc-300",
                                className
                            )}
                        />
                    </div>
                </PopoverTrigger>
                <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start" onOpenAutoFocus={(e) => e.preventDefault()}>
                    <CommandList>
                        {open && query.length > 0 && <CommandEmpty>{emptyText}</CommandEmpty>}
                        <CommandGroup>
                            {options.map((option) => (
                                <CommandItem
                                    key={option.value}
                                    value={option.label}
                                    onMouseDown={(e) => {
                                        // Prevent input blur when clicking an item
                                        e.preventDefault()
                                        e.stopPropagation()
                                    }}
                                    onSelect={() => {
                                        onChange(option.value)
                                        setQuery(option.label)
                                        setOpen(false)
                                    }}
                                >
                                    <Check
                                        className={cn(
                                            "mr-2 h-4 w-4",
                                            value === option.value ? "opacity-100" : "opacity-0"
                                        )}
                                    />
                                    {option.label}
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </PopoverContent>
            </Popover>
        </Command>
    )
})
Combobox.displayName = "Combobox"

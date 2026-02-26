"use client"

import * as React from "react"
import { Check, ChevronsUpDown } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
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
    className?: string; // Applied to the Button trigger
    onKeyDown?: React.KeyboardEventHandler<HTMLButtonElement>;
    onInputKeyDown?: React.KeyboardEventHandler<HTMLInputElement>;
}

export const Combobox = React.forwardRef<HTMLButtonElement, ComboboxProps>(({
    options,
    value,
    onChange,
    placeholder = "Seleccionar...",
    searchPlaceholder = "Buscar...",
    emptyText = "Sin resultados.",
    disabled = false,
    className,
    onKeyDown,
    onInputKeyDown
}, ref) => {
    const [open, setOpen] = React.useState(false)

    const selectedOption = options.find((option) => option.value === value)

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    type="button"
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    disabled={disabled}
                    ref={ref}
                    onKeyDown={onKeyDown}
                    onKeyUp={(e) => {
                        if (e.key === 'Tab' && !open) {
                            setOpen(true)
                        }
                    }}
                    className={cn(
                        "w-full justify-between h-9 px-3 py-1 font-normal bg-transparent border-zinc-200 shadow-sm transition-colors hover:bg-transparent focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-950 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-800 dark:text-zinc-50 dark:focus-visible:ring-zinc-300",
                        !value && "text-zinc-500 dark:text-zinc-400",
                        className
                    )}
                >
                    <span className="truncate">
                        {selectedOption ? selectedOption.label : placeholder}
                    </span>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent
                className="w-[var(--radix-popover-trigger-width)] p-0 shadow-md border-zinc-200 dark:border-zinc-800 overflow-hidden"
                align="start"
                sideOffset={4}
            >
                <Command className="w-full" loop>
                    <CommandInput
                        placeholder={searchPlaceholder}
                        className="h-9"
                        onKeyDown={onInputKeyDown}
                    />
                    <CommandList className="max-h-60">
                        <CommandEmpty className="py-2 px-4 text-sm">{emptyText}</CommandEmpty>
                        <CommandGroup>
                            {options.map((option) => (
                                <CommandItem
                                    key={option.value}
                                    value={option.label}
                                    onSelect={() => {
                                        onChange(option.value === value ? "" : option.value)
                                        setOpen(false)
                                    }}
                                    className="text-sm px-2 py-1.5"
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
                </Command>
            </PopoverContent>
        </Popover>
    )
})
Combobox.displayName = "Combobox"

'use client'

import { useState, useTransition, useMemo, useEffect } from 'react'
import { Pencil, X, Loader2, Trash2 } from 'lucide-react'
import { updateMember, deleteMember } from '../actions'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { Member } from '@prisma/client'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import * as z from 'zod'
import { Country, State } from 'country-state-city'

import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'

const formSchema = z.object({
    firstName: z.string().min(1, 'El nombre es obligatorio'),
    lastName: z.string().min(1, 'El apellido es obligatorio'),
    email: z.string().email('Email inválido').optional().or(z.literal('')),
    phone: z.string().optional(),
    address: z.string().optional(),
    birthDate: z.string().optional(),
    gender: z.string().optional(),
    country: z.string().optional(),
    state: z.string().optional(),
    city: z.string().optional(),
})

type FormValues = z.infer<typeof formSchema>

interface Props {
    member: Member
}

export function EditMemberDialog({ member }: Props) {
    const [isOpen, setIsOpen] = useState(false)
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
    const [isPending, startTransition] = useTransition()
    const router = useRouter()

    // Initialize country/state codes based on stored names
    const initialCountryCode = useMemo(() => {
        if (!member.country) return ''
        return Country.getAllCountries().find(c => c.name === member.country)?.isoCode || ''
    }, [member.country])

    const initialStateCode = useMemo(() => {
        if (!member.state || !initialCountryCode) return ''
        return State.getStatesOfCountry(initialCountryCode).find(s => s.name === member.state)?.isoCode || ''
    }, [member.state, initialCountryCode])

    const [selectedCountry, setSelectedCountry] = useState<string>(initialCountryCode)
    const [selectedState, setSelectedState] = useState<string>(initialStateCode)

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            firstName: member.firstName,
            lastName: member.lastName,
            email: member.email || '',
            phone: member.phone || '',
            address: member.address || '',
            birthDate: member.birthDate ? new Date(member.birthDate).toISOString().split('T')[0] : '',
            gender: member.gender || '',
            country: initialCountryCode,
            state: initialStateCode,
            city: member.city || '',
        },
    })

    // Update form values if member prop changes or when modal opens
    useEffect(() => {
        if (isOpen) {
            form.reset({
                firstName: member.firstName,
                lastName: member.lastName,
                email: member.email || '',
                phone: member.phone || '',
                address: member.address || '',
                birthDate: member.birthDate ? new Date(member.birthDate).toISOString().split('T')[0] : '',
                gender: member.gender || '',
                country: initialCountryCode,
                state: initialStateCode,
                city: member.city || '',
            })
            setSelectedCountry(initialCountryCode)
            setSelectedState(initialStateCode)
        }
    }, [isOpen, member, initialCountryCode, initialStateCode, form])

    const countries = useMemo(() => Country.getAllCountries(), [])
    const states = useMemo(() => selectedCountry ? State.getStatesOfCountry(selectedCountry) : [], [selectedCountry])

    function onSubmit(values: FormValues) {
        startTransition(async () => {
            const formData = new FormData()
            formData.append('firstName', values.firstName)
            formData.append('lastName', values.lastName)
            if (values.email) formData.append('email', values.email)
            if (values.phone) formData.append('phone', values.phone)
            if (values.address) formData.append('address', values.address)
            if (values.birthDate) formData.append('birthDate', values.birthDate)
            if (values.gender) formData.append('gender', values.gender)

            // Resolve Names from Codes
            if (values.country) {
                const countryName = Country.getCountryByCode(values.country)?.name
                if (countryName) formData.append('country', countryName)
            }
            if (values.state) {
                const stateName = State.getStateByCodeAndCountry(values.state, values.country!)?.name
                if (stateName) formData.append('state', stateName)
            }
            if (values.city) formData.append('city', values.city)

            const result = await updateMember(member.id, formData)

            if (result?.error) {
                toast.error(result.error)
            } else {
                toast.success('Miembro actualizado correctamente')
                setIsOpen(false)
                router.refresh()
            }
        })
    }

    const handleDelete = async () => {
        const result = await deleteMember(member.id)
        if (result?.error) {
            toast.error(result.error)
        } else {
            toast.success('Miembro eliminado correctamente')
            setIsOpen(false)
            router.refresh()
        }
    }

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                className="rounded-md p-2 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800 dark:hover:text-zinc-300 transition-colors"
                title="Editar Miembro"
            >
                <Pencil className="h-4 w-4" />
            </button>

            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-200 overflow-y-auto">
                    <div
                        className="relative w-full max-w-2xl rounded-xl bg-white p-6 shadow-lg animate-in zoom-in-95 duration-200 dark:bg-zinc-950 dark:border dark:border-zinc-800 max-h-[90vh] overflow-y-auto"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">Editar Miembro</h2>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="rounded-full p-2 text-zinc-500 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>

                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

                                {/* Section 1: Personal Information */}
                                <div className="space-y-4">
                                    <h3 className="text-sm font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Información Personal</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <FormField
                                            control={form.control}
                                            name="firstName"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormControl>
                                                        <Input placeholder="Nombre *" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="lastName"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormControl>
                                                        <Input placeholder="Apellido *" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="gender"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <Select
                                                        onValueChange={field.onChange}
                                                        defaultValue={field.value}
                                                    >
                                                        <FormControl>
                                                            <SelectTrigger className={!field.value ? "text-zinc-500" : ""}>
                                                                <SelectValue placeholder="Genero" />
                                                            </SelectTrigger>
                                                        </FormControl>
                                                        <SelectContent>
                                                            <SelectItem value="Hombre">Hombre</SelectItem>
                                                            <SelectItem value="Mujer">Mujer</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="birthDate"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormControl>
                                                        <Input
                                                            type="date"
                                                            {...field}
                                                            className={!field.value ? "text-zinc-500" : ""}
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                </div>

                                {/* Section 2: Contact Information */}
                                <div className="space-y-4">
                                    <h3 className="text-sm font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Contacto</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <FormField
                                            control={form.control}
                                            name="email"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormControl>
                                                        <Input type="email" placeholder="Email" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="phone"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormControl>
                                                        <Input type="tel" placeholder="Teléfono" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                </div>

                                {/* Section 3: Location */}
                                <div className="space-y-4">
                                    <h3 className="text-sm font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Ubicación</h3>
                                    <div className="grid grid-cols-1 gap-4">
                                        <FormField
                                            control={form.control}
                                            name="address"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormControl>
                                                        <Input placeholder="Dirección completa" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            <FormField
                                                control={form.control}
                                                name="country"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <Select
                                                            onValueChange={(value) => {
                                                                field.onChange(value)
                                                                setSelectedCountry(value)
                                                                setSelectedState('')
                                                                form.setValue('state', '')
                                                                form.setValue('city', '')
                                                            }}
                                                            defaultValue={field.value}
                                                        >
                                                            <FormControl>
                                                                <SelectTrigger className={!field.value ? "text-zinc-500" : ""}>
                                                                    <SelectValue placeholder="País" />
                                                                </SelectTrigger>
                                                            </FormControl>
                                                            <SelectContent>
                                                                {countries.map((country) => (
                                                                    <SelectItem key={country.isoCode} value={country.isoCode}>
                                                                        {country.name}
                                                                    </SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                            <FormField
                                                control={form.control}
                                                name="state"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <Select
                                                            onValueChange={(value) => {
                                                                field.onChange(value)
                                                                setSelectedState(value)
                                                                form.setValue('city', '')
                                                            }}
                                                            defaultValue={field.value}
                                                            disabled={!selectedCountry}
                                                        // Force component to re-render when options change significantly or value is reset
                                                        // key={selectedCountry} 
                                                        >
                                                            <FormControl>
                                                                <SelectTrigger className={!field.value ? "text-zinc-500" : ""}>
                                                                    <SelectValue placeholder="Provincia/Estado" />
                                                                </SelectTrigger>
                                                            </FormControl>
                                                            <SelectContent>
                                                                {states.map((state) => (
                                                                    <SelectItem key={state.isoCode} value={state.isoCode}>
                                                                        {state.name}
                                                                    </SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                            <FormField
                                                control={form.control}
                                                name="city"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormControl>
                                                            <Input placeholder="Ciudad/Localidad" {...field} />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="flex justify-between items-center pt-4 border-t border-zinc-100 dark:border-zinc-800">
                                    <button
                                        type="button"
                                        onClick={() => setShowDeleteConfirm(true)}
                                        disabled={isPending}
                                        className="inline-flex items-center justify-center rounded-md text-sm font-medium text-red-500 hover:bg-red-50 hover:text-red-600 transition-colors h-9 px-4 py-2 dark:hover:bg-red-950/20"
                                    >
                                        <Trash2 className="mr-2 h-4 w-4" />
                                        Eliminar
                                    </button>

                                    <div className="flex gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setIsOpen(false)}
                                            className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-950 disabled:pointer-events-none disabled:opacity-50 border border-zinc-200 bg-transparent text-zinc-900 shadow-sm hover:bg-zinc-100 h-9 px-4 py-2 dark:border-zinc-800 dark:text-zinc-50 dark:hover:bg-zinc-800"
                                        >
                                            Cancelar
                                        </button>
                                        <Button
                                            type="submit"
                                            disabled={isPending}
                                            className="bg-zinc-900 text-zinc-50 hover:bg-zinc-900/90 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-50/90"
                                        >
                                            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                            Guardar Cambios
                                        </Button>
                                    </div>
                                </div>
                            </form>
                        </Form>
                    </div>
                </div>
            )}

            <ConfirmDialog
                open={showDeleteConfirm}
                onOpenChange={setShowDeleteConfirm}
                title="Eliminar Miembro"
                description={`¿Estás seguro de que deseas eliminar a ${member.firstName} ${member.lastName}? Esta acción no se puede deshacer.`}
                confirmText="Eliminar"
                cancelText="Cancelar"
                onConfirm={handleDelete}
                destructive
                requiresCheckbox
                checkboxLabel="Entiendo que esta acción es irreversible"
            />
        </>
    )
}

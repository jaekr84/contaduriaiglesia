'use client'

import { useTransition, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import * as z from 'zod'
import { Loader2, Plus } from 'lucide-react'
import { toast } from 'sonner'
import { createMember } from '../actions'
import { Country, State } from 'country-state-city'

import { Button } from '@/components/ui/button'
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'

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

export function CreateMemberCard() {
    const [isPending, startTransition] = useTransition()
    const router = useRouter()

    // Watch fields for cascading
    const [selectedCountry, setSelectedCountry] = useState<string>('')
    const [selectedState, setSelectedState] = useState<string>('')

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            firstName: '',
            lastName: '',
            email: '',
            phone: '',
            address: '',
            birthDate: '',
            gender: '',
            country: '',
            state: '',
            city: '',
        },
    })

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

            const result = await createMember(formData)

            if (result?.error) {
                toast.error(result.error)
            } else {
                toast.success('Miembro creado correctamente')
                form.reset()
                setSelectedCountry('')
                setSelectedState('')
                router.refresh()
            }
        })
    }

    return (
        <Card className="border-zinc-200 dark:border-zinc-800 shadow-sm">
            <CardContent className="p-6">
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">

                        {/* Section 1: Personal Information */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-medium text-zinc-900 dark:text-zinc-50">Información Personal</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
                            <h3 className="text-lg font-medium text-zinc-900 dark:text-zinc-50">Contacto</h3>
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
                            <h3 className="text-lg font-medium text-zinc-900 dark:text-zinc-50">Ubicación</h3>
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

                        {/* Footer Action */}
                        <div className="flex justify-end pt-4">
                            <Button type="submit" disabled={isPending} className="w-full md:w-auto min-w-[150px]">
                                {isPending ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Guardando...
                                    </>
                                ) : (
                                    <>
                                        <Plus className="mr-2 h-4 w-4" />
                                        Guardar Miembro
                                    </>
                                )}
                            </Button>
                        </div>
                    </form>
                </Form>
            </CardContent>
        </Card>
    )
}

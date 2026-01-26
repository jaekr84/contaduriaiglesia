'use client'

import { useRef, useEffect } from 'react'
import { Users, Cake } from 'lucide-react'
import { Modak } from 'next/font/google'
import fitty from 'fitty'

const modak = Modak({
    weight: '400',
    subsets: ['latin'],
})

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement,
} from 'chart.js'
import { Bar, Doughnut } from 'react-chartjs-2'

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement
)

interface MemberStatsProps {
    stats: {
        genderStats: Record<string, number>
        ageStats: Record<string, number>
        countryStats: Record<string, number>
        stateStats: Record<string, number>
        cityStats: Record<string, number>
        birthdaysThisMonth: {
            id: string
            fullName: string
            day: number
            age: number
        }[]
    }
    totalMembers: number
}

export function MemberStats({ stats, totalMembers }: MemberStatsProps) {
    // Gender Chart Data
    const genderLabels = Object.keys(stats.genderStats)
    const genderData = {
        labels: genderLabels,
        datasets: [
            {
                label: '# de Miembros',
                data: Object.values(stats.genderStats),
                backgroundColor: [
                    'rgba(54, 162, 235, 0.5)',
                    'rgba(255, 99, 132, 0.5)',
                    'rgba(255, 206, 86, 0.5)',
                ],
                borderColor: [
                    'rgba(54, 162, 235, 1)',
                    'rgba(255, 99, 132, 1)',
                    'rgba(255, 206, 86, 1)',
                ],
                borderWidth: 1,
            },
        ],
    }

    // Age Chart Data
    const ageLabels = Object.keys(stats.ageStats)
    const ageData = {
        labels: ageLabels,
        datasets: [
            {
                label: 'Cantidad de Miembros',
                data: Object.values(stats.ageStats),
                backgroundColor: 'rgba(75, 192, 192, 0.5)',
                borderColor: 'rgba(75, 192, 192, 1)',
                borderWidth: 1,
            },
        ],
    }

    const monthName = new Date().toLocaleString('es-AR', { month: 'long' })
    const capitalizedMonthName = monthName.charAt(0).toUpperCase() + monthName.slice(1)

    // Dynamic Font Size with fitty
    const textRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (textRef.current) {
            fitty(textRef.current, { minSize: 50, maxSize: 300, multiLine: false })
        }
    }, [totalMembers])

    const formattedTotal = totalMembers.toLocaleString('es-AR')

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {/* Total Members KPI */}
            <Card className="h-full flex flex-col">
                <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-zinc-500 font-medium text-sm">
                        <Users className="h-4 w-4" />
                        Total de Miembros
                    </CardTitle>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col items-center justify-center min-h-[240px] px-8 py-4 overflow-hidden">
                    <div className="w-full flex items-center justify-center">
                        <span
                            ref={textRef}
                            className={`block whitespace-nowrap leading-none font-bold text-zinc-900 dark:text-zinc-50 tracking-tighter ${modak.className}`}
                        >
                            {formattedTotal}
                        </span>
                    </div>
                </CardContent>
            </Card>

            {/* Birthdays this Month */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Cake className="h-5 w-5 text-pink-500" />
                        Cumpleaños de {capitalizedMonthName}
                    </CardTitle>
                    <CardDescription>Miembros que cumplen años este mes</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-between pb-2 mb-2 border-b border-zinc-100 dark:border-zinc-800">
                        <span className="text-xs font-semibold text-zinc-500 uppercase">Miembro</span>
                        <span className="text-xs font-semibold text-zinc-500 uppercase">Día</span>
                    </div>
                    <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2">
                        {stats.birthdaysThisMonth && stats.birthdaysThisMonth.length > 0 ? (
                            stats.birthdaysThisMonth.map((b) => (
                                <div key={b.id} className="flex items-center justify-between border-b border-zinc-100 last:border-0 pb-2 last:pb-0 dark:border-zinc-800">
                                    <div className="flex flex-col">
                                        <span className="text-sm font-medium">{b.fullName}</span>
                                        <span className="text-xs text-zinc-400">Cumple {b.age} años</span>
                                    </div>
                                    <div className="flex items-center justify-center h-8 w-8 rounded-full bg-pink-100 text-pink-600 text-xs font-bold dark:bg-pink-900/30 dark:text-pink-400">
                                        {b.day}
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p className="text-sm text-zinc-500">No hay cumpleaños este mes.</p>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Gender Distribution */}
            <Card>
                <CardHeader>
                    <CardTitle>Composición por Genero</CardTitle>
                    <CardDescription>Distribución de miembros por género</CardDescription>
                </CardHeader>
                <CardContent className="flex justify-center h-[300px]">
                    <Doughnut
                        data={genderData}
                        options={{
                            maintainAspectRatio: false,
                            plugins: {
                                legend: {
                                    position: 'bottom'
                                }
                            }
                        }}
                    />
                </CardContent>
            </Card>

            {/* Age Distribution */}
            <Card className="md:col-span-2 lg:col-span-3">
                <CardHeader>
                    <CardTitle>Rango de Edades</CardTitle>
                    <CardDescription>Distribución de miembros por grupos de edad</CardDescription>
                </CardHeader>
                <CardContent className="h-[300px]">
                    <Bar
                        data={ageData}
                        options={{
                            responsive: true,
                            maintainAspectRatio: false,
                            plugins: {
                                legend: {
                                    position: 'top' as const,
                                },
                            },
                        }}
                    />
                </CardContent>
            </Card>

            {/* Location Stats - Country */}
            <Card>
                <CardHeader>
                    <CardTitle>Miembros por País</CardTitle>
                    <CardDescription>Top países con más miembros</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {Object.entries(stats.countryStats)
                            .sort(([, a], [, b]) => b - a)
                            .map(([country, count]) => (
                                <div key={country} className="flex items-center justify-between">
                                    <span className="text-sm font-medium">{country}</span>
                                    <span className="text-sm text-zinc-500">{count.toLocaleString('es-AR')} miembros</span>
                                </div>
                            ))}
                        {Object.keys(stats.countryStats).length === 0 && (
                            <p className="text-sm text-zinc-500">No hay datos de ubicación disponibles.</p>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Location Stats - State */}
            <Card>
                <CardHeader>
                    <CardTitle>Miembros por Provincia</CardTitle>
                    <CardDescription>Top provincias/estados con más miembros</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {Object.entries(stats.stateStats)
                            .sort(([, a], [, b]) => b - a)
                            .slice(0, 10) // Show top 10
                            .map(([state, count]) => (
                                <div key={state} className="flex items-center justify-between">
                                    <span className="text-sm font-medium">{state}</span>
                                    <span className="text-sm text-zinc-500">{count.toLocaleString('es-AR')} miembros</span>
                                </div>
                            ))}
                        {Object.keys(stats.stateStats).length === 0 && (
                            <p className="text-sm text-zinc-500">No hay datos de ubicación disponibles.</p>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Location Stats - City */}
            <Card>
                <CardHeader>
                    <CardTitle>Miembros por Localidad</CardTitle>
                    <CardDescription>Top localidades con más miembros</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {stats.cityStats && Object.entries(stats.cityStats)
                            .sort(([, a], [, b]) => b - a)
                            .slice(0, 10) // Show top 10
                            .map(([city, count]) => (
                                <div key={city} className="flex items-center justify-between">
                                    <span className="text-sm font-medium">{city}</span>
                                    <span className="text-sm text-zinc-500">{count.toLocaleString('es-AR')} miembros</span>
                                </div>
                            ))}
                        {(!stats.cityStats || Object.keys(stats.cityStats).length === 0) && (
                            <p className="text-sm text-zinc-500">No hay datos de ubicación disponibles.</p>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}

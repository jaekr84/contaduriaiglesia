'use client'

import { Line } from 'react-chartjs-2'
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler,
    ChartOptions,
} from 'chart.js'

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler
)

interface MonthlyData {
    month: string
    ARS: number
    USD: number
}

interface Props {
    data: MonthlyData[]
    currency: 'ARS' | 'USD'
}

export function BalanceChart({ data, currency }: Props) {
    const isARS = currency === 'ARS'
    const color = isARS ? 'rgb(59, 130, 246)' : 'rgb(34, 197, 94)'
    const bgColor = isARS ? 'rgba(59, 130, 246, 0.1)' : 'rgba(34, 197, 94, 0.1)'

    const chartData = {
        labels: data.map(d => d.month),
        datasets: [
            {
                label: currency,
                data: data.map(d => d[currency]),
                borderColor: color,
                backgroundColor: bgColor,
                tension: 0.3,
                fill: true,
            },
        ],
    }

    const options: ChartOptions<'line'> = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                display: false,
            },
            title: {
                display: false,
            },
            tooltip: {
                callbacks: {
                    label: function (context) {
                        let label = context.dataset.label || ''
                        if (label) {
                            label += ': '
                        }
                        if (context.parsed.y !== null) {
                            label += new Intl.NumberFormat(currency === 'ARS' ? 'es-AR' : 'en-US', {
                                style: 'currency',
                                currency: currency,
                            }).format(context.parsed.y)
                        }
                        return label
                    }
                }
            }
        },
        scales: {
            y: {
                beginAtZero: true,
                ticks: {
                    callback: function (value) {
                        return new Intl.NumberFormat(currency === 'ARS' ? 'es-AR' : 'en-US', {
                            style: 'currency',
                            currency: currency,
                            notation: 'compact',
                        }).format(value as number)
                    }
                }
            }
        }
    }

    return (
        <div className="h-[300px] w-full">
            <Line data={chartData} options={options} />
        </div>
    )
}

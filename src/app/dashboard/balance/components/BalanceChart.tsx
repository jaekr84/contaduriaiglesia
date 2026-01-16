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
    ChartOptions,
} from 'chart.js'

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend
)

interface MonthlyData {
    month: string
    ARS: number
    USD: number
}

interface Props {
    data: MonthlyData[]
}

export function BalanceChart({ data }: Props) {
    const chartData = {
        labels: data.map(d => d.month),
        datasets: [
            {
                label: 'ARS',
                data: data.map(d => d.ARS),
                borderColor: 'rgb(59, 130, 246)',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                tension: 0.3,
            },
            {
                label: 'USD',
                data: data.map(d => d.USD),
                borderColor: 'rgb(34, 197, 94)',
                backgroundColor: 'rgba(34, 197, 94, 0.1)',
                tension: 0.3,
            },
        ],
    }

    const options: ChartOptions<'line'> = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'top' as const,
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
                            label += new Intl.NumberFormat('es-AR', {
                                style: 'currency',
                                currency: context.dataset.label === 'ARS' ? 'ARS' : 'USD',
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
                        return new Intl.NumberFormat('es-AR', {
                            style: 'currency',
                            currency: 'ARS',
                            notation: 'compact',
                        }).format(value as number)
                    }
                }
            }
        }
    }

    return (
        <div className="h-[400px]">
            <Line data={chartData} options={options} />
        </div>
    )
}

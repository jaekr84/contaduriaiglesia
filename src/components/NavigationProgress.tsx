'use client'

import { useEffect, useState } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'

export function NavigationProgress() {
    const pathname = usePathname()
    const searchParams = useSearchParams()
    const [isNavigating, setIsNavigating] = useState(false)

    useEffect(() => {
        setIsNavigating(false)
    }, [pathname, searchParams])

    useEffect(() => {
        const handleStart = () => setIsNavigating(true)
        const handleComplete = () => setIsNavigating(false)

        // Listen for link clicks
        const handleClick = (e: MouseEvent) => {
            const target = e.target as HTMLElement
            const link = target.closest('a')
            if (link && link.href && !link.href.startsWith('#') && !link.target) {
                const url = new URL(link.href)
                if (url.pathname !== pathname) {
                    handleStart()
                }
            }
        }

        document.addEventListener('click', handleClick, true)

        return () => {
            document.removeEventListener('click', handleClick, true)
        }
    }, [pathname])

    if (!isNavigating) return null

    return (
        <div className="fixed top-0 left-0 right-0 z-50 h-1 bg-zinc-200 dark:bg-zinc-800">
            <div className="h-full bg-blue-600 dark:bg-blue-500 animate-progress" />
        </div>
    )
}

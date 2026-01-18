import { useEffect } from 'react'

export function useKeyboardShortcut(key: string, callback: () => void) {
    useEffect(() => {
        const handler = (event: KeyboardEvent) => {
            if (event.key === key) {
                event.preventDefault()
                callback()
            }
        }

        window.addEventListener('keydown', handler)
        return () => {
            window.removeEventListener('keydown', handler)
        }
    }, [key, callback])
}

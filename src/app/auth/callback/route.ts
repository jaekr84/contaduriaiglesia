import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
    const requestUrl = new URL(request.url)
    const code = requestUrl.searchParams.get('code')
    const next = requestUrl.searchParams.get('next')

    if (code) {
        const supabase = await createClient()
        await supabase.auth.exchangeCodeForSession(code)
    }

    if (next) {
        return NextResponse.redirect(new URL(next, requestUrl.origin))
    }

    // Default redirect if no 'next' parameter is provided
    return NextResponse.redirect(new URL('/dashboard', requestUrl.origin))
}

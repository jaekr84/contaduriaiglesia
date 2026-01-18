'use server'

import { revalidatePath } from 'next/cache'
import prisma from '@/lib/prisma'
import { requireProfile } from '@/lib/auth'
import { Prisma } from '@prisma/client'

export async function getMembers(query?: string) {
    const profile = await requireProfile()

    if (!['ADMIN', 'RRHH'].includes(profile.role)) {
        throw new Error('No autorizado')
    }

    const where: Prisma.MemberWhereInput = {
        organizationId: profile.organizationId,
        ...(query
            ? {
                OR: [
                    { firstName: { contains: query, mode: 'insensitive' } },
                    { lastName: { contains: query, mode: 'insensitive' } },
                    { email: { contains: query, mode: 'insensitive' } },
                ],
            }
            : {}),
    }

    const members = await prisma.member.findMany({
        where,
        orderBy: { lastName: 'asc' },
    })

    return members
}

// Helper to normalize text to Title Case
function toTitleCase(str: string | null): string | null {
    if (!str) return null
    return str
        .toLowerCase()
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ')
        .trim()
}

export async function createMember(formData: FormData) {
    const profile = await requireProfile()

    if (!['ADMIN', 'RRHH'].includes(profile.role)) {
        return { error: 'No autorizado' }
    }

    const firstName = (formData.get('firstName') as string).trim()
    const lastName = (formData.get('lastName') as string).trim()
    const email = (formData.get('email') as string)?.trim() || null
    const phone = (formData.get('phone') as string)?.trim() || null
    const address = (formData.get('address') as string)?.trim() || null
    const gender = (formData.get('gender') as string)?.trim() || null
    const country = (formData.get('country') as string)?.trim() || null
    const state = (formData.get('state') as string)?.trim() || null
    // Normalize city to Title Case
    const city = toTitleCase(formData.get('city') as string)
    const birthDateRaw = formData.get('birthDate') as string
    // Append Noon UTC to ensure it stays on the correct day in AR timezone
    const birthDate = birthDateRaw ? new Date(birthDateRaw + 'T12:00:00Z') : null

    try {
        await prisma.member.create({
            data: {
                firstName,
                lastName,
                email,
                phone,
                address,
                gender,
                country,
                state,
                city,
                birthDate,
                organizationId: profile.organizationId,
            },
        })
        revalidatePath('/dashboard/members')
        return { success: true }
    } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
            if (error.code === 'P2002') {
                return { error: 'Ya existe un miembro con ese email.' }
            }
        }
        return { error: 'Error al crear miembro' }
    }
}

export async function updateMember(id: string, formData: FormData) {
    const profile = await requireProfile()

    if (!['ADMIN', 'RRHH'].includes(profile.role)) {
        return { error: 'No autorizado' }
    }

    const firstName = (formData.get('firstName') as string).trim()
    const lastName = (formData.get('lastName') as string).trim()
    const email = (formData.get('email') as string)?.trim() || null
    const phone = (formData.get('phone') as string)?.trim() || null
    const address = (formData.get('address') as string)?.trim() || null
    const gender = (formData.get('gender') as string)?.trim() || null
    const country = (formData.get('country') as string)?.trim() || null
    const state = (formData.get('state') as string)?.trim() || null
    // Normalize city to Title Case
    const city = toTitleCase(formData.get('city') as string)
    const birthDateRaw = formData.get('birthDate') as string
    // Append Noon UTC to ensure it stays on the correct day in AR timezone
    const birthDate = birthDateRaw ? new Date(birthDateRaw + 'T12:00:00Z') : null

    try {
        await prisma.member.update({
            where: {
                id,
                organizationId: profile.organizationId // Security: Ensure ownership
            },
            data: {
                firstName,
                lastName,
                email,
                phone,
                address,
                gender,
                country,
                state,
                city,
                birthDate,
            },
        })
        revalidatePath('/dashboard/members')
        return { success: true }
    } catch (error) {
        return { error: 'Error al actualizar miembro' }
    }
}

export async function deleteMember(id: string) {
    const profile = await requireProfile()

    if (!['ADMIN', 'RRHH'].includes(profile.role)) {
        return { error: 'No autorizado' }
    }

    try {
        await prisma.member.delete({
            where: {
                id,
                organizationId: profile.organizationId
            },
        })
        revalidatePath('/dashboard/members')
        return { success: true }
    } catch (error) {
        return { error: 'Error al eliminar miembro' }
    }
}

export async function getMemberStats() {
    const profile = await requireProfile()

    if (!['ADMIN', 'RRHH', 'VIEWER'].includes(profile.role)) {
        throw new Error('No autorizado')
    }

    const members = await prisma.member.findMany({
        where: {
            organizationId: profile.organizationId,
        },
        select: {
            firstName: true,
            lastName: true,
            gender: true,
            birthDate: true,
            country: true,
            state: true,
            city: true,
        },
    })

    // Birthdays this month
    const currentMonth = new Date().getMonth()
    const birthdaysThisMonth = members
        .filter(m => m.birthDate && new Date(m.birthDate).getMonth() === currentMonth)
        .map(m => ({
            id: m.firstName + m.lastName + m.birthDate, // simple unique key for display
            fullName: `${m.firstName} ${m.lastName}`,
            day: new Date(m.birthDate!).getDate(),
            age: new Date().getFullYear() - new Date(m.birthDate!).getFullYear()
        }))
        .sort((a, b) => a.day - b.day)

    // Gender Distribution
    const genderStats = members.reduce((acc, member) => {
        const gender = member.gender || 'No especificado'
        acc[gender] = (acc[gender] || 0) + 1
        return acc
    }, {} as Record<string, number>)

    // Location Stats
    const countryStats = members.reduce((acc, member) => {
        const country = member.country || 'No especificado'
        acc[country] = (acc[country] || 0) + 1
        return acc
    }, {} as Record<string, number>)

    const stateStats = members.reduce((acc, member) => {
        const state = member.state || 'No especificado'
        acc[state] = (acc[state] || 0) + 1
        return acc
    }, {} as Record<string, number>)

    const cityStats = members.reduce((acc, member) => {
        // Normalize city on read to aggregate existing "bad" data
        const city = toTitleCase(member.city) || 'No especificado'
        acc[city] = (acc[city] || 0) + 1
        return acc
    }, {} as Record<string, number>)

    // Age Distribution
    const ageStats: Record<string, number> = {}
    const today = new Date()

    // Determine Min/Max Age for dynamic ranges
    let minAge = 120
    let maxAge = 0
    const ages: number[] = []

    members.forEach((member) => {
        if (member.birthDate) {
            const birthDate = new Date(member.birthDate)
            let age = today.getFullYear() - birthDate.getFullYear()
            const m = today.getMonth() - birthDate.getMonth()
            if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
                age--
            }

            // Ignore future birthdates or invalid calculations
            if (age >= 0) {
                ages.push(age)
                if (age < minAge) minAge = age
                if (age > maxAge) maxAge = age
            }
        }
    })

    if (ages.length > 0) {
        // Ensure startRange is at least 0
        let startRange = Math.max(0, Math.floor(minAge / 10) * 10)
        // Round up maxAge to nearest 10 (e.g., 75 -> 80)
        let endRange = Math.ceil(maxAge / 10) * 10
        if (endRange === startRange) endRange += 10
        if (endRange === 0) endRange = 10

        // Initialize buckets
        for (let i = startRange; i < endRange; i += 10) {
            const label = `${i} a ${i + 10}`
            ageStats[label] = 0
        }

        // Fill buckets
        ages.forEach((age) => {
            const lowerBound = Math.floor(age / 10) * 10
            const label = `${lowerBound} a ${lowerBound + 10}`

            if (ageStats[label] !== undefined) {
                ageStats[label]++
            } else {
                // dynamic expansion for edge cases
                ageStats[label] = 1
            }
        })
    }

    // Sort Age Stats Keys properly numerically
    const sortedAgeStats = Object.entries(ageStats)
        .sort((a, b) => {
            const numA = parseInt(a[0].split(' ')[0])
            const numB = parseInt(b[0].split(' ')[0])
            return numA - numB
        })
        .reduce((acc, [key, value]) => {
            acc[key] = value
            return acc
        }, {} as Record<string, number>)


    return {
        genderStats,
        ageStats: sortedAgeStats,
        countryStats,
        stateStats,
        cityStats,
        birthdaysThisMonth,
        totalMembers: members.length
    }
}

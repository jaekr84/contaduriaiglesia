'use server'

import { revalidatePath } from 'next/cache'
import prisma from '@/lib/prisma'
import { requireProfile } from '@/lib/auth'
import { Prisma } from '@prisma/client'

export async function getMembers(query?: string) {
    const profile = await requireProfile()

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

export async function createMember(formData: FormData) {
    const profile = await requireProfile()

    const firstName = (formData.get('firstName') as string).trim()
    const lastName = (formData.get('lastName') as string).trim()
    const email = (formData.get('email') as string)?.trim() || null
    const phone = (formData.get('phone') as string)?.trim() || null
    const address = (formData.get('address') as string)?.trim() || null
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

    const firstName = (formData.get('firstName') as string).trim()
    const lastName = (formData.get('lastName') as string).trim()
    const email = (formData.get('email') as string)?.trim() || null
    const phone = (formData.get('phone') as string)?.trim() || null
    const address = (formData.get('address') as string)?.trim() || null
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

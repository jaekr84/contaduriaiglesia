
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log('Checking database for transactions...')

    // Get an organization
    const org = await prisma.organization.findFirst()
    if (!org) {
        console.log('No organization found.')
        return
    }
    console.log(`Found organization: ${org.name} (${org.id})`)

    // Check total transactions
    const totalTx = await prisma.transaction.count({
        where: { organizationId: org.id }
    })
    console.log(`Total transactions for org: ${totalTx}`)

    // Check 2025 transactions
    const start2025 = new Date('2025-01-01')
    const end2025 = new Date('2026-01-01')
    const tx2025 = await prisma.transaction.count({
        where: {
            organizationId: org.id,
            date: {
                gte: start2025,
                lt: end2025
            }
        }
    })
    console.log(`Transactions in 2025: ${tx2025}`)

    // Check 2026 transactions
    const start2026 = new Date('2026-01-01')
    const end2026 = new Date('2027-01-01')
    const tx2026 = await prisma.transaction.count({
        where: {
            organizationId: org.id,
            date: {
                gte: start2026,
                lt: end2026
            }
        }
    })
    console.log(`Transactions in 2026: ${tx2026}`)

    // Check sample transaction
    const sample = await prisma.transaction.findFirst({
        where: { organizationId: org.id },
        orderBy: { date: 'desc' },
        take: 1
    })
    if (sample) {
        console.log('Latest transaction:', sample)
    }

}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })

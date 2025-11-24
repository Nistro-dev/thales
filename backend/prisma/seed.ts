import { PrismaClient } from '@prisma/client'
import { hashPassword } from '../src/utils/password.js'

const prisma = new PrismaClient()

async function main(): Promise<void> {
  const hashedPassword = await hashPassword('Admin123!')

  const admin = await prisma.user.upsert({
    where: { email: 'admin@thales.local' },
    update: {},
    create: {
      email: 'admin@thales.local',
      password: hashedPassword,
      firstName: 'Admin',
      lastName: 'System',
      status: 'ACTIVE',
      gdprConsentAt: new Date(),
      gdprVersion: '1.0',
    },
  })

  console.log('Seed completed')
  console.log('Admin created:', admin.email)
  console.log('Password: Admin123!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
import { PrismaClient } from '@prisma/client'
import { hashPassword } from '../src/utils/password.js'
import { PERMISSIONS, PERMISSIONS_BY_CATEGORY } from '../src/constants/permissions.js'

const prisma = new PrismaClient()

async function main(): Promise<void> {
  console.log('🌱 Starting seed...\n')

  // 1. Create Permissions
  console.log('📝 Creating permissions...')
  const permissionRecords = []

  for (const [category, permissions] of Object.entries(PERMISSIONS_BY_CATEGORY)) {
    for (const permissionKey of permissions) {
      const permissionName = permissionKey.split('_').map(word =>
        word.charAt(0) + word.slice(1).toLowerCase()
      ).join(' ')

      const permission = await prisma.permission.upsert({
        where: { key: permissionKey },
        update: {},
        create: {
          key: permissionKey,
          name: permissionName,
          category,
          description: `Permission: ${permissionName}`,
        },
      })
      permissionRecords.push(permission)
    }
  }
  console.log(`✅ Created ${permissionRecords.length} permissions\n`)

  // 2. Create Default Section
  console.log('📂 Creating default section "Autres"...')
  await prisma.section.upsert({
    where: { id: '00000000-0000-0000-0000-000000000001' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000001',
      name: 'Autres',
      description: 'Produits sans catégorie',
      isSystem: true,
      sortOrder: 9999,
    },
  })

  // 3. Create Super Admin Role
  console.log('👑 Creating Super Admin role...')
  const superAdminRole = await prisma.role.upsert({
    where: { name: 'Super Admin' },
    update: {},
    create: {
      name: 'Super Admin',
      description: 'Accès complet à toutes les fonctionnalités',
      isSystem: true,
      permissions: {
        create: permissionRecords.map(p => ({
          permissionId: p.id,
        })),
      },
    },
  })
  console.log('✅ Super Admin role created\n')

  // 4. Create Basic User Role
  console.log('👤 Creating Basic User role...')
  const basicUserPermissions = permissionRecords.filter(p =>
    [
      PERMISSIONS.VIEW_FILES as string,
    ].includes(p.key)
  )

  const basicUserRole = await prisma.role.upsert({
    where: { name: 'User' },
    update: {},
    create: {
      name: 'User',
      description: 'Utilisateur basique avec accès limité',
      isSystem: true,
      permissions: {
        create: basicUserPermissions.map(p => ({
          permissionId: p.id,
        })),
      },
    },
  })
  console.log('✅ Basic User role created\n')

  // 5. Create Super Admin User
  console.log('🔐 Creating Super Admin user...')
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
      creditBalance: 1000,
      cautionStatus: 'EXEMPTED',
      gdprConsentAt: new Date(),
      gdprVersion: '1.0',
    },
  })

  // Assign User role to admin user
  await prisma.userRole.upsert({
    where: {
      userId_roleId: {
        userId: admin.id,
        roleId: basicUserRole.id,
      },
    },
    update: {},
    create: {
      userId: admin.id,
      roleId: basicUserRole.id,
    },
  })

  // Assign Super Admin role to admin user
  await prisma.userRole.upsert({
    where: {
      userId_roleId: {
        userId: admin.id,
        roleId: superAdminRole.id,
      },
    },
    update: {},
    create: {
      userId: admin.id,
      roleId: superAdminRole.id,
    },
  })
  console.log('✅ Super Admin user created and roles assigned\n')

  // 4. Create Test Basic User
  console.log('👤 Creating Basic User test account...')
  const userPassword = await hashPassword('User123!')

  const basicUser = await prisma.user.upsert({
    where: { email: 'user@thales.local' },
    update: {},
    create: {
      email: 'user@thales.local',
      password: userPassword,
      firstName: 'Basic',
      lastName: 'User',
      status: 'ACTIVE',
      creditBalance: 100,
      cautionStatus: 'PENDING',
      gdprConsentAt: new Date(),
      gdprVersion: '1.0',
    },
  })

  await prisma.userRole.upsert({
    where: {
      userId_roleId: {
        userId: basicUser.id,
        roleId: basicUserRole.id,
      },
    },
    update: {},
    create: {
      userId: basicUser.id,
      roleId: basicUserRole.id,
    },
  })
  console.log('✅ Basic User test account created\n')

  // Summary
  console.log('🎉 Seed completed successfully!\n')
  console.log('==========================================')
  console.log('Test Accounts:')
  console.log('==========================================')
  console.log('Super Admin:')
  console.log('  Email: admin@thales.local')
  console.log('  Password: Admin123!')
  console.log('')
  console.log('Basic User:')
  console.log('  Email: user@thales.local')
  console.log('  Password: User123!')
  console.log('==========================================\n')
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

import { PrismaClient } from '@prisma/client'
import { hashPassword } from '../src/utils/password.js'
import { PERMISSIONS, PERMISSIONS_BY_CATEGORY } from '../src/constants/permissions.js'

const prisma = new PrismaClient()

async function main(): Promise<void> {
  console.log('🌱 Starting PRODUCTION seed...\n')
  console.log('⚠️  This seed creates only essential data (no test products/users)\n')

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

  // 2. Create Default Section "Autres" (required as fallback)
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
  console.log('✅ Default section created\n')

  // 3. Create Super Admin Role with ALL permissions
  console.log('👑 Creating Super Admin role...')

  // First check if role exists
  const existingRole = await prisma.role.findUnique({
    where: { name: 'Super Admin' },
    include: { permissions: true },
  })

  let superAdminRole
  if (existingRole) {
    // Update permissions for existing role
    superAdminRole = existingRole

    // Get existing permission IDs
    const existingPermIds = existingRole.permissions.map(p => p.permissionId)
    const newPermIds = permissionRecords.map(p => p.id)

    // Add missing permissions
    const missingPermIds = newPermIds.filter(id => !existingPermIds.includes(id))
    if (missingPermIds.length > 0) {
      await prisma.rolePermission.createMany({
        data: missingPermIds.map(permissionId => ({
          roleId: superAdminRole.id,
          permissionId,
        })),
        skipDuplicates: true,
      })
      console.log(`  Added ${missingPermIds.length} new permissions to Super Admin role`)
    }
  } else {
    superAdminRole = await prisma.role.create({
      data: {
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
  }
  console.log('✅ Super Admin role ready\n')

  // 4. Create Basic User Role
  console.log('👤 Creating Basic User role...')
  const basicUserPermissions = permissionRecords.filter(p =>
    [
      PERMISSIONS.VIEW_FILES as string,
    ].includes(p.key)
  )

  const existingBasicRole = await prisma.role.findUnique({
    where: { name: 'Utilisateur' },
  })

  let basicUserRole
  if (existingBasicRole) {
    basicUserRole = existingBasicRole
  } else {
    basicUserRole = await prisma.role.create({
      data: {
        name: 'Utilisateur',
        description: 'Utilisateur basique avec accès limité',
        isSystem: true,
        permissions: {
          create: basicUserPermissions.map(p => ({
            permissionId: p.id,
          })),
        },
      },
    })
  }
  console.log('✅ Basic User role ready\n')

  // 5. Create Super Admin User
  console.log('🔐 Creating Super Admin user...')

  const adminEmail = process.env.ADMIN_EMAIL || 'admin@thales.local'
  const adminPassword = process.env.ADMIN_PASSWORD || 'Admin123!'

  const hashedPassword = await hashPassword(adminPassword)

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
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

  // Assign roles to admin
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

  // Summary
  console.log('🎉 Production seed completed successfully!\n')
  console.log('==========================================')
  console.log('Admin Account:')
  console.log('==========================================')
  console.log(`  Email: ${adminEmail}`)
  console.log(`  Password: ${adminPassword === 'Admin123!' ? 'Admin123! (default)' : '(from ADMIN_PASSWORD env)'}`)
  console.log('')
  console.log('⚠️  IMPORTANT: Change the admin password after first login!')
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

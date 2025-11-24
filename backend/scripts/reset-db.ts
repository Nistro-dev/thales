import { execSync } from 'child_process'

console.log('🔄 Starting database reset...\n')

try {
  console.log('1️⃣ Dropping all tables...')
  execSync('npx prisma migrate reset --force --skip-seed', {
    stdio: 'inherit',
    cwd: process.cwd(),
  })
  console.log('✅ Tables dropped\n')

  console.log('2️⃣ Generating Prisma Client...')
  execSync('npx prisma generate', {
    stdio: 'inherit',
    cwd: process.cwd(),
  })
  console.log('✅ Prisma Client generated\n')

  console.log('4️⃣ Seeding database...')
  execSync('npx tsx prisma/seed.ts', {
    stdio: 'inherit',
    cwd: process.cwd(),
  })
  console.log('✅ Database seeded\n')

  console.log('🎉 Database reset completed successfully!')
} catch (error) {
  console.error('❌ Error during database reset:', error)
  process.exit(1)
}

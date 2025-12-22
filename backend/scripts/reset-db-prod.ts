import { execSync } from 'child_process'
import * as readline from 'readline'

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
})

function ask(question: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer)
    })
  })
}

async function main() {
  console.log('')
  console.log('╔══════════════════════════════════════════════════════════════╗')
  console.log('║           ⚠️  PRODUCTION DATABASE RESET SCRIPT ⚠️             ║')
  console.log('╠══════════════════════════════════════════════════════════════╣')
  console.log('║  This script will:                                           ║')
  console.log('║  1. DROP ALL TABLES (all data will be lost!)                 ║')
  console.log('║  2. Run all migrations from scratch                          ║')
  console.log('║  3. Create only essential data (permissions, roles, admin)   ║')
  console.log('║                                                              ║')
  console.log('║  NO test data (products, test users) will be created.        ║')
  console.log('╚══════════════════════════════════════════════════════════════╝')
  console.log('')

  const confirm1 = await ask('Are you sure you want to reset the database? (yes/no): ')
  if (confirm1.toLowerCase() !== 'yes') {
    console.log('❌ Aborted.')
    rl.close()
    process.exit(0)
  }

  const confirm2 = await ask('Type "RESET PRODUCTION" to confirm: ')
  if (confirm2 !== 'RESET PRODUCTION') {
    console.log('❌ Confirmation failed. Aborted.')
    rl.close()
    process.exit(0)
  }

  rl.close()

  console.log('')
  console.log('🔄 Starting PRODUCTION database reset...\n')

  try {
    console.log('1️⃣  Dropping all tables and running migrations...')
    execSync('npx prisma migrate reset --force --skip-seed', {
      stdio: 'inherit',
      cwd: process.cwd(),
    })
    console.log('✅ Database reset and migrations applied\n')

    console.log('2️⃣  Generating Prisma Client...')
    execSync('npx prisma generate', {
      stdio: 'inherit',
      cwd: process.cwd(),
    })
    console.log('✅ Prisma Client generated\n')

    console.log('3️⃣  Running PRODUCTION seed (minimal data)...')
    execSync('npx tsx prisma/seed-prod.ts', {
      stdio: 'inherit',
      cwd: process.cwd(),
    })
    console.log('✅ Production seed completed\n')

    console.log('═══════════════════════════════════════════════════════════════')
    console.log('🎉 PRODUCTION database reset completed successfully!')
    console.log('═══════════════════════════════════════════════════════════════')
    console.log('')
    console.log('Next steps:')
    console.log('  1. Log in with the admin account')
    console.log('  2. Change the admin password')
    console.log('  3. Create your sections and products')
    console.log('  4. Invite users')
    console.log('')
  } catch (error) {
    console.error('❌ Error during database reset:', error)
    process.exit(1)
  }
}

main()

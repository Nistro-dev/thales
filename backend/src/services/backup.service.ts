import { exec } from 'child_process'
import { promisify } from 'util'
import { createAuditLog } from './audit.service.js'
import { logger } from '../utils/logger.js'

const execAsync = promisify(exec)

interface DatabaseBackupResult {
  filename: string
  content: string
  createdAt: Date
}

/**
 * Generate a PostgreSQL database dump using pg_dump
 */
export async function generateDatabaseBackup(performedBy: string): Promise<DatabaseBackupResult> {
  const databaseUrl = process.env.DATABASE_URL

  if (!databaseUrl) {
    throw {
      statusCode: 500,
      message: 'DATABASE_URL is not configured',
      code: 'CONFIGURATION_ERROR',
    }
  }

  try {
    // Parse the database URL to extract connection details
    const url = new URL(databaseUrl)
    const host = url.hostname
    const port = url.port || '5432'
    const database = url.pathname.slice(1) // Remove leading '/'
    const username = url.username
    const password = url.password

    // Set environment variable for password
    const env = { ...process.env, PGPASSWORD: password }

    // Generate timestamp for filename
    const now = new Date()
    const timestamp = now.toISOString().replace(/[:.]/g, '-').slice(0, 19)
    const filename = `backup_${database}_${timestamp}.sql`

    // Execute pg_dump command
    // Using --no-owner and --no-acl to make the dump more portable
    const command = `pg_dump -h ${host} -p ${port} -U ${username} -d ${database} --no-owner --no-acl --clean --if-exists`

    logger.info({ command: command.replace(password, '***') }, 'Executing database backup')

    const { stdout, stderr } = await execAsync(command, { env, maxBuffer: 100 * 1024 * 1024 }) // 100MB max

    if (stderr && !stderr.includes('NOTICE')) {
      logger.warn({ stderr }, 'pg_dump stderr output')
    }

    // Log the backup action
    await createAuditLog({
      performedBy,
      action: 'DATABASE_BACKUP',
      targetType: 'System',
      targetId: 'database',
      metadata: {
        filename,
        size: stdout.length,
      },
    })

    logger.info({ filename, size: stdout.length }, 'Database backup generated successfully')

    return {
      filename,
      content: stdout,
      createdAt: now,
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    logger.error({ error: errorMessage }, 'Failed to generate database backup')

    throw {
      statusCode: 500,
      message: 'Échec de la sauvegarde de la base de données',
      code: 'BACKUP_FAILED',
      details: errorMessage,
    }
  }
}

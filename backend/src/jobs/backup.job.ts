// src/jobs/backup.job.ts

import cron, { type ScheduledTask } from 'node-cron'
import { env } from '../config/env.js'
import { logger } from '../utils/logger.js'
import { createFullBackup, cleanupOldBackups } from '../services/backup.service.js'

let backupJob: ScheduledTask | null = null

/**
 * Run the backup job
 */
async function runBackupJob(): Promise<void> {
  logger.info('Starting scheduled backup job...')

  try {
    // Create a full backup (database + files)
    const result = await createFullBackup('system', true)
    logger.info({ backupId: result.id, size: result.size }, 'Scheduled backup completed successfully')

    // Clean up old backups based on retention policy
    const deletedCount = await cleanupOldBackups()
    if (deletedCount > 0) {
      logger.info({ deletedCount }, 'Old backups cleaned up')
    }
  } catch (error) {
    logger.error({ error }, 'Scheduled backup job failed')
  }
}

/**
 * Start the backup cron job
 */
export function startBackupJob(): void {
  if (!env.BACKUP_CRON_ENABLED) {
    logger.info('Backup cron job is disabled')
    return
  }

  const schedule = env.BACKUP_CRON_SCHEDULE

  if (!cron.validate(schedule)) {
    logger.error({ schedule }, 'Invalid backup cron schedule')
    return
  }

  logger.info({ schedule }, 'Starting backup cron job...')

  backupJob = cron.schedule(schedule, runBackupJob, {
    timezone: 'Europe/Paris',
  })

  logger.info(`Backup job scheduled (${schedule})`)
}

/**
 * Stop the backup cron job
 */
export function stopBackupJob(): void {
  if (backupJob) {
    backupJob.stop()
    backupJob = null
    logger.info('Backup job stopped')
  }
}

/**
 * Trigger a backup manually (for testing or on-demand)
 */
export async function triggerBackupNow(): Promise<void> {
  await runBackupJob()
}

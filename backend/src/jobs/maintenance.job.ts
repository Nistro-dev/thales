// src/jobs/maintenance.job.ts

import cron, { type ScheduledTask } from 'node-cron'
import { logger } from '../utils/logger.js'
import {
  activateScheduledMaintenances,
  endExpiredMaintenances,
} from '../services/maintenance.service.js'

let maintenanceJob: ScheduledTask | null = null

/**
 * Run the maintenance job
 * - Activates scheduled maintenances that should start today
 * - Ends maintenances that have reached their end date
 */
async function runMaintenanceJob(): Promise<void> {
  logger.info('Starting scheduled maintenance job...')

  try {
    // Activate scheduled maintenances
    const activatedCount = await activateScheduledMaintenances()
    if (activatedCount > 0) {
      logger.info({ activatedCount }, `Activated ${activatedCount} scheduled maintenance(s)`)
    }

    // End expired maintenances
    const endedCount = await endExpiredMaintenances()
    if (endedCount > 0) {
      logger.info({ endedCount }, `Ended ${endedCount} expired maintenance(s)`)
    }

    logger.info('Maintenance job completed successfully')
  } catch (error) {
    logger.error({ error }, 'Maintenance job failed')
  }
}

/**
 * Start the maintenance cron job
 * Runs every day at 00:05 (5 minutes after midnight)
 */
export function startMaintenanceJob(): void {
  // Run every day at 00:05
  const schedule = '5 0 * * *'

  if (!cron.validate(schedule)) {
    logger.error({ schedule }, 'Invalid maintenance cron schedule')
    return
  }

  logger.info({ schedule }, 'Starting maintenance cron job...')

  maintenanceJob = cron.schedule(schedule, runMaintenanceJob, {
    timezone: 'Europe/Paris',
  })

  logger.info(`Maintenance job scheduled (${schedule})`)

  // Also run immediately on startup to catch any missed updates
  runMaintenanceJob()
}

/**
 * Stop the maintenance cron job
 */
export function stopMaintenanceJob(): void {
  if (maintenanceJob) {
    maintenanceJob.stop()
    maintenanceJob = null
    logger.info('Maintenance job stopped')
  }
}

/**
 * Trigger a maintenance check manually (for testing or on-demand)
 */
export async function triggerMaintenanceJobNow(): Promise<void> {
  await runMaintenanceJob()
}

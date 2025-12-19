// src/jobs/index.ts

import { startInactiveUsersJob, stopInactiveUsersJob } from './inactiveUsers.job.js'
import { startBackupJob, stopBackupJob } from './backup.job.js'
import { logger } from '../utils/logger.js'

// Start all scheduled jobs
export const startAllJobs = (): void => {
  logger.info('Starting scheduled jobs...')
  startInactiveUsersJob()
  startBackupJob()
}

// Stop all scheduled jobs
export const stopAllJobs = (): void => {
  logger.info('Stopping scheduled jobs...')
  stopInactiveUsersJob()
  stopBackupJob()
}

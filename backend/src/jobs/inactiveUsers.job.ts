// src/jobs/inactiveUsers.job.ts

import { disableInactiveUsers } from '../services/user.service.js'
import { logger } from '../utils/logger.js'

const ONE_DAY_MS = 24 * 60 * 60 * 1000

let intervalId: NodeJS.Timeout | null = null

// Run the inactive users check
export const runInactiveUsersCheck = async (): Promise<void> => {
  try {
    logger.info('Starting inactive users check...')
    const result = await disableInactiveUsers()

    if (result.disabled > 0) {
      logger.info(
        { disabled: result.disabled, users: result.users },
        `Disabled ${result.disabled} inactive user(s)`
      )
    } else {
      logger.info('No inactive users found to disable')
    }
  } catch (error) {
    logger.error({ error }, 'Error during inactive users check')
  }
}

// Start the scheduled job
export const startInactiveUsersJob = (): void => {
  // Run immediately on startup
  runInactiveUsersCheck()

  // Then run once per day
  intervalId = setInterval(runInactiveUsersCheck, ONE_DAY_MS)

  logger.info('Inactive users job scheduled (runs daily)')
}

// Stop the scheduled job
export const stopInactiveUsersJob = (): void => {
  if (intervalId) {
    clearInterval(intervalId)
    intervalId = null
    logger.info('Inactive users job stopped')
  }
}

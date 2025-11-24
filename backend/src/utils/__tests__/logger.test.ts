import { describe, it, expect } from 'vitest'
import { logger } from '../logger'

describe('Logger', () => {
  it('should have required log methods', () => {
    expect(logger.info).toBeDefined()
    expect(logger.error).toBeDefined()
    expect(logger.warn).toBeDefined()
    expect(logger.debug).toBeDefined()
  })

  it('should log without throwing errors', () => {
    expect(() => logger.info('Test info message')).not.toThrow()
    expect(() => logger.error('Test error message')).not.toThrow()
    expect(() => logger.warn('Test warning message')).not.toThrow()
    expect(() => logger.debug('Test debug message')).not.toThrow()
  })
})
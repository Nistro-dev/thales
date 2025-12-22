import { exec } from 'child_process'
import { promisify } from 'util'
import { createReadStream, createWriteStream } from 'fs'
import { mkdir, rm, readdir, stat } from 'fs/promises'
import { join } from 'path'
import { createGzip, createGunzip } from 'zlib'
import { pipeline } from 'stream/promises'
import archiver from 'archiver'
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  ListObjectsV2Command,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { env } from '../config/env.js'
import { createAuditLog } from './audit.service.js'
import { logger } from '../utils/logger.js'
import { prisma } from '../utils/prisma.js'

const execAsync = promisify(exec)

// S3 client for backups (can use same or different bucket)
const s3Client = new S3Client({
  endpoint: env.S3_ENDPOINT,
  region: env.S3_REGION,
  credentials: {
    accessKeyId: env.S3_ACCESS_KEY,
    secretAccessKey: env.S3_SECRET_KEY,
  },
  forcePathStyle: true,
})

const BACKUP_BUCKET = env.S3_BACKUP_BUCKET || env.S3_BUCKET
const BACKUP_PREFIX = 'backups/'
const TEMP_DIR = '/tmp/thales-backups'

export interface BackupInfo {
  id: string
  filename: string
  type: 'full' | 'database' | 'files'
  size: number
  createdAt: Date
  createdBy?: string
  isAutomatic: boolean
}

export interface BackupResult {
  id: string
  filename: string
  size: number
  createdAt: Date
}

/**
 * Ensure temp directory exists
 */
async function ensureTempDir(): Promise<void> {
  await mkdir(TEMP_DIR, { recursive: true })
}

/**
 * Clean up temp directory
 */
async function cleanupTempDir(): Promise<void> {
  try {
    await rm(TEMP_DIR, { recursive: true, force: true })
  } catch {
    // Ignore errors
  }
}

/**
 * Parse DATABASE_URL to extract connection details
 */
function parseDatabaseUrl(): {
  host: string
  port: string
  database: string
  username: string
  password: string
} {
  const databaseUrl = process.env.DATABASE_URL
  if (!databaseUrl) {
    throw {
      statusCode: 500,
      message: 'DATABASE_URL is not configured',
      code: 'CONFIGURATION_ERROR',
    }
  }

  const url = new URL(databaseUrl)
  return {
    host: url.hostname,
    port: url.port || '5432',
    database: url.pathname.slice(1),
    username: url.username,
    password: url.password,
  }
}

/**
 * Generate a database dump
 */
async function generateDatabaseDump(outputPath: string): Promise<void> {
  const { host, port, database, username, password } = parseDatabaseUrl()
  const env = { ...process.env, PGPASSWORD: password }

  const command = `pg_dump -h ${host} -p ${port} -U ${username} -d ${database} --no-owner --no-acl --clean --if-exists`

  logger.info('Generating database dump...')
  const { stdout, stderr } = await execAsync(command, { env, maxBuffer: 500 * 1024 * 1024 })

  if (stderr && !stderr.includes('NOTICE')) {
    logger.warn({ stderr }, 'pg_dump stderr output')
  }

  // Write to file and compress
  const writeStream = createWriteStream(outputPath)
  const gzip = createGzip()

  await new Promise<void>((resolve, reject) => {
    gzip.pipe(writeStream)
    gzip.write(stdout)
    gzip.end()
    writeStream.on('finish', resolve)
    writeStream.on('error', reject)
  })

  logger.info({ outputPath }, 'Database dump generated')
}

/**
 * Create a backup of all uploaded files from S3
 */
async function backupUploadedFiles(outputPath: string): Promise<void> {
  logger.info('Backing up uploaded files...')

  // Get all files from different tables
  const [userFiles, productFiles, movementPhotos] = await Promise.all([
    // User uploaded files
    prisma.file.findMany({
      select: { key: true },
    }),
    // Product files (images, documents)
    prisma.productFile.findMany({
      select: { s3Key: true },
    }),
    // Movement photos (checkout/return photos)
    prisma.movementPhoto.findMany({
      select: { s3Key: true },
    }),
  ])

  // Combine all S3 keys
  const allKeys = new Set<string>()
  userFiles.forEach((f) => allKeys.add(f.key))
  productFiles.forEach((f) => allKeys.add(f.s3Key))
  movementPhotos.forEach((f) => allKeys.add(f.s3Key))

  const keysArray = Array.from(allKeys)

  logger.info({
    userFiles: userFiles.length,
    productFiles: productFiles.length,
    movementPhotos: movementPhotos.length,
    totalKeys: keysArray.length,
  }, 'Files to backup')

  const output = createWriteStream(outputPath)
  const archive = archiver('zip', { zlib: { level: 9 } })

  // Handle archive errors
  archive.on('error', (err) => {
    logger.error({ error: err }, 'Archive error')
    throw err
  })

  archive.pipe(output)

  if (keysArray.length === 0) {
    logger.info('No files to backup')
    // Add a placeholder file to avoid empty archive issues
    archive.append('No files at time of backup', { name: '.placeholder' })
  } else {
    // Download each file from S3 and add to archive
    let successCount = 0
    for (const key of keysArray) {
      try {
        const command = new GetObjectCommand({
          Bucket: env.S3_BUCKET,
          Key: key,
        })
        const response = await s3Client.send(command)

        if (response.Body) {
          const chunks: Buffer[] = []
          for await (const chunk of response.Body as AsyncIterable<Buffer>) {
            chunks.push(chunk)
          }
          const buffer = Buffer.concat(chunks)
          archive.append(buffer, { name: key })
          successCount++
        }
      } catch (error) {
        logger.warn({ key, error }, 'Failed to backup file, skipping')
      }
    }
    logger.info({ successCount, totalKeys: keysArray.length }, 'Files downloaded from S3')
  }

  await archive.finalize()
  await new Promise<void>((resolve, reject) => {
    output.on('close', resolve)
    output.on('error', reject)
  })

  logger.info({ outputPath, fileCount: keysArray.length }, 'Files backup completed')
}

/**
 * Upload backup to S3
 */
async function uploadBackupToS3(localPath: string, s3Key: string): Promise<number> {
  const fileStats = await stat(localPath)
  const fileStream = createReadStream(localPath)
  const chunks: Buffer[] = []

  for await (const chunk of fileStream) {
    chunks.push(chunk)
  }

  const buffer = Buffer.concat(chunks)

  const command = new PutObjectCommand({
    Bucket: BACKUP_BUCKET,
    Key: s3Key,
    Body: buffer,
    ContentType: 'application/octet-stream',
  })

  await s3Client.send(command)
  logger.info({ s3Key, size: fileStats.size }, 'Backup uploaded to S3')

  return fileStats.size
}

/**
 * Create a full backup (database + files)
 */
export async function createFullBackup(
  performedBy: string,
  isAutomatic = false
): Promise<BackupResult> {
  await ensureTempDir()

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
  const backupId = `backup_${timestamp}`

  try {
    // Generate database dump
    const dbDumpPath = join(TEMP_DIR, `${backupId}_database.sql.gz`)
    await generateDatabaseDump(dbDumpPath)

    // Backup uploaded files
    const filesBackupPath = join(TEMP_DIR, `${backupId}_files.zip`)
    await backupUploadedFiles(filesBackupPath)

    // Create final archive containing both
    const finalBackupPath = join(TEMP_DIR, `${backupId}.tar.gz`)
    const output = createWriteStream(finalBackupPath)
    const archive = archiver('tar', { gzip: true, gzipOptions: { level: 9 } })

    archive.pipe(output)
    archive.file(dbDumpPath, { name: 'database.sql.gz' })
    archive.file(filesBackupPath, { name: 'files.zip' })

    // Add metadata
    const metadata = {
      id: backupId,
      createdAt: new Date().toISOString(),
      createdBy: performedBy,
      isAutomatic,
      version: '1.0',
    }
    archive.append(JSON.stringify(metadata, null, 2), { name: 'metadata.json' })

    await archive.finalize()
    await new Promise<void>((resolve) => output.on('close', resolve))

    // Upload to S3
    const s3Key = `${BACKUP_PREFIX}${backupId}.tar.gz`
    const size = await uploadBackupToS3(finalBackupPath, s3Key)

    // Log audit
    await createAuditLog({
      performedBy,
      action: 'BACKUP_CREATE',
      targetType: 'System',
      targetId: backupId,
      metadata: {
        type: 'full',
        size,
        isAutomatic,
      },
    })

    logger.info({ backupId, size, isAutomatic }, 'Full backup created successfully')

    return {
      id: backupId,
      filename: `${backupId}.tar.gz`,
      size,
      createdAt: new Date(),
    }
  } finally {
    await cleanupTempDir()
  }
}

/**
 * Create a database-only backup
 */
export async function createDatabaseBackup(
  performedBy: string,
  isAutomatic = false
): Promise<BackupResult> {
  await ensureTempDir()

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
  const backupId = `backup_db_${timestamp}`

  try {
    const dbDumpPath = join(TEMP_DIR, `${backupId}.sql.gz`)
    await generateDatabaseDump(dbDumpPath)

    const s3Key = `${BACKUP_PREFIX}${backupId}.sql.gz`
    const size = await uploadBackupToS3(dbDumpPath, s3Key)

    await createAuditLog({
      performedBy,
      action: 'BACKUP_CREATE',
      targetType: 'System',
      targetId: backupId,
      metadata: {
        type: 'database',
        size,
        isAutomatic,
      },
    })

    logger.info({ backupId, size }, 'Database backup created successfully')

    return {
      id: backupId,
      filename: `${backupId}.sql.gz`,
      size,
      createdAt: new Date(),
    }
  } finally {
    await cleanupTempDir()
  }
}

/**
 * List all backups from S3
 */
export async function listBackups(): Promise<BackupInfo[]> {
  const command = new ListObjectsV2Command({
    Bucket: BACKUP_BUCKET,
    Prefix: BACKUP_PREFIX,
  })

  const response = await s3Client.send(command)
  const backups: BackupInfo[] = []

  if (response.Contents) {
    for (const obj of response.Contents) {
      if (!obj.Key || !obj.Size || !obj.LastModified) continue

      const filename = obj.Key.replace(BACKUP_PREFIX, '')
      const id = filename.replace(/\.(tar\.gz|sql\.gz|zip)$/, '')

      let type: 'full' | 'database' | 'files' = 'full'
      if (filename.includes('_db_')) {
        type = 'database'
      } else if (filename.includes('_files_')) {
        type = 'files'
      }

      backups.push({
        id,
        filename,
        type,
        size: obj.Size,
        createdAt: obj.LastModified,
        isAutomatic: id.includes('auto'),
      })
    }
  }

  // Sort by date, newest first
  backups.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())

  return backups
}

/**
 * Get a signed download URL for a backup
 */
export async function getBackupDownloadUrl(backupId: string): Promise<string> {
  const backups = await listBackups()
  const backup = backups.find((b) => b.id === backupId)

  if (!backup) {
    throw { statusCode: 404, message: 'Sauvegarde introuvable', code: 'NOT_FOUND' }
  }

  const command = new GetObjectCommand({
    Bucket: BACKUP_BUCKET,
    Key: `${BACKUP_PREFIX}${backup.filename}`,
  })

  return getSignedUrl(s3Client, command, { expiresIn: 3600 })
}

/**
 * Delete a backup
 */
export async function deleteBackup(backupId: string, performedBy: string): Promise<void> {
  const backups = await listBackups()
  const backup = backups.find((b) => b.id === backupId)

  if (!backup) {
    throw { statusCode: 404, message: 'Sauvegarde introuvable', code: 'NOT_FOUND' }
  }

  const command = new DeleteObjectCommand({
    Bucket: BACKUP_BUCKET,
    Key: `${BACKUP_PREFIX}${backup.filename}`,
  })

  await s3Client.send(command)

  await createAuditLog({
    performedBy,
    action: 'BACKUP_DELETE',
    targetType: 'System',
    targetId: backupId,
    metadata: { filename: backup.filename },
  })

  logger.info({ backupId }, 'Backup deleted')
}

/**
 * Clean up old backups based on retention policy
 */
export async function cleanupOldBackups(): Promise<number> {
  const retentionDays = env.BACKUP_RETENTION_DAYS
  const cutoffDate = new Date()
  cutoffDate.setDate(cutoffDate.getDate() - retentionDays)

  const backups = await listBackups()
  let deletedCount = 0

  for (const backup of backups) {
    if (backup.createdAt < cutoffDate) {
      try {
        const command = new DeleteObjectCommand({
          Bucket: BACKUP_BUCKET,
          Key: `${BACKUP_PREFIX}${backup.filename}`,
        })
        await s3Client.send(command)
        deletedCount++
        logger.info({ backupId: backup.id, age: retentionDays }, 'Old backup deleted')
      } catch (error) {
        logger.error({ backupId: backup.id, error }, 'Failed to delete old backup')
      }
    }
  }

  return deletedCount
}

/**
 * Restore from a backup
 */
export async function restoreFromBackup(
  backupId: string,
  performedBy: string
): Promise<void> {
  const backups = await listBackups()
  const backup = backups.find((b) => b.id === backupId)

  if (!backup) {
    throw { statusCode: 404, message: 'Sauvegarde introuvable', code: 'NOT_FOUND' }
  }

  await ensureTempDir()

  try {
    // Download backup from S3
    const command = new GetObjectCommand({
      Bucket: BACKUP_BUCKET,
      Key: `${BACKUP_PREFIX}${backup.filename}`,
    })

    const response = await s3Client.send(command)
    if (!response.Body) {
      throw { statusCode: 500, message: 'Impossible de télécharger la sauvegarde' }
    }

    const localPath = join(TEMP_DIR, backup.filename)
    const writeStream = createWriteStream(localPath)

    for await (const chunk of response.Body as AsyncIterable<Buffer>) {
      writeStream.write(chunk)
    }
    writeStream.end()
    await new Promise<void>((resolve) => writeStream.on('finish', resolve))

    if (backup.type === 'database' || backup.filename.endsWith('.sql.gz')) {
      // Restore database
      await restoreDatabase(localPath)
    } else if (backup.type === 'full') {
      // Extract and restore both
      await restoreFullBackup(localPath)
    }

    await createAuditLog({
      performedBy,
      action: 'BACKUP_RESTORE',
      targetType: 'System',
      targetId: backupId,
      metadata: { filename: backup.filename, type: backup.type },
    })

    logger.info({ backupId }, 'Backup restored successfully')
  } finally {
    await cleanupTempDir()
  }
}

/**
 * Restore database from a .sql.gz file
 */
async function restoreDatabase(gzPath: string): Promise<void> {
  const { host, port, database, username, password } = parseDatabaseUrl()
  const sqlPath = gzPath.replace('.gz', '')

  // Decompress
  const readStream = createReadStream(gzPath)
  const writeStream = createWriteStream(sqlPath)
  const gunzip = createGunzip()

  await pipeline(readStream, gunzip, writeStream)

  // Restore
  const env = { ...process.env, PGPASSWORD: password }
  const command = `psql -h ${host} -p ${port} -U ${username} -d ${database} -f ${sqlPath}`

  logger.info('Restoring database...')
  const { stderr } = await execAsync(command, { env, maxBuffer: 500 * 1024 * 1024 })

  if (stderr && !stderr.includes('NOTICE') && !stderr.includes('already exists')) {
    logger.warn({ stderr }, 'psql stderr output')
  }

  logger.info('Database restored successfully')
}

/**
 * Restore from a full backup (tar.gz containing database and files)
 */
async function restoreFullBackup(tarGzPath: string): Promise<void> {
  const extractDir = join(TEMP_DIR, 'extracted')
  await mkdir(extractDir, { recursive: true })

  // Extract tar.gz
  await execAsync(`tar -xzf ${tarGzPath} -C ${extractDir}`)

  // Restore database
  const dbPath = join(extractDir, 'database.sql.gz')
  await restoreDatabase(dbPath)

  // Restore files
  const filesPath = join(extractDir, 'files.zip')
  await restoreFiles(filesPath)
}

/**
 * Restore uploaded files from a zip archive
 */
async function restoreFiles(zipPath: string): Promise<void> {
  const extractDir = join(TEMP_DIR, 'files')
  await mkdir(extractDir, { recursive: true })

  // Extract zip
  await execAsync(`unzip -o ${zipPath} -d ${extractDir}`)

  // Upload each file back to S3
  const files = await readdir(extractDir, { recursive: true, withFileTypes: true })

  for (const file of files) {
    if (!file.isFile()) continue

    const filePath = join(file.parentPath ?? '', file.name)
    const relativePath = filePath.replace(extractDir + '/', '')

    const fileStream = createReadStream(filePath)
    const chunks: Buffer[] = []

    for await (const chunk of fileStream) {
      chunks.push(chunk)
    }

    const buffer = Buffer.concat(chunks)

    const command = new PutObjectCommand({
      Bucket: env.S3_BUCKET,
      Key: relativePath,
      Body: buffer,
    })

    await s3Client.send(command)
  }

  logger.info('Files restored successfully')
}

/**
 * Generate a database backup for direct download (legacy support)
 */
export async function generateDatabaseBackup(performedBy: string): Promise<{
  filename: string
  content: string
  createdAt: Date
}> {
  const { host, port, database, username, password } = parseDatabaseUrl()
  const env = { ...process.env, PGPASSWORD: password }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
  const filename = `backup_${database}_${timestamp}.sql`

  const command = `pg_dump -h ${host} -p ${port} -U ${username} -d ${database} --no-owner --no-acl --clean --if-exists`

  const { stdout, stderr } = await execAsync(command, { env, maxBuffer: 100 * 1024 * 1024 })

  if (stderr && !stderr.includes('NOTICE')) {
    logger.warn({ stderr }, 'pg_dump stderr output')
  }

  await createAuditLog({
    performedBy,
    action: 'DATABASE_BACKUP',
    targetType: 'System',
    targetId: 'database',
    metadata: { filename, size: stdout.length },
  })

  return {
    filename,
    content: stdout,
    createdAt: new Date(),
  }
}

// src/services/file-compression.service.ts

import sharp from 'sharp'
import ffmpeg from 'fluent-ffmpeg'
import { exec } from 'child_process'
import { promisify } from 'util'
import fs from 'fs/promises'
import path from 'path'
import os from 'os'
import crypto from 'crypto'
import { logger } from '../utils/logger.js'

const execAsync = promisify(exec)

const IMAGE_MAX_WIDTH = 1200
const IMAGE_MAX_HEIGHT = 1200
const IMAGE_QUALITY_JPEG = 60
const IMAGE_QUALITY_WEBP = 60
const VIDEO_CRF = 28
const VIDEO_PRESET = 'medium'

interface CompressedFile {
  buffer: Buffer
  mimeType: string
  size: number
  newFilename?: string // New filename if format changed
}

export const compressFile = async (
  buffer: Buffer,
  mimeType: string,
  filename: string
): Promise<CompressedFile> => {
  if (mimeType.startsWith('image/')) {
    return compressImage(buffer, mimeType, filename)
  }

  if (mimeType.startsWith('video/')) {
    return compressVideo(buffer, filename)
  }

  if (mimeType === 'application/pdf') {
    return compressPdf(buffer)
  }

  return { buffer, mimeType, size: buffer.length }
}

/**
 * Check if a PNG image has actual transparency (alpha channel with non-opaque pixels)
 */
const hasTransparency = async (buffer: Buffer): Promise<boolean> => {
  try {
    const metadata = await sharp(buffer).metadata()

    // If no alpha channel, no transparency
    if (!metadata.hasAlpha) {
      return false
    }

    // Extract alpha channel and check if any pixel is not fully opaque
    const { data } = await sharp(buffer)
      .extractChannel('alpha')
      .raw()
      .toBuffer({ resolveWithObject: true })

    // Check if any alpha value is less than 255 (not fully opaque)
    for (let i = 0; i < data.length; i++) {
      if (data[i] < 255) {
        return true
      }
    }

    return false
  } catch {
    // If we can't determine, assume no transparency to allow conversion
    return false
  }
}

/**
 * Get filename with new extension
 */
const changeExtension = (filename: string, newExt: string): string => {
  const lastDot = filename.lastIndexOf('.')
  const baseName = lastDot > 0 ? filename.substring(0, lastDot) : filename
  return `${baseName}.${newExt}`
}

const compressImage = async (
  buffer: Buffer,
  mimeType: string,
  filename: string
): Promise<CompressedFile> => {
  try {
    // Use rotate() to strip EXIF/metadata, then resize
    const sharpInstance = sharp(buffer)
      .rotate() // Auto-rotate based on EXIF and strip metadata
      .resize(IMAGE_MAX_WIDTH, IMAGE_MAX_HEIGHT, {
        fit: 'inside',
        withoutEnlargement: true,
      })

    let outputMimeType = mimeType
    let outputBuffer: Buffer
    let newFilename: string | undefined

    if (mimeType === 'image/png') {
      // Check if PNG has transparency
      const transparent = await hasTransparency(buffer)

      if (transparent) {
        // Keep as PNG but compress
        outputBuffer = await sharpInstance.png({ compressionLevel: 9 }).toBuffer()
      } else {
        // Convert to WebP (better compression than JPEG, good quality)
        outputBuffer = await sharpInstance.webp({ quality: IMAGE_QUALITY_WEBP }).toBuffer()
        outputMimeType = 'image/webp'
        newFilename = changeExtension(filename, 'webp')
      }
    } else if (mimeType === 'image/webp') {
      outputBuffer = await sharpInstance.webp({ quality: IMAGE_QUALITY_WEBP }).toBuffer()
    } else if (mimeType === 'image/gif') {
      // Keep GIF as-is (animated GIFs would break if converted)
      outputBuffer = await sharpInstance.gif().toBuffer()
    } else {
      // JPEG and others -> JPEG with quality 90
      outputBuffer = await sharpInstance.jpeg({ quality: IMAGE_QUALITY_JPEG }).toBuffer()
      outputMimeType = 'image/jpeg'
      if (!filename.toLowerCase().endsWith('.jpg') && !filename.toLowerCase().endsWith('.jpeg')) {
        newFilename = changeExtension(filename, 'jpg')
      }
    }

    logger.info(
      {
        originalSize: buffer.length,
        compressedSize: outputBuffer.length,
        ratio: ((1 - outputBuffer.length / buffer.length) * 100).toFixed(1) + '%',
        formatChanged: newFilename ? `${filename} -> ${newFilename}` : 'no',
      },
      'Image compressed'
    )

    return {
      buffer: outputBuffer,
      mimeType: outputMimeType,
      size: outputBuffer.length,
      newFilename,
    }
  } catch (error) {
    logger.error({ error }, 'Image compression failed, using original')
    return { buffer, mimeType, size: buffer.length }
  }
}

const compressVideo = async (buffer: Buffer, filename: string): Promise<CompressedFile> => {
  const tempId = crypto.randomBytes(8).toString('hex')
  const tempDir = os.tmpdir()
  const inputPath = path.join(tempDir, `input-${tempId}-${filename}`)
  const outputPath = path.join(tempDir, `output-${tempId}.mp4`)

  try {
    await fs.writeFile(inputPath, buffer)

    await new Promise<void>((resolve, reject) => {
      ffmpeg(inputPath)
        .outputOptions([
          `-crf ${VIDEO_CRF}`,
          `-preset ${VIDEO_PRESET}`,
          '-c:v libx264',
          '-c:a aac',
          '-movflags +faststart',
        ])
        .output(outputPath)
        .on('end', () => resolve())
        .on('error', (err) => reject(err))
        .run()
    })

    const compressedBuffer = await fs.readFile(outputPath)

    // Change extension to .mp4 if not already
    const newFilename = filename.toLowerCase().endsWith('.mp4')
      ? undefined
      : changeExtension(filename, 'mp4')

    logger.info(
      {
        originalSize: buffer.length,
        compressedSize: compressedBuffer.length,
        ratio: ((1 - compressedBuffer.length / buffer.length) * 100).toFixed(1) + '%',
        formatChanged: newFilename ? `${filename} -> ${newFilename}` : 'no',
      },
      'Video compressed'
    )

    return {
      buffer: compressedBuffer,
      mimeType: 'video/mp4',
      size: compressedBuffer.length,
      newFilename,
    }
  } catch (error) {
    logger.error({ error }, 'Video compression failed, using original')
    return { buffer, mimeType: 'video/mp4', size: buffer.length }
  } finally {
    await fs.unlink(inputPath).catch(() => {})
    await fs.unlink(outputPath).catch(() => {})
  }
}

const compressPdf = async (buffer: Buffer): Promise<CompressedFile> => {
  const tempId = crypto.randomBytes(8).toString('hex')
  const tempDir = os.tmpdir()
  const inputPath = path.join(tempDir, `input-${tempId}.pdf`)
  const outputPath = path.join(tempDir, `output-${tempId}.pdf`)

  try {
    await fs.writeFile(inputPath, buffer)

    await execAsync(
      `gs -sDEVICE=pdfwrite -dCompatibilityLevel=1.4 -dPDFSETTINGS=/ebook -dNOPAUSE -dQUIET -dBATCH -sOutputFile="${outputPath}" "${inputPath}"`
    )

    const compressedBuffer = await fs.readFile(outputPath)

    if (compressedBuffer.length >= buffer.length) {
      return { buffer, mimeType: 'application/pdf', size: buffer.length }
    }

    logger.info(
      {
        originalSize: buffer.length,
        compressedSize: compressedBuffer.length,
        ratio: ((1 - compressedBuffer.length / buffer.length) * 100).toFixed(1) + '%',
      },
      'PDF compressed'
    )

    return {
      buffer: compressedBuffer,
      mimeType: 'application/pdf',
      size: compressedBuffer.length,
    }
  } catch (error) {
    logger.error({ error }, 'PDF compression failed, using original')
    return { buffer, mimeType: 'application/pdf', size: buffer.length }
  } finally {
    await fs.unlink(inputPath).catch(() => {})
    await fs.unlink(outputPath).catch(() => {})
  }
}

export const isCompressibleType = (mimeType: string): boolean => {
  return (
    mimeType.startsWith('image/') || mimeType.startsWith('video/') || mimeType === 'application/pdf'
  )
}

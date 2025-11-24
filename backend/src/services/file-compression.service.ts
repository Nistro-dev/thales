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

const IMAGE_MAX_WIDTH = 2000
const IMAGE_MAX_HEIGHT = 2000
const IMAGE_QUALITY = 80
const VIDEO_CRF = 28
const VIDEO_PRESET = 'medium'

interface CompressedFile {
  buffer: Buffer
  mimeType: string
  size: number
}

export const compressFile = async (
  buffer: Buffer,
  mimeType: string,
  filename: string
): Promise<CompressedFile> => {
  if (mimeType.startsWith('image/')) {
    return compressImage(buffer, mimeType)
  }

  if (mimeType.startsWith('video/')) {
    return compressVideo(buffer, filename)
  }

  if (mimeType === 'application/pdf') {
    return compressPdf(buffer)
  }

  return { buffer, mimeType, size: buffer.length }
}

const compressImage = async (buffer: Buffer, mimeType: string): Promise<CompressedFile> => {
  try {
    const sharpInstance = sharp(buffer).resize(IMAGE_MAX_WIDTH, IMAGE_MAX_HEIGHT, {
      fit: 'inside',
      withoutEnlargement: true,
    })

    let outputMimeType = mimeType
    let outputBuffer: Buffer

    if (mimeType === 'image/png') {
      outputBuffer = await sharpInstance.png({ quality: IMAGE_QUALITY }).toBuffer()
    } else if (mimeType === 'image/webp') {
      outputBuffer = await sharpInstance.webp({ quality: IMAGE_QUALITY }).toBuffer()
    } else {
      outputBuffer = await sharpInstance.jpeg({ quality: IMAGE_QUALITY }).toBuffer()
      outputMimeType = 'image/jpeg'
    }

    logger.info(
      {
        originalSize: buffer.length,
        compressedSize: outputBuffer.length,
        ratio: ((1 - outputBuffer.length / buffer.length) * 100).toFixed(1) + '%',
      },
      'Image compressed'
    )

    return {
      buffer: outputBuffer,
      mimeType: outputMimeType,
      size: outputBuffer.length,
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

    logger.info(
      {
        originalSize: buffer.length,
        compressedSize: compressedBuffer.length,
        ratio: ((1 - compressedBuffer.length / buffer.length) * 100).toFixed(1) + '%',
      },
      'Video compressed'
    )

    return {
      buffer: compressedBuffer,
      mimeType: 'video/mp4',
      size: compressedBuffer.length,
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

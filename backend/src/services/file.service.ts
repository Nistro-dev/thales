import { randomUUID } from "crypto";
import { prisma } from "../utils/prisma.js";
import {
  uploadFile,
  deleteFile,
  getSignedDownloadUrl,
  logger,
} from "../utils/index.js";
import { compressFile, isCompressibleType } from "./file-compression.service.js";

interface UploadedFile {
  id: string;
  filename: string;
  mimeType: string;
  size: number;
  url: string;
  createdAt: Date;
}

interface FileListItem {
  id: string;
  filename: string;
  mimeType: string;
  size: number;
  createdAt: Date;
}

export const upload = async (
  userId: string,
  filename: string,
  mimeType: string,
  buffer: Buffer
): Promise<UploadedFile> => {
  let finalBuffer = buffer;
  let finalMimeType = mimeType;
  let finalFilename = filename;
  const originalSize = buffer.length;

  // Compress file if applicable (images, videos, PDFs)
  if (isCompressibleType(mimeType)) {
    const compressed = await compressFile(buffer, mimeType, filename);
    finalBuffer = compressed.buffer;
    finalMimeType = compressed.mimeType;
    if (compressed.newFilename) {
      finalFilename = compressed.newFilename;
    }
  }

  const key = `${userId}/${randomUUID()}-${finalFilename}`;

  await uploadFile(key, finalBuffer, finalMimeType);

  const file = await prisma.file.create({
    data: {
      filename: finalFilename,
      mimeType: finalMimeType,
      size: finalBuffer.length,
      key,
      userId,
    },
  });

  const url = await getSignedDownloadUrl(key);

  logger.info(
    {
      fileId: file.id,
      userId,
      originalSize,
      compressedSize: finalBuffer.length,
      compressionRatio: ((1 - finalBuffer.length / originalSize) * 100).toFixed(1) + '%',
    },
    "File uploaded"
  );

  return {
    id: file.id,
    filename: file.filename,
    mimeType: file.mimeType,
    size: file.size,
    url,
    createdAt: file.createdAt,
  };
};

export const list = async (userId: string): Promise<FileListItem[]> => {
  const files = await prisma.file.findMany({
    where: { userId },
    select: {
      id: true,
      filename: true,
      mimeType: true,
      size: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return files;
};

export const getDownloadUrl = async (
  userId: string,
  fileId: string
): Promise<string> => {
  const file = await prisma.file.findFirst({
    where: { id: fileId, userId },
  });

  if (!file) {
    throw { statusCode: 404, message: "Fichier introuvable" };
  }

  return getSignedDownloadUrl(file.key);
};

export const remove = async (userId: string, fileId: string): Promise<void> => {
  const file = await prisma.file.findFirst({
    where: { id: fileId, userId },
  });

  if (!file) {
    throw { statusCode: 404, message: "Fichier introuvable" };
  }

  await deleteFile(file.key);

  await prisma.file.delete({
    where: { id: file.id },
  });

  logger.info({ fileId, userId }, "File deleted");
};

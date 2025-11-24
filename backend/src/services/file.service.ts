import { randomUUID } from "crypto";
import { prisma } from "../utils/prisma.js";
import {
  uploadFile,
  deleteFile,
  getSignedDownloadUrl,
  logger,
} from "../utils/index.js";

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
  const key = `${userId}/${randomUUID()}-${filename}`;

  await uploadFile(key, buffer, mimeType);

  const file = await prisma.file.create({
    data: {
      filename,
      mimeType,
      size: buffer.length,
      key,
      userId,
    },
  });

  const url = await getSignedDownloadUrl(key);

  logger.info({ fileId: file.id, userId }, "File uploaded");

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
    throw { statusCode: 404, message: "File not found" };
  }

  return getSignedDownloadUrl(file.key);
};

export const remove = async (userId: string, fileId: string): Promise<void> => {
  const file = await prisma.file.findFirst({
    where: { id: fileId, userId },
  });

  if (!file) {
    throw { statusCode: 404, message: "File not found" };
  }

  await deleteFile(file.key);

  await prisma.file.delete({
    where: { id: file.id },
  });

  logger.info({ fileId, userId }, "File deleted");
};

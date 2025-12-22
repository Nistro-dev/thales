import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { env } from "../config/env.js";
import { logger } from "./logger.js";

const s3Client = new S3Client({
  endpoint: env.S3_ENDPOINT,
  region: env.S3_REGION,
  credentials: {
    accessKeyId: env.S3_ACCESS_KEY,
    secretAccessKey: env.S3_SECRET_KEY,
  },
  forcePathStyle: true,
});

export const uploadFile = async (
  key: string,
  body: Buffer,
  mimeType: string
): Promise<void> => {
  const command = new PutObjectCommand({
    Bucket: env.S3_BUCKET,
    Key: key,
    Body: body,
    ContentType: mimeType,
  });

  await s3Client.send(command);
  logger.info({ key }, "File uploaded to S3");
};

export const deleteFile = async (key: string): Promise<void> => {
  const command = new DeleteObjectCommand({
    Bucket: env.S3_BUCKET,
    Key: key,
  });

  await s3Client.send(command);
  logger.info({ key }, "File deleted from S3");
};

export const getSignedDownloadUrl = async (
  key: string,
  expiresIn = 3600
): Promise<string> => {
  const command = new GetObjectCommand({
    Bucket: env.S3_BUCKET,
    Key: key,
  });

  return getSignedUrl(s3Client, command, { expiresIn });
};

// Alias pour compatibilité
export const uploadToS3 = uploadFile
export const deleteFromS3 = deleteFile
export const generatePresignedUrl = getSignedDownloadUrl
export { getSignedUrl } from '@aws-sdk/s3-request-presigner'

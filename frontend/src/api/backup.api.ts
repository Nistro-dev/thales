import { apiClient } from "./client";
import type { ApiResponse } from "@/types";

export interface BackupInfo {
  id: string;
  filename: string;
  type: "full" | "database" | "files";
  size: number;
  createdAt: string;
  createdBy?: string;
  isAutomatic: boolean;
}

export interface BackupResult {
  id: string;
  filename: string;
  size: number;
  createdAt: string;
}

/**
 * List all backups
 */
export async function listBackups(): Promise<BackupInfo[]> {
  const response =
    await apiClient.get<ApiResponse<BackupInfo[]>>("/backup/list");
  return response.data.data ?? [];
}

/**
 * Create a new backup
 */
export async function createBackup(
  type: "full" | "database" = "full",
): Promise<BackupResult> {
  const response = await apiClient.post<ApiResponse<BackupResult>>(
    "/backup/create",
    { type },
  );
  return response.data.data!;
}

/**
 * Get download URL for a backup
 */
export async function getBackupDownloadUrl(id: string): Promise<string> {
  const response = await apiClient.get<ApiResponse<{ url: string }>>(
    `/backup/${id}/download`,
  );
  return response.data.data!.url;
}

/**
 * Download a backup file
 */
export async function downloadBackup(id: string): Promise<void> {
  const url = await getBackupDownloadUrl(id);

  // Open the download URL in a new tab
  window.open(url, "_blank");
}

/**
 * Delete a backup
 */
export async function deleteBackup(id: string): Promise<void> {
  await apiClient.delete(`/backup/${id}`);
}

/**
 * Restore from a backup
 */
export async function restoreBackup(id: string): Promise<void> {
  await apiClient.post(`/backup/${id}/restore`);
}

/**
 * Download database backup (legacy - direct download)
 */
export async function downloadDatabaseBackup(): Promise<void> {
  const response = await apiClient.get("/backup/database", {
    responseType: "blob",
  });

  // Get filename from Content-Disposition header or use default
  const contentDisposition = response.headers["content-disposition"];
  let filename = "backup.sql";

  if (contentDisposition) {
    const match = contentDisposition.match(/filename="?([^"]+)"?/);
    if (match) {
      filename = match[1];
    }
  }

  // Create download link
  const blob = new Blob([response.data], { type: "application/sql" });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}

export const backupApi = {
  list: listBackups,
  create: createBackup,
  getDownloadUrl: getBackupDownloadUrl,
  download: downloadBackup,
  delete: deleteBackup,
  restore: restoreBackup,
  downloadDatabase: downloadDatabaseBackup,
};

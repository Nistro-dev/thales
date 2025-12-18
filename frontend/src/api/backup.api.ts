import { apiClient } from "./client";

/**
 * Download database backup
 * Returns a blob for file download
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
  downloadDatabase: downloadDatabaseBackup,
};

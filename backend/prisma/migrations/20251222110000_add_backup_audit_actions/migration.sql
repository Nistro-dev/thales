-- Add new AuditAction enum values for Backup
ALTER TYPE "AuditAction" ADD VALUE 'BACKUP_CREATE';
ALTER TYPE "AuditAction" ADD VALUE 'BACKUP_DELETE';
ALTER TYPE "AuditAction" ADD VALUE 'BACKUP_RESTORE';

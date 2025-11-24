import { useState, useEffect, useRef } from 'react'
import { useAuthStore } from '@/store/auth'
import { useAuth, useToast } from '@/hooks'
import { fileService } from '@/services/files'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Upload, Trash2, Download, LogOut } from 'lucide-react'
import type { FileItem } from '@/types'

export const Dashboard = () => {
  const user = useAuthStore((state) => state.user)
  const { logout } = useAuth()
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const [files, setFiles] = useState<FileItem[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isUploading, setIsUploading] = useState(false)

  const loadFiles = async () => {
    setIsLoading(true)
    try {
      const data = await fileService.list()
      setFiles(data)
    } catch {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to load files',
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadFiles()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    try {
      await fileService.upload(file)
      toast({
        title: 'Success',
        description: 'File uploaded successfully',
      })
      loadFiles()
    } catch {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to upload file',
      })
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleDownload = async (file: FileItem) => {
    try {
      const url = await fileService.getDownloadUrl(file.id)
      window.open(url, '_blank')
    } catch {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to get download link',
      })
    }
  }

  const handleDelete = async (file: FileItem) => {
    if (!confirm(`Delete ${file.filename}?`)) return

    try {
      await fileService.remove(file.id)
      toast({
        title: 'Success',
        description: 'File deleted successfully',
      })
      loadFiles()
    } catch {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to delete file',
      })
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-xl font-semibold">Dashboard</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">
              {user?.firstName} {user?.lastName}
            </span>
            <Button variant="ghost" size="icon" onClick={logout}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Files</CardTitle>
                <CardDescription>Manage your uploaded files</CardDescription>
              </div>
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  onChange={handleUpload}
                />
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  {isUploading ? 'Uploading...' : 'Upload'}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-center text-muted-foreground py-8">Loading...</p>
            ) : files.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No files uploaded yet</p>
            ) : (
              <div className="space-y-2">
                {files.map((file) => (
                  <div
                    key={file.id}
                    className="flex items-center justify-between p-3 rounded-md border"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{file.filename}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatFileSize(file.size)} • {new Date(file.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDownload(file)}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(file)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
import { useState, useMemo } from 'react'
import {
  Trash2,
  Eye,
  EyeOff,
  GripVertical,
  Image,
  File,
  FileVideo,
  Loader2,
  Pencil,
  Check,
  X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { cn } from '@/lib/utils'
import {
  useDeleteProductFile,
  useUpdateFileVisibility,
  useReorderProductFiles,
  useRenameProductFile,
} from '../hooks/useProductsAdmin'
import type { ProductFile, FileVisibility } from '@/types'

interface ProductFilesListProps {
  productId: string
  files: ProductFile[]
  isLoading?: boolean
  canEdit?: boolean
}

function getFileIcon(mimeType: string) {
  if (mimeType.startsWith('image/')) return Image
  if (mimeType.startsWith('video/')) return FileVideo
  return File
}

export function ProductFilesList({
  productId,
  files,
  isLoading,
  canEdit = true,
}: ProductFilesListProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedFile, setSelectedFile] = useState<ProductFile | null>(null)
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)
  const [editingFileId, setEditingFileId] = useState<string | null>(null)
  const [editingFilename, setEditingFilename] = useState('')

  const deleteFile = useDeleteProductFile()
  const updateVisibility = useUpdateFileVisibility()
  const reorderFiles = useReorderProductFiles()
  const renameFile = useRenameProductFile()

  const handleDeleteClick = (file: ProductFile) => {
    setSelectedFile(file)
    setDeleteDialogOpen(true)
  }

  const confirmDelete = async () => {
    if (!selectedFile) return
    try {
      await deleteFile.mutateAsync({ productId, fileId: selectedFile.id })
      setDeleteDialogOpen(false)
      setSelectedFile(null)
    } catch {
      // Error handled in hook
    }
  }

  const toggleVisibility = async (file: ProductFile) => {
    const newVisibility: FileVisibility = file.visibility === 'PUBLIC' ? 'ADMIN' : 'PUBLIC'
    await updateVisibility.mutateAsync({
      productId,
      fileId: file.id,
      visibility: newVisibility,
    })
  }

  // Helper to get filename without extension
  const getBaseName = (filename: string) => {
    const lastDot = filename.lastIndexOf('.')
    return lastDot > 0 ? filename.substring(0, lastDot) : filename
  }

  // Helper to get extension
  const getExtension = (filename: string) => {
    const lastDot = filename.lastIndexOf('.')
    return lastDot > 0 ? filename.substring(lastDot) : ''
  }

  const startRename = (file: ProductFile) => {
    setEditingFileId(file.id)
    // Only edit the base name, not the extension
    setEditingFilename(getBaseName(file.filename))
  }

  const cancelRename = () => {
    setEditingFileId(null)
    setEditingFilename('')
  }

  const confirmRename = async (fileId: string) => {
    if (!editingFilename.trim()) {
      cancelRename()
      return
    }
    // Find the original file to get its extension
    const originalFile = files.find(f => f.id === fileId)
    if (!originalFile) {
      cancelRename()
      return
    }
    const extension = getExtension(originalFile.filename)
    const newFilename = editingFilename.trim() + extension

    try {
      await renameFile.mutateAsync({
        productId,
        fileId,
        filename: newFilename,
      })
      setEditingFileId(null)
      setEditingFilename('')
    } catch {
      // Error handled in hook
    }
  }

  const handleRenameKeyDown = (e: React.KeyboardEvent, fileId: string) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      confirmRename(fileId)
    } else if (e.key === 'Escape') {
      cancelRename()
    }
  }

  // Compute preview order when dragging
  const previewFiles = useMemo(() => {
    if (draggedIndex === null || dragOverIndex === null || draggedIndex === dragOverIndex) {
      return files
    }
    const newFiles = [...files]
    const [draggedFile] = newFiles.splice(draggedIndex, 1)
    newFiles.splice(dragOverIndex, 0, draggedFile)
    return newFiles
  }, [files, draggedIndex, dragOverIndex])

  // Drag and drop handlers
  const handleDragStart = (index: number) => {
    setDraggedIndex(index)
    setDragOverIndex(index)
  }

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    if (draggedIndex === null) return
    setDragOverIndex(index)
  }

  const handleDrop = async (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault()
    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null)
      setDragOverIndex(null)
      return
    }

    // Reorder files
    const newFiles = [...files]
    const [draggedFile] = newFiles.splice(draggedIndex, 1)
    newFiles.splice(dropIndex, 0, draggedFile)

    const newOrder = newFiles.map((f) => f.id)
    await reorderFiles.mutateAsync({ productId, fileIds: newOrder })
    setDraggedIndex(null)
    setDragOverIndex(null)
  }

  const handleDragEnd = () => {
    setDraggedIndex(null)
    setDragOverIndex(null)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (files.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
        Aucun fichier
      </div>
    )
  }

  // Find the original index of a file by its id
  const getOriginalIndex = (fileId: string) => files.findIndex((f) => f.id === fileId)

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
        {previewFiles.map((file, index) => {
          const FileIcon = getFileIcon(file.mimeType)
          const isImage = file.mimeType.startsWith('image/')
          const originalIndex = getOriginalIndex(file.id)
          const isDragging = draggedIndex === originalIndex
          const isEditing = editingFileId === file.id
          const isBeingMoved = draggedIndex !== null && dragOverIndex !== null && draggedIndex !== dragOverIndex && isDragging

          return (
            <div
              key={file.id}
              draggable={canEdit && !isEditing}
              onDragStart={() => handleDragStart(originalIndex)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDrop={(e) => handleDrop(e, dragOverIndex ?? index)}
              onDragEnd={handleDragEnd}
              className={cn(
                'group relative rounded-lg border bg-card overflow-hidden transition-all duration-200',
                isDragging && 'opacity-50 scale-95',
                isBeingMoved && 'ring-2 ring-primary ring-offset-2',
                canEdit && !isEditing && 'cursor-move'
              )}
            >
              {/* Preview */}
              <div className="aspect-square bg-muted flex items-center justify-center relative">
                {isImage && file.url ? (
                  <img
                    src={file.url}
                    alt={file.filename}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <FileIcon className="h-12 w-12 text-muted-foreground" />
                )}

                {/* Drag handle overlay */}
                {canEdit && !isEditing && (
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                    <GripVertical className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                )}

                {/* Visibility badge */}
                <Badge
                  variant={file.visibility === 'PUBLIC' ? 'default' : 'secondary'}
                  className="absolute top-2 left-2"
                >
                  {file.visibility === 'PUBLIC' ? (
                    <>
                      <Eye className="h-3 w-3 mr-1" />
                      Public
                    </>
                  ) : (
                    <>
                      <EyeOff className="h-3 w-3 mr-1" />
                      Admin
                    </>
                  )}
                </Badge>
              </div>

              {/* File info and actions */}
              <div className="p-2 min-w-0">
                {isEditing ? (
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-0">
                      <Input
                        value={editingFilename}
                        onChange={(e) => setEditingFilename(e.target.value)}
                        onKeyDown={(e) => handleRenameKeyDown(e, file.id)}
                        className="h-7 text-sm rounded-r-none min-w-0 flex-1"
                        autoFocus
                      />
                      <span className="h-7 px-1 flex items-center bg-muted border border-l-0 rounded-r-md text-xs text-muted-foreground shrink-0">
                        {getExtension(file.filename)}
                      </span>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 flex-1 text-green-600 hover:text-green-700"
                        onClick={() => confirmRename(file.id)}
                        disabled={renameFile.isPending}
                      >
                        <Check className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 flex-1"
                        onClick={cancelRename}
                        disabled={renameFile.isPending}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-1 min-w-0">
                    <p
                      className="text-sm truncate flex-1 min-w-0 cursor-pointer hover:text-primary"
                      title={file.filename}
                      onClick={() => canEdit && startRename(file)}
                    >
                      {file.filename}
                    </p>
                    {canEdit && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 shrink-0 opacity-0 group-hover:opacity-100"
                        onClick={() => startRename(file)}
                      >
                        <Pencil className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                )}
                <p className="text-xs text-muted-foreground">
                  {(file.size / 1024).toFixed(0)} Ko
                </p>

                {canEdit && !isEditing && (
                  <div className="flex gap-1 mt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 h-7 text-xs px-1"
                      onClick={() => toggleVisibility(file)}
                      disabled={updateVisibility.isPending}
                    >
                      {file.visibility === 'PUBLIC' ? (
                        <>
                          <EyeOff className="h-3 w-3 sm:mr-1" />
                          <span className="hidden sm:inline">Masquer</span>
                        </>
                      ) : (
                        <>
                          <Eye className="h-3 w-3 sm:mr-1" />
                          <span className="hidden sm:inline">Afficher</span>
                        </>
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 w-7 p-0 shrink-0 text-destructive hover:text-destructive"
                      onClick={() => handleDeleteClick(file)}
                      disabled={deleteFile.isPending}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Delete confirmation dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer le fichier</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer{' '}
              <strong>{selectedFile?.filename}</strong> ? Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteFile.isPending}>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={deleteFile.isPending}
              className="bg-destructive hover:bg-destructive/90"
            >
              {deleteFile.isPending ? 'Suppression...' : 'Supprimer'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

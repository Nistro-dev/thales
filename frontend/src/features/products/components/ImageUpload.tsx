import { useState, useRef, useCallback } from 'react'
import { Upload, Loader2, X, Image as ImageIcon, File, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useUploadProductFile } from '../hooks/useProductsAdmin'

interface ImageUploadProps {
  productId: string
  onUploadComplete?: () => void
  maxSizeMB?: number
  acceptedTypes?: string[]
}

const DEFAULT_ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf', 'video/mp4']
const DEFAULT_MAX_SIZE_MB = 50

export function ImageUpload({
  productId,
  onUploadComplete,
  maxSizeMB = DEFAULT_MAX_SIZE_MB,
  acceptedTypes = DEFAULT_ACCEPTED_TYPES,
}: ImageUploadProps) {
  const [isDragOver, setIsDragOver] = useState(false)
  const [previewFiles, setPreviewFiles] = useState<Array<{ file: File; preview: string | null }>>([])
  const [uploadError, setUploadError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const uploadFile = useUploadProductFile()

  const validateFile = useCallback(
    (file: File): string | null => {
      if (!acceptedTypes.includes(file.type)) {
        return `Type de fichier non supporté: ${file.type}`
      }
      if (file.size > maxSizeMB * 1024 * 1024) {
        return `Le fichier est trop volumineux (max ${maxSizeMB}MB)`
      }
      return null
    },
    [acceptedTypes, maxSizeMB]
  )

  const processFiles = useCallback(
    (fileList: FileList | File[]) => {
      const files = Array.from(fileList)
      const validFiles: Array<{ file: File; preview: string | null }> = []

      for (const file of files) {
        const error = validateFile(file)
        if (error) {
          setUploadError(error)
          continue
        }

        // Create preview for images
        let preview: string | null = null
        if (file.type.startsWith('image/')) {
          preview = URL.createObjectURL(file)
        }

        validFiles.push({ file, preview })
      }

      if (validFiles.length > 0) {
        setPreviewFiles((prev) => [...prev, ...validFiles])
        setUploadError(null)
      }
    },
    [validateFile]
  )

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    processFiles(e.dataTransfer.files)
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      processFiles(e.target.files)
    }
  }

  const removePreviewFile = (index: number) => {
    setPreviewFiles((prev) => {
      const newFiles = [...prev]
      const removed = newFiles.splice(index, 1)[0]
      if (removed.preview) {
        URL.revokeObjectURL(removed.preview)
      }
      return newFiles
    })
  }

  const uploadAllFiles = async () => {
    for (const { file, preview } of previewFiles) {
      try {
        await uploadFile.mutateAsync({ productId, file })
        // Remove from preview after successful upload
        if (preview) {
          URL.revokeObjectURL(preview)
        }
      } catch {
        // Error handled in hook
        return
      }
    }
    setPreviewFiles([])
    onUploadComplete?.()
  }

  const acceptString = acceptedTypes.join(',')

  return (
    <div className="space-y-4">
      {/* Drop zone */}
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          'border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors',
          isDragOver
            ? 'border-primary bg-primary/5'
            : 'border-muted-foreground/25 hover:border-primary/50'
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept={acceptString}
          multiple
          onChange={handleFileSelect}
          className="hidden"
        />

        <Upload className="h-10 w-10 mx-auto text-muted-foreground" />
        <p className="mt-2 text-sm text-muted-foreground">
          Glissez-déposez des fichiers ici ou cliquez pour sélectionner
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          Images (JPG, PNG, WebP, GIF), PDF, Vidéos (MP4) - Max {maxSizeMB}MB
        </p>
      </div>

      {/* Error message */}
      {uploadError && (
        <div className="flex items-center gap-2 text-sm text-destructive">
          <AlertCircle className="h-4 w-4" />
          {uploadError}
        </div>
      )}

      {/* Preview files */}
      {previewFiles.length > 0 && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {previewFiles.map(({ file, preview }, index) => (
              <div key={index} className="relative group">
                <div className="aspect-square rounded-lg border bg-muted overflow-hidden">
                  {preview ? (
                    <img
                      src={preview}
                      alt={file.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center p-2">
                      {file.type.includes('pdf') ? (
                        <File className="h-8 w-8 text-muted-foreground" />
                      ) : (
                        <ImageIcon className="h-8 w-8 text-muted-foreground" />
                      )}
                      <span className="text-xs text-muted-foreground mt-1 truncate max-w-full">
                        {file.name}
                      </span>
                    </div>
                  )}
                </div>

                <Button
                  variant="destructive"
                  size="icon"
                  className="absolute -top-2 -right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => removePreviewFile(index)}
                >
                  <X className="h-3 w-3" />
                </Button>

                <p className="text-xs text-muted-foreground mt-1 truncate">
                  {(file.size / 1024).toFixed(0)} Ko
                </p>
              </div>
            ))}
          </div>

          <Button
            onClick={uploadAllFiles}
            disabled={uploadFile.isPending}
            className="w-full"
          >
            {uploadFile.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Upload en cours...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Uploader {previewFiles.length} fichier{previewFiles.length > 1 ? 's' : ''}
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  )
}

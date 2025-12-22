import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { QRScanner } from '@/components/QRScanner'
import { scanApi } from '@/api/reservations.api'
import { Loader2, AlertCircle } from 'lucide-react'

interface QRScannerDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function QRScannerDialog({ open, onOpenChange }: QRScannerDialogProps) {
  const navigate = useNavigate()
  const [isScanning, setIsScanning] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleScan = async (qrCode: string) => {
    setIsScanning(true)
    setError(null)

    try {
      const response = await scanApi.scan(qrCode.trim())
      const reservation = response.data.data?.reservation

      if (reservation) {
        onOpenChange(false)
        // Navigate to reservation detail page
        navigate(`/admin/reservations/${reservation.id}`)
      } else {
        setError('Réservation non trouvée')
      }
    } catch (err: unknown) {
      const error = err as Error & { response?: { data?: { message?: string } } }
      setError(error.response?.data?.message || 'Erreur lors du scan du QR code')
    } finally {
      setIsScanning(false)
    }
  }

  const handleClose = () => {
    if (!isScanning) {
      setError(null)
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="w-[calc(100vw-2rem)] max-w-sm p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle>Scanner QR Code</DialogTitle>
          <DialogDescription>
            Scannez le QR code d'une réservation
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {isScanning ? (
            <div className="flex flex-col items-center justify-center py-8 gap-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Recherche de la réservation...</p>
            </div>
          ) : (
            <QRScanner
              onScan={handleScan}
              isActive={open && !isScanning}
            />
          )}

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

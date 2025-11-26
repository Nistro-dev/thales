import { useState } from 'react'
import { scanApi } from '@/api/reservations.api'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { QrCode, Scan, CheckCircle, RotateCcw, Loader2, AlertCircle, UserCircle, Package, Calendar } from 'lucide-react'
import type { Reservation, ReservationStatus } from '@/types'
import { useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'

const statusLabels: Record<ReservationStatus, string> = {
  PENDING: 'En attente',
  CONFIRMED: 'Confirmée',
  CHECKED_OUT: 'En cours',
  COMPLETED: 'Terminée',
  CANCELLED: 'Annulée',
  REFUNDED: 'Remboursée',
}

const statusColors: Record<ReservationStatus, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  PENDING: 'secondary',
  CONFIRMED: 'default',
  CHECKED_OUT: 'default',
  COMPLETED: 'outline',
  CANCELLED: 'destructive',
  REFUNDED: 'outline',
}

export function QRScannerPage() {
  const [qrCode, setQrCode] = useState('')
  const [isScanning, setIsScanning] = useState(false)
  const [scannedReservation, setScannedReservation] = useState<Reservation | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)

  const queryClient = useQueryClient()

  const handleScan = async () => {
    if (!qrCode.trim()) {
      setError('Veuillez entrer un code QR')
      return
    }

    setIsScanning(true)
    setError(null)
    setScannedReservation(null)

    try {
      const response = await scanApi.scan(qrCode.trim())
      setScannedReservation(response.data.data?.reservation || null)
      setQrCode('') // Clear input after successful scan
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors du scan du QR code')
      setScannedReservation(null)
    } finally {
      setIsScanning(false)
    }
  }

  const handleCheckout = async () => {
    if (!scannedReservation) return

    const notes = prompt('Notes pour le retrait (optionnel):')
    if (notes === null) return // User clicked cancel

    setIsProcessing(true)
    try {
      await scanApi.checkout(scannedReservation.qrCode!, notes || undefined)
      toast.success('Produit retiré avec succès')
      queryClient.invalidateQueries({ queryKey: ['admin-reservations'] })
      setScannedReservation(null)
      setQrCode('')
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Erreur lors du retrait')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleReturn = async () => {
    if (!scannedReservation) return

    const condition = prompt(
      'État du matériel:\n1 = OK\n2 = Dommages mineurs\n3 = Dommages majeurs\n4 = Pièces manquantes\n5 = Cassé\n\nEntrez le numéro (1-5):'
    )
    if (condition === null) return // User clicked cancel

    const conditionMap: Record<string, 'OK' | 'MINOR_DAMAGE' | 'MAJOR_DAMAGE' | 'MISSING_PARTS' | 'BROKEN'> = {
      '1': 'OK',
      '2': 'MINOR_DAMAGE',
      '3': 'MAJOR_DAMAGE',
      '4': 'MISSING_PARTS',
      '5': 'BROKEN',
    }

    const conditionValue = conditionMap[condition]
    if (!conditionValue) {
      toast.error('État invalide. Veuillez entrer un numéro entre 1 et 5.')
      return
    }

    const notes = prompt('Notes pour le retour (optionnel):')
    if (notes === null) return // User clicked cancel

    setIsProcessing(true)
    try {
      await scanApi.return(scannedReservation.qrCode!, {
        condition: conditionValue,
        notes: notes || undefined,
      })
      toast.success('Produit retourné avec succès')
      queryClient.invalidateQueries({ queryKey: ['admin-reservations'] })
      setScannedReservation(null)
      setQrCode('')
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Erreur lors du retour')
    } finally {
      setIsProcessing(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
  }

  const calculateDuration = (startDate: string, endDate: string) => {
    const start = new Date(startDate)
    const end = new Date(endDate)
    const diffTime = Math.abs(end.getTime() - start.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  const canCheckout = scannedReservation?.status === 'CONFIRMED'
  const canReturn = scannedReservation?.status === 'CHECKED_OUT'
  const canPerformAction = canCheckout || canReturn

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Scanner QR</h1>
        <p className="text-muted-foreground">
          Scannez un QR code de réservation pour effectuer un retrait ou un retour
        </p>
      </div>

      {/* Scanner Input */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <QrCode className="h-5 w-5" />
            Scanner le QR code
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <Label htmlFor="qrCode">Code QR</Label>
              <Input
                id="qrCode"
                type="text"
                placeholder="Entrez ou scannez le code QR..."
                value={qrCode}
                onChange={(e) => setQrCode(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleScan()
                  }
                }}
                disabled={isScanning || isProcessing}
                autoFocus
              />
            </div>
            <div className="flex items-end">
              <Button
                onClick={handleScan}
                disabled={isScanning || isProcessing || !qrCode.trim()}
              >
                {isScanning ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Scan...
                  </>
                ) : (
                  <>
                    <Scan className="mr-2 h-4 w-4" />
                    Scanner
                  </>
                )}
              </Button>
            </div>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Scanned Reservation Details */}
      {scannedReservation && (
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Product Info */}
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    Produit
                  </CardTitle>
                  <Badge variant={statusColors[scannedReservation.status]}>
                    {statusLabels[scannedReservation.status]}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <h3 className="font-semibold text-lg">
                  {scannedReservation.product?.name || 'Produit'}
                </h3>
                {scannedReservation.product?.reference && (
                  <p className="text-sm text-muted-foreground">
                    Référence: {scannedReservation.product.reference}
                  </p>
                )}
                {scannedReservation.product?.description && (
                  <>
                    <Separator />
                    <p className="text-sm text-muted-foreground">
                      {scannedReservation.product.description}
                    </p>
                  </>
                )}
              </CardContent>
            </Card>

            {/* User Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserCircle className="h-5 w-5" />
                  Utilisateur
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {scannedReservation.user && (
                  <>
                    <div>
                      <p className="text-sm font-medium">Nom</p>
                      <p className="text-muted-foreground">
                        {scannedReservation.user.firstName} {scannedReservation.user.lastName}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Email</p>
                      <p className="text-muted-foreground">{scannedReservation.user.email}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Crédits disponibles</p>
                      <p className="text-muted-foreground">{scannedReservation.user.credits} crédits</p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Dates & Duration */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Dates
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium">Date de sortie</p>
                    <p className="text-muted-foreground">{formatDate(scannedReservation.startDate)}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Date de retour</p>
                    <p className="text-muted-foreground">{formatDate(scannedReservation.endDate)}</p>
                  </div>
                </div>

                <Separator />

                <div className="flex justify-between">
                  <span className="text-sm font-medium">Durée</span>
                  <span className="text-muted-foreground">
                    {calculateDuration(scannedReservation.startDate, scannedReservation.endDate)} jours
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-sm font-medium">Coût total</span>
                  <span className="font-bold">{scannedReservation.priceCredits} crédits</span>
                </div>
              </CardContent>
            </Card>

            {/* Notes */}
            {(scannedReservation.notes || scannedReservation.adminNotes) && (
              <Card>
                <CardHeader>
                  <CardTitle>Notes</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {scannedReservation.notes && (
                    <div>
                      <p className="text-sm font-medium mb-1">Notes utilisateur</p>
                      <p className="text-sm text-muted-foreground italic">{scannedReservation.notes}</p>
                    </div>
                  )}
                  {scannedReservation.adminNotes && (
                    <>
                      {scannedReservation.notes && <Separator />}
                      <div>
                        <p className="text-sm font-medium mb-1">Notes administrateur</p>
                        <p className="text-sm text-muted-foreground">{scannedReservation.adminNotes}</p>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Actions */}
          <div className="space-y-4">
            <Card className={canPerformAction ? 'border-primary' : ''}>
              <CardHeader>
                <CardTitle className="text-lg">Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {canCheckout && (
                  <Button
                    className="w-full"
                    size="lg"
                    onClick={handleCheckout}
                    disabled={isProcessing}
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Traitement...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="mr-2 h-5 w-5" />
                        Effectuer le retrait
                      </>
                    )}
                  </Button>
                )}

                {canReturn && (
                  <Button
                    className="w-full"
                    size="lg"
                    onClick={handleReturn}
                    disabled={isProcessing}
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Traitement...
                      </>
                    ) : (
                      <>
                        <RotateCcw className="mr-2 h-5 w-5" />
                        Effectuer le retour
                      </>
                    )}
                  </Button>
                )}

                {!canPerformAction && (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      {scannedReservation.status === 'PENDING' && 'La réservation doit être confirmée avant le retrait.'}
                      {scannedReservation.status === 'COMPLETED' && 'Cette réservation est déjà terminée.'}
                      {scannedReservation.status === 'CANCELLED' && 'Cette réservation a été annulée.'}
                      {scannedReservation.status === 'REFUNDED' && 'Cette réservation a été remboursée.'}
                    </AlertDescription>
                  </Alert>
                )}

                <Separator />

                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    setScannedReservation(null)
                    setQrCode('')
                  }}
                  disabled={isProcessing}
                >
                  Nouveau scan
                </Button>
              </CardContent>
            </Card>

            {/* Reservation ID */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Référence</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground font-mono break-all">
                  {scannedReservation.id}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  )
}

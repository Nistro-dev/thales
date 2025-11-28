import { useState, useEffect } from 'react'
import QRCode from 'qrcode'

interface UseQRCodeOptions {
  width?: number
  margin?: number
  errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H'
}

/**
 * Hook to generate a QR code image from text data
 * Returns the QR code as a data URL (base64 PNG)
 */
export function useQRCode(
  data: string | undefined | null,
  options: UseQRCodeOptions = {}
) {
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const { width = 256, margin = 2, errorCorrectionLevel = 'M' } = options

  useEffect(() => {
    if (!data) {
      setQrCodeUrl(null)
      return
    }

    setIsLoading(true)
    setError(null)

    QRCode.toDataURL(data, {
      width,
      margin,
      errorCorrectionLevel,
      color: {
        dark: '#000000',
        light: '#ffffff',
      },
    })
      .then((url) => {
        setQrCodeUrl(url)
        setIsLoading(false)
      })
      .catch((err) => {
        setError(err)
        setIsLoading(false)
      })
  }, [data, width, margin, errorCorrectionLevel])

  return { qrCodeUrl, isLoading, error }
}

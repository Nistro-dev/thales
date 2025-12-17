import { useEffect, useRef, useState, useId, useCallback } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { Button } from "@/components/ui/button";
import { Camera, CameraOff, Loader2 } from "lucide-react";

interface QRScannerProps {
  onScan: (result: string) => void;
  onError?: (error: string) => void;
  isActive?: boolean;
}

export function QRScanner({
  onScan,
  onError,
  isActive = true,
}: QRScannerProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const uniqueId = useId().replace(/:/g, "-");
  const readerId = `qr-reader-${uniqueId}`;

  const stopScanner = useCallback(async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
        scannerRef.current.clear();
      } catch {
        // Ignore stop errors
      }
      scannerRef.current = null;
      setIsScanning(false);
    }
  }, []);

  const startScanner = useCallback(async () => {
    if (scannerRef.current || !containerRef.current) return;

    setIsStarting(true);
    setCameraError(null);

    try {
      const scanner = new Html5Qrcode(readerId);
      scannerRef.current = scanner;

      // Get container size for square QR box
      const containerSize = Math.min(containerRef.current.offsetWidth, 280);
      const qrboxSize = Math.floor(containerSize * 0.7);

      await scanner.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: qrboxSize, // Single value for square box
          aspectRatio: 1.0,
          disableFlip: false,
        },
        (decodedText) => {
          onScan(decodedText);
          stopScanner();
        },
        () => {
          // Ignore scan errors (no QR code found)
        },
      );

      setIsScanning(true);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Erreur caméra";
      setCameraError(errorMessage);
      onError?.(errorMessage);
      scannerRef.current = null;
    } finally {
      setIsStarting(false);
    }
  }, [readerId, onScan, onError, stopScanner]);

  useEffect(() => {
    if (isActive && !isScanning && !isStarting) {
      // Small delay to ensure DOM is ready
      const timer = setTimeout(() => {
        startScanner();
      }, 100);
      return () => clearTimeout(timer);
    }

    return () => {
      stopScanner();
    };
  }, [isActive, isScanning, isStarting, startScanner, stopScanner]);

  const toggleScanner = () => {
    if (isScanning) {
      stopScanner();
    } else {
      startScanner();
    }
  };

  return (
    <div className="space-y-4">
      <div
        ref={containerRef}
        className="relative w-full max-w-[280px] mx-auto aspect-square bg-black rounded-lg overflow-hidden"
      >
        <div
          id={readerId}
          className="w-full h-full [&_video]:!w-full [&_video]:!h-full [&_video]:!object-cover [&>div]:!border-none"
          style={{
            // Force square video display
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        />

        {!isScanning && !isStarting && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-muted">
            <Camera className="h-12 w-12 text-muted-foreground" />
            <p className="text-sm text-muted-foreground text-center px-4">
              {cameraError || "Cliquez pour activer la caméra"}
            </p>
          </div>
        )}

        {isStarting && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-muted">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Activation...</p>
          </div>
        )}
      </div>

      <div className="flex justify-center">
        <Button
          variant={isScanning ? "destructive" : "default"}
          onClick={toggleScanner}
          disabled={isStarting}
          className="w-full max-w-[280px]"
          size="sm"
        >
          {isStarting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Chargement...
            </>
          ) : isScanning ? (
            <>
              <CameraOff className="mr-2 h-4 w-4" />
              Arrêter
            </>
          ) : (
            <>
              <Camera className="mr-2 h-4 w-4" />
              Activer la caméra
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

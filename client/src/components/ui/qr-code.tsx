import { useEffect, useRef, useState } from "react";
import QRious from "qrious";

interface QRCodeProps {
  size?: number;
  qrData?: string;
}

export default function QRCode({ size = 200, qrData }: QRCodeProps) {
  const [isLoading, setIsLoading] = useState(true);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  useEffect(() => {
    if (qrData && canvasRef.current) {
      setIsLoading(true);
      
      // Generate QR code using QRious
      try {
        const qr = new QRious({
          element: canvasRef.current,
          value: qrData,
          size: size,
          backgroundAlpha: 1,
          foreground: "#000000",
          background: "#ffffff",
          level: "H", // High error correction
          padding: 10
        });
        
        setIsLoading(false);
      } catch (error) {
        console.error("Error generating QR code:", error);
        setIsLoading(false);
      }
    } else {
      setIsLoading(false);
    }
  }, [qrData, size]);
  
  return (
    <div className="inline-block p-4 bg-white rounded-lg shadow-sm">
      {qrData ? (
        <canvas ref={canvasRef} width={size} height={size} />
      ) : (
        <div 
          className="bg-neutral-100 flex items-center justify-center" 
          style={{ width: size, height: size }}
        >
          {isLoading ? (
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-neutral-500"></div>
          ) : (
            <span className="text-neutral-500 text-xs">No QR code generated</span>
          )}
        </div>
      )}
      <p className="text-sm text-neutral-600 mt-2 text-center">
        {qrData ? "Scan to mark attendance" : "Generate QR code first"}
      </p>
    </div>
  );
}

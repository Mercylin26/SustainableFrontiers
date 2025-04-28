import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";

interface QRCodeProps {
  size?: number;
  qrData?: string;
}

export default function QRCode({ size = 160, qrData }: QRCodeProps) {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  
  // In a real implementation, we would use a QR code generation library
  // For this demo, we'll create a simple grid to represent the QR code
  
  return (
    <div className="inline-block p-4 bg-white rounded-lg shadow-sm">
      <div 
        className="bg-neutral-800 p-4 relative" 
        style={{ width: size, height: size }}
      >
        {qrData ? (
          <div className="absolute inset-2 grid grid-cols-5 grid-rows-5 gap-1">
            <div className="col-span-2 row-span-2 bg-white"></div>
            <div className="col-span-1 row-span-1 bg-white"></div>
            <div className="col-span-2 row-span-2 bg-white"></div>
            
            <div className="col-span-1 row-span-1 bg-white"></div>
            <div className="col-span-1 row-span-1 bg-white"></div>
            <div className="col-span-1 row-span-1 bg-white"></div>
            <div className="col-span-1 row-span-1 bg-white"></div>
            <div className="col-span-1 row-span-1 bg-white"></div>
            
            <div className="col-span-2 row-span-2 bg-white"></div>
            <div className="col-span-1 row-span-1 bg-white"></div>
            <div className="col-span-2 row-span-2 bg-white"></div>
            
            <div className="col-span-1 row-span-1 bg-white"></div>
            <div className="col-span-1 row-span-1 bg-white"></div>
            <div className="col-span-1 row-span-1 bg-white"></div>
            <div className="col-span-1 row-span-1 bg-white"></div>
            <div className="col-span-1 row-span-1 bg-white"></div>
            
            <div className="col-span-1 row-span-1 bg-white"></div>
            <div className="col-span-1 row-span-1 bg-white"></div>
            <div className="col-span-1 row-span-1 bg-white"></div>
            <div className="col-span-1 row-span-1 bg-white"></div>
            <div className="col-span-1 row-span-1 bg-white"></div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full">
            {isLoading ? (
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-white"></div>
            ) : (
              <span className="text-white text-xs">No QR code generated</span>
            )}
          </div>
        )}
      </div>
      <p className="text-sm text-neutral-600 mt-2 text-center">
        {qrData ? "Scan to mark attendance" : "Generate QR code first"}
      </p>
    </div>
  );
}

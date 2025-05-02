import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { useMutation } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

interface QRScannerProps {
  studentId: number;
  onSuccess?: () => void;
}

export default function QRScanner({ studentId, onSuccess }: QRScannerProps) {
  const [open, setOpen] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [qrMessage, setQrMessage] = useState<string | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Mark attendance mutation
  const markAttendanceMutation = useMutation({
    mutationFn: async (qrCode: string) => {
      return apiRequest('POST', '/api/attendance/mark', {
        studentId,
        qrCode,
      });
    },
    onSuccess: async (response) => {
      const data = await response.json();
      toast({
        title: 'Success',
        description: data.message || 'Attendance marked successfully!',
      });
      if (onSuccess) onSuccess();
      setOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to mark attendance',
        variant: 'destructive',
      });
    },
  });

  const startScanner = async () => {
    if (!containerRef.current) return;
    
    try {
      const html5QrCode = new Html5Qrcode("qr-reader");
      scannerRef.current = html5QrCode;
      setScanning(true);
      setQrMessage(null);
      
      const qrCodeSuccessCallback = (decodedText: string) => {
        stopScanner();
        setQrMessage(decodedText);
        markAttendanceMutation.mutate(decodedText);
      };
      
      await html5QrCode.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: 250 },
        qrCodeSuccessCallback,
        (errorMessage) => {
          console.log(errorMessage);
        }
      );
    } catch (err) {
      console.error("Error starting scanner:", err);
      toast({
        title: 'Camera Error',
        description: 'Could not access camera. Please make sure you have granted camera permissions.',
        variant: 'destructive',
      });
      setScanning(false);
    }
  };

  const stopScanner = () => {
    if (scannerRef.current && scannerRef.current.isScanning) {
      scannerRef.current.stop().catch(err => console.error("Error stopping scanner:", err));
    }
    setScanning(false);
  };

  useEffect(() => {
    return () => {
      stopScanner();
    };
  }, []);

  useEffect(() => {
    if (open) {
      setTimeout(() => {
        startScanner();
      }, 500);
    } else {
      stopScanner();
    }
  }, [open]);

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <span className="material-icons mr-2">camera_alt</span>
        Scan QR Code
      </Button>

      <Dialog open={open} onOpenChange={(isOpen) => {
        setOpen(isOpen);
        if (!isOpen) stopScanner();
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Scan QR Code</DialogTitle>
            <DialogDescription>
              Point your camera at the QR code provided by your professor to mark attendance.
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex items-center justify-center my-4">
            <div ref={containerRef} id="qr-reader" style={{ width: '100%', maxWidth: '500px' }}></div>
          </div>
          
          {markAttendanceMutation.isPending && (
            <div className="text-center py-2">
              <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div>
              <p className="mt-2">Processing QR code...</p>
            </div>
          )}
          
          {qrMessage && !markAttendanceMutation.isPending && (
            <div className="text-center py-2">
              <p className="text-green-600">QR code scanned successfully!</p>
            </div>
          )}
          
          <DialogFooter className="sm:justify-between">
            <Button 
              variant="outline" 
              onClick={() => setOpen(false)}
              disabled={markAttendanceMutation.isPending}
            >
              Cancel
            </Button>
            {scanning && (
              <Button 
                variant="outline"
                onClick={startScanner}
                disabled={markAttendanceMutation.isPending}
              >
                Restart Scanner
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
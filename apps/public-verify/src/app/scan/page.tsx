'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { X, Upload } from 'lucide-react';
import toast from 'react-hot-toast';

declare global {
  interface Window {
    BarcodeDetector?: any;
  }
}

export default function ScanPage() {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState('');
  const [scanning, setScanning] = useState(true);

  useEffect(() => {
    let stream: MediaStream | null = null;
    let detector: any = null;

    const start = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' },
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }

        if ('BarcodeDetector' in window) {
          detector = new (window as any).BarcodeDetector({ formats: ['qr_code'] });
          const scanLoop = async () => {
            if (!videoRef.current || !scanning) return;
            try {
              const codes = await detector.detect(videoRef.current);
              if (codes.length > 0) {
                setScanning(false);
                const value = codes[0].rawValue;
                // Extract verification ID from URL
                const match = value.match(/\/verify\/([a-f0-9-]+)/);
                if (match) {
                  router.push(`/verify/${match[1]}`);
                } else {
                  router.push(`/results?q=${encodeURIComponent(value)}`);
                }
                return;
              }
            } catch {}
            requestAnimationFrame(scanLoop);
          };
          requestAnimationFrame(scanLoop);
        } else {
          setError('QR scanning not supported in this browser');
        }
      } catch {
        setError('Camera access denied');
      }
    };

    start();
    return () => {
      stream?.getTracks().forEach((t) => t.stop());
      setScanning(false);
    };
  }, [router, scanning]);

  const handleUpload = async (file: File) => {
    if (!('BarcodeDetector' in window)) {
      toast.error('Browser does not support QR decoding');
      return;
    }
    const detector = new (window as any).BarcodeDetector({ formats: ['qr_code'] });
    const bitmap = await createImageBitmap(file);
    const codes = await detector.detect(bitmap);
    if (codes.length > 0) {
      const value = codes[0].rawValue;
      const match = value.match(/\/verify\/([a-f0-9-]+)/);
      if (match) router.push(`/verify/${match[1]}`);
      else router.push(`/results?q=${encodeURIComponent(value)}`);
    } else {
      toast.error('No QR code found in image');
    }
  };

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      <div className="flex items-center justify-between p-4 text-white">
        <span className="font-medium">Scan QR Code</span>
        <button onClick={() => router.back()}>
          <X className="w-6 h-6" />
        </button>
      </div>

      <div className="flex-1 relative">
        <video ref={videoRef} className="w-full h-full object-cover" playsInline />
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-64 h-64 border-4 border-white/80 rounded-2xl shadow-lg" />
        </div>
      </div>

      <div className="p-6 text-center text-white space-y-3">
        {error ? (
          <p className="text-red-300">{error}</p>
        ) : (
          <p className="text-sm opacity-80">
            Point your camera at a TruSource Verified QR code
          </p>
        )}

        <label className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur rounded-md cursor-pointer">
          <Upload className="w-4 h-4" />
          Or upload a QR image
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0])}
          />
        </label>
      </div>
    </div>
  );
}
import { useState, useRef, useCallback, useEffect } from "react";
import { motion } from "framer-motion";
import { Camera, RotateCcw, Upload, X, AlertCircle } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";

interface CameraUploadProps {
  isOpen: boolean;
  onClose: () => void;
  onUpload: (file: File) => Promise<void>;
  isUploading: boolean;
}

export function CameraUpload({ isOpen, onClose, onUpload, isUploading }: CameraUploadProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [mode, setMode] = useState<"camera" | "preview" | "error">("camera");
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState("");

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  }, []);

  const startCamera = useCallback(async () => {
    try {
      setErrorMessage("");
      setMode("camera");
      setCapturedImage(null);

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 1920 }, height: { ideal: 1080 } },
      });
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
    } catch {
      setMode("error");
      setErrorMessage("Camera not available — use file upload instead");
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      startCamera();
    }
    return () => {
      stopCamera();
    };
  }, [isOpen, startCamera, stopCamera]);

  const handleCapture = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(video, 0, 0);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.92);
    setCapturedImage(dataUrl);
    setMode("preview");
    stopCamera();
  }, [stopCamera]);

  const handleRetake = useCallback(() => {
    setCapturedImage(null);
    startCamera();
  }, [startCamera]);

  const handleUpload = useCallback(async () => {
    if (!capturedImage) return;

    const response = await fetch(capturedImage);
    const blob = await response.blob();
    const file = new File([blob], `scan_${Date.now()}.jpg`, { type: "image/jpeg" });
    await onUpload(file);
    handleClose();
  }, [capturedImage, onUpload]);

  const handleClose = useCallback(() => {
    stopCamera();
    setCapturedImage(null);
    setMode("camera");
    setErrorMessage("");
    onClose();
  }, [stopCamera, onClose]);

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Scan Document" size="lg">
      <canvas ref={canvasRef} className="hidden" />

      {mode === "error" && (
        <div className="flex flex-col items-center py-12">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-ds-feedback-error/10 border border-ds-feedback-error/20 mb-4">
            <AlertCircle className="h-8 w-8 text-ds-feedback-error" />
          </div>
          <p className="text-sm text-ds-text-secondary text-center mb-6">{errorMessage}</p>
          <Button variant="secondary" onClick={handleClose}>
            Use File Upload Instead
          </Button>
        </div>
      )}

      {mode === "camera" && (
        <div className="flex flex-col items-center">
          <div className="relative w-full rounded-xl overflow-hidden bg-black aspect-[4/3] mb-4">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 border-2 border-white/20 rounded-xl pointer-events-none" />
            <div className="absolute top-4 left-4 right-4 flex justify-between">
              <div className="h-8 w-8 border-t-2 border-l-2 border-white/50 rounded-tl-lg" />
              <div className="h-8 w-8 border-t-2 border-r-2 border-white/50 rounded-tr-lg" />
            </div>
            <div className="absolute bottom-4 left-4 right-4 flex justify-between">
              <div className="h-8 w-8 border-b-2 border-l-2 border-white/50 rounded-bl-lg" />
              <div className="h-8 w-8 border-b-2 border-r-2 border-white/50 rounded-br-lg" />
            </div>
          </div>
          <p className="text-xs text-ds-text-muted mb-4">
            Position your document within the frame
          </p>
          <div className="flex gap-3">
            <Button variant="secondary" onClick={handleClose}>
              Cancel
            </Button>
            <Button variant="glow" onClick={handleCapture} leftIcon={<Camera className="h-4 w-4" />}>
              Capture
            </Button>
          </div>
        </div>
      )}

      {mode === "preview" && capturedImage && (
        <div className="flex flex-col items-center">
          <div className="relative w-full rounded-xl overflow-hidden bg-black aspect-[4/3] mb-4">
            <img src={capturedImage} alt="Captured document" className="w-full h-full object-contain" />
          </div>
          <p className="text-xs text-ds-text-muted mb-4">
            Review your scan before uploading
          </p>
          <div className="flex gap-3">
            <Button variant="secondary" onClick={handleRetake} leftIcon={<RotateCcw className="h-4 w-4" />}>
              Retake
            </Button>
            <Button
              variant="glow"
              onClick={handleUpload}
              isLoading={isUploading}
              leftIcon={<Upload className="h-4 w-4" />}
            >
              Upload
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}

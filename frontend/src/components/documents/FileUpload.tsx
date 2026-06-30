import { useCallback, useRef, useState } from "react";
import { useDropzone } from "react-dropzone";
import { motion } from "framer-motion";
import { Upload, FileText, AlertCircle, Camera, Image } from "lucide-react";
import { cn } from "@/utils/cn";
import { CameraUpload } from "@/components/documents/CameraUpload";

interface FileUploadProps {
  onUpload: (file: File) => Promise<void>;
  isUploading: boolean;
  accept?: Record<string, string[]>;
}

const defaultAccept = {
  "application/pdf": [".pdf"],
  "application/msword": [".doc"],
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
  "text/plain": [".txt"],
  "text/csv": [".csv"],
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"],
  "application/vnd.ms-excel": [".xls"],
  "application/zip": [".zip"],
  "application/x-zip-compressed": [".zip"],
  "image/jpeg": [".jpg", ".jpeg"],
  "image/png": [".png"],
};

export function FileUpload({ onUpload, isUploading, accept = defaultAccept }: FileUploadProps) {
  const [cameraOpen, setCameraOpen] = useState(false);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  const handleNativeCapture = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) await onUpload(file);
      e.target.value = "";
    },
    [onUpload]
  );

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      for (const file of acceptedFiles) {
        await onUpload(file);
      }
    },
    [onUpload]
  );

  const { getRootProps, getInputProps, isDragActive, fileRejections } = useDropzone({
    onDrop,
    accept,
    maxSize: 50 * 1024 * 1024, // 50MB
    disabled: isUploading,
  });

  return (
    <div>
      <div
        {...getRootProps()}
        className={cn(
          "relative cursor-pointer rounded-2xl border-2 border-dashed p-8 text-center transition-all duration-300",
          isDragActive
            ? "border-ds-accent-primary bg-ds-accent-primary/5 scale-[1.02]"
            : "border-ds-border-strong hover:border-ds-border-accent hover:bg-ds-bg-surface/30",
          isUploading && "pointer-events-none opacity-60"
        )}
      >
        <input {...getInputProps()} />

        <motion.div
          animate={isDragActive ? { scale: 1.1, y: -5 } : { scale: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="flex flex-col items-center"
        >
          <div className={cn(
            "mb-4 flex h-14 w-14 items-center justify-center rounded-2xl transition-colors",
            isDragActive
              ? "bg-ds-accent-primary/20 border border-ds-accent-primary/30"
              : "bg-ds-bg-surface border border-ds-border-default"
          )}>
            {isUploading ? (
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-ds-border-default border-t-ds-accent-primary" />
            ) : (
              <Upload className={cn("h-6 w-6", isDragActive ? "text-ds-text-accent" : "text-ds-text-muted")} />
            )}
          </div>

          {isUploading ? (
            <p className="text-sm text-ds-text-secondary">Uploading file...</p>
          ) : isDragActive ? (
            <p className="text-sm text-ds-text-accent font-medium">Drop your files here</p>
          ) : (
            <>
              <p className="text-sm text-ds-text-primary font-medium mb-1">
                Drag & drop files here, or click to browse
              </p>
              <p className="text-xs text-ds-text-muted">
                PDF, DOC, DOCX, TXT, CSV, JPG, PNG, ZIP up to 50MB
              </p>
            </>
          )}
        </motion.div>
      </div>

      {fileRejections.length > 0 && (
        <div className="mt-3 flex items-center gap-2 rounded-lg bg-ds-feedback-error/10 border border-ds-feedback-error/20 px-3 py-2">
          <AlertCircle className="h-4 w-4 text-ds-feedback-error flex-shrink-0" />
          <p className="text-xs text-ds-feedback-error">
            {fileRejections[0].errors[0]?.message || "File not accepted. Check format and size."}
          </p>
        </div>
      )}

      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleNativeCapture}
      />
      <input
        ref={galleryInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleNativeCapture}
      />

      <div className="mt-4 flex flex-col gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => cameraInputRef.current?.click()}
            disabled={isUploading}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-lg border border-ds-border-default bg-ds-bg-surface px-3 py-2 text-xs font-medium text-ds-text-secondary transition-all duration-200",
              "hover:border-ds-border-accent hover:text-ds-text-accent hover:bg-ds-accent-primary/5",
              isUploading && "pointer-events-none opacity-50"
            )}
          >
            <Camera className="h-3.5 w-3.5" />
            Take Photo
          </button>
          <button
            type="button"
            onClick={() => galleryInputRef.current?.click()}
            disabled={isUploading}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-lg border border-ds-border-default bg-ds-bg-surface px-3 py-2 text-xs font-medium text-ds-text-secondary transition-all duration-200",
              "hover:border-ds-border-accent hover:text-ds-text-accent hover:bg-ds-accent-primary/5",
              isUploading && "pointer-events-none opacity-50"
            )}
          >
            <Image className="h-3.5 w-3.5" />
            Photo Library
          </button>
          <button
            type="button"
            onClick={() => setCameraOpen(true)}
            disabled={isUploading}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-lg border border-ds-border-default bg-ds-bg-surface px-3 py-2 text-xs font-medium text-ds-text-secondary transition-all duration-200",
              "hover:border-ds-border-accent hover:text-ds-text-accent hover:bg-ds-accent-primary/5",
              isUploading && "pointer-events-none opacity-50"
            )}
          >
            <Camera className="h-3.5 w-3.5" />
            Scan Document
          </button>
        </div>
        <div className="flex items-center gap-2 text-xs text-ds-text-muted">
          <FileText className="h-3.5 w-3.5" />
          Your documents are encrypted and stored securely.
        </div>
      </div>

      <CameraUpload
        isOpen={cameraOpen}
        onClose={() => setCameraOpen(false)}
        onUpload={onUpload}
        isUploading={isUploading}
      />
    </div>
  );
}

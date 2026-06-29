import { ZoomIn, ZoomOut, Maximize2 } from "lucide-react";
import { cn } from "@/utils/cn";

interface GraphControlsProps {
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  onFit?: () => void;
  className?: string;
}

export function GraphControls({ onZoomIn, onZoomOut, onFit, className }: GraphControlsProps) {
  const btnClass =
    "flex h-8 w-8 items-center justify-center rounded-lg bg-ds-bg-surface/80 border border-ds-border-default text-ds-text-muted hover:text-ds-text-primary hover:border-ds-border-strong transition-colors";

  return (
    <div className={cn("flex items-center gap-1.5", className)}>
      <button onClick={onZoomIn} className={btnClass} title="Zoom in">
        <ZoomIn className="h-4 w-4" />
      </button>
      <button onClick={onZoomOut} className={btnClass} title="Zoom out">
        <ZoomOut className="h-4 w-4" />
      </button>
      <button onClick={onFit} className={btnClass} title="Fit to screen">
        <Maximize2 className="h-4 w-4" />
      </button>
    </div>
  );
}

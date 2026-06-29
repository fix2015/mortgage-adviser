import { useCallback, useEffect, useRef, useState } from "react";
import ForceGraph2D from "react-force-graph-2d";
import { useQuery } from "@tanstack/react-query";
import { getKnowledgeGraph } from "@/api/knowledge";
import type { KnowledgeNode } from "@/types";
import { Spinner } from "@/components/ui/Spinner";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type GraphNode = any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type GraphRef = any;

const categoryColors: Record<string, string> = {
  income: "#10B981",
  property: "#059669",
  mortgage: "#D97706",
  deposit: "#8B5CF6",
  lender: "#0D9488",
  strategy: "#06B6D4",
  regulation: "#6366F1",
};

interface KnowledgeGraphProps {
  onNodeClick?: (node: KnowledgeNode) => void;
  width?: number;
  height?: number;
}

export function KnowledgeGraph({ onNodeClick, width, height }: KnowledgeGraphProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const graphRef = useRef<GraphRef>(null);
  const [dimensions, setDimensions] = useState({ width: width || 600, height: height || 400 });

  const { data: graphData, isLoading } = useQuery({
    queryKey: ["knowledge-graph"],
    queryFn: getKnowledgeGraph,
    refetchInterval: 30000,
  });

  useEffect(() => {
    if (!width || !height) {
      const updateSize = () => {
        if (containerRef.current) {
          setDimensions({
            width: containerRef.current.clientWidth,
            height: containerRef.current.clientHeight,
          });
        }
      };
      updateSize();
      window.addEventListener("resize", updateSize);
      return () => window.removeEventListener("resize", updateSize);
    }
  }, [width, height]);

  const nodeCanvasObject = useCallback(
    (node: GraphNode, ctx: CanvasRenderingContext2D) => {
      if (node.x === undefined || node.y === undefined) return;
      const color = categoryColors[node.category || "mortgage"] || "#059669";
      const size = 6;

      const gradient = ctx.createRadialGradient(node.x, node.y, size, node.x, node.y, size * 3);
      gradient.addColorStop(0, color + "40");
      gradient.addColorStop(1, color + "00");
      ctx.beginPath();
      ctx.arc(node.x, node.y, size * 3, 0, 2 * Math.PI);
      ctx.fillStyle = gradient;
      ctx.fill();

      ctx.beginPath();
      ctx.arc(node.x, node.y, size, 0, 2 * Math.PI);
      ctx.fillStyle = color;
      ctx.fill();

      ctx.beginPath();
      ctx.arc(node.x - size * 0.2, node.y - size * 0.2, size * 0.4, 0, 2 * Math.PI);
      ctx.fillStyle = "rgba(255,255,255,0.3)";
      ctx.fill();

      if (node.label) {
        ctx.font = "3px Inter, sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "top";
        ctx.fillStyle = "#94A3B8";
        ctx.fillText(node.label, node.x, node.y + size + 3);
      }
    },
    []
  );

  const linkColor = useCallback(() => "rgba(5, 150, 105, 0.15)", []);
  const linkWidth = useCallback(() => 1, []);

  if (isLoading) {
    return (
      <div ref={containerRef} className="flex items-center justify-center h-full bg-ds-bg-primary rounded-xl">
        <Spinner />
      </div>
    );
  }

  if (!graphData || graphData.nodes.length === 0) {
    return (
      <div ref={containerRef} className="flex items-center justify-center h-full bg-ds-bg-primary rounded-xl">
        <div className="text-center p-6">
          <p className="text-sm text-ds-text-muted">
            Upload documents and start chatting to build your knowledge graph.
          </p>
        </div>
      </div>
    );
  }

  const formattedData = {
    nodes: graphData.nodes.map((n) => ({ ...n })),
    links: graphData.edges.map((e) => ({ source: e.source, target: e.target, label: e.label })),
  };

  return (
    <div ref={containerRef} className="relative h-full bg-ds-bg-primary rounded-xl overflow-hidden">
      <ForceGraph2D
        ref={graphRef}
        graphData={formattedData}
        width={dimensions.width}
        height={dimensions.height}
        backgroundColor="transparent"
        nodeCanvasObject={nodeCanvasObject}
        nodePointerAreaPaint={(node: GraphNode, color: string, ctx: CanvasRenderingContext2D) => {
          if (node.x === undefined || node.y === undefined) return;
          ctx.beginPath();
          ctx.arc(node.x, node.y, 8, 0, 2 * Math.PI);
          ctx.fillStyle = color;
          ctx.fill();
        }}
        linkColor={linkColor}
        linkWidth={linkWidth}
        onNodeClick={(node) => {
          if (onNodeClick) {
            onNodeClick(node as unknown as KnowledgeNode);
          }
        }}
        cooldownTicks={100}
        d3AlphaDecay={0.02}
        d3VelocityDecay={0.3}
        enableZoomInteraction={true}
        enablePanInteraction={true}
      />

      <div className="absolute bottom-3 left-3 glass rounded-lg p-3">
        <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
          {Object.entries(categoryColors).map(([cat, color]) => (
            <div key={cat} className="flex items-center gap-2">
              <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />
              <span className="text-[10px] text-ds-text-muted capitalize">{cat}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

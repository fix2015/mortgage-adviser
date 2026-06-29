import { useState } from "react";
import { ChatWindow } from "@/components/chat/ChatWindow";
import { KnowledgeGraph } from "@/components/knowledge/KnowledgeGraph";
import { KnowledgePanel } from "@/components/knowledge/KnowledgePanel";
import { Home, PanelRightClose, PanelRightOpen } from "lucide-react";
import type { KnowledgeNode } from "@/types";

export function ChatPage() {
  const [selectedNode, setSelectedNode] = useState<KnowledgeNode | null>(null);
  const [graphOpen, setGraphOpen] = useState(true);

  return (
    <div className="flex h-full">
      <div className="flex-1 flex flex-col min-w-0"><ChatWindow /></div>
      <button onClick={() => setGraphOpen(!graphOpen)} className="hidden lg:flex items-center justify-center w-8 border-l border-ds-border-default bg-ds-bg-secondary hover:bg-ds-bg-tertiary transition-colors" title={graphOpen ? "Hide knowledge graph" : "Show knowledge graph"}>
        {graphOpen ? <PanelRightClose className="h-4 w-4 text-ds-text-muted" /> : <PanelRightOpen className="h-4 w-4 text-ds-text-muted" />}
      </button>
      {graphOpen && (
        <div className="hidden lg:flex flex-col w-[35%] min-w-[300px] max-w-[500px] border-l border-ds-border-default bg-ds-bg-secondary">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-ds-border-default"><Home className="h-4 w-4 text-ds-text-accent" /><h2 className="text-sm font-semibold text-ds-text-primary">Knowledge Graph</h2></div>
          <div className="relative flex-1"><KnowledgeGraph onNodeClick={setSelectedNode} /><KnowledgePanel node={selectedNode} onClose={() => setSelectedNode(null)} /></div>
        </div>
      )}
    </div>
  );
}

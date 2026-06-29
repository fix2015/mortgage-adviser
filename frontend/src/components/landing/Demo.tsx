import { useState, useEffect, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { MessageSquare, Network, FileText, ArrowRight, Bot, User, Lock } from "lucide-react";
import { Button } from "@/components/ui/Button";
import ForceGraph2D from "react-force-graph-2d";

const tabs = [
  { id: "chat", label: "AI Chat", icon: MessageSquare },
  { id: "graph", label: "Knowledge Graph", icon: Network },
  { id: "pdf", label: "Strategy PDF", icon: FileText },
] as const;
type TabId = (typeof tabs)[number]["id"];

const userQuestion = "How much can I borrow with a £55,000 salary and £30,000 deposit?";
const aiResponse = `Great question! Based on your income and deposit, here's your borrowing analysis:

**Your Profile**
- Annual salary: £55,000
- Deposit available: £30,000

**Borrowing Capacity**
Most UK lenders use a 4-4.5x income multiplier:
- Conservative (4x): **£220,000**
- Standard (4.5x): **£247,500**
- With deposit: Property budget of **£250,000 - £277,500**

**Best Matches for You**
1. **Nationwide** - 4.49% fixed 2yr, £1,102/mo
2. **HSBC** - 4.39% fixed 5yr, £1,089/mo  
3. **Barclays** - 4.54% fixed 2yr, £1,108/mo

**LTV Analysis**
At £270,000 property: LTV = 88.9% (good range for competitive rates)

I recommend the HSBC 5-year fix for payment stability. Shall I run a detailed comparison?`;

const demoGraphData = {
  nodes: [
    { id: "income", label: "Income £55k", category: "income" },
    { id: "deposit", label: "Deposit £30k", category: "deposit" },
    { id: "property", label: "Property £270k", category: "property" },
    { id: "mortgage", label: "Mortgage £240k", category: "mortgage" },
    { id: "hsbc", label: "HSBC 4.39%", category: "lender" },
    { id: "nationwide", label: "Nationwide 4.49%", category: "lender" },
  ],
  links: [
    { source: "income", target: "mortgage" },
    { source: "deposit", target: "property" },
    { source: "mortgage", target: "property" },
    { source: "mortgage", target: "hsbc" },
    { source: "mortgage", target: "nationwide" },
    { source: "income", target: "property" },
  ],
};

const categoryColors: Record<string, string> = {
  income: "#10B981", deposit: "#8B5CF6", property: "#059669",
  mortgage: "#D97706", lender: "#0D9488", strategy: "#06B6D4",
};

function ChatDemo() {
  const [displayedText, setDisplayedText] = useState("");
  const [showUser, setShowUser] = useState(false);
  const [showAI, setShowAI] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const indexRef = useRef(0);

  useEffect(() => {
    const t1 = setTimeout(() => setShowUser(true), 400);
    const t2 = setTimeout(() => {
      setShowAI(true);
      indexRef.current = 0;
      intervalRef.current = setInterval(() => {
        indexRef.current += 3;
        if (indexRef.current >= aiResponse.length) {
          setDisplayedText(aiResponse);
          if (intervalRef.current) clearInterval(intervalRef.current);
        } else { setDisplayedText(aiResponse.slice(0, indexRef.current)); }
      }, 12);
    }, 1200);
    return () => { clearTimeout(t1); clearTimeout(t2); if (intervalRef.current) clearInterval(intervalRef.current); };
  }, []);

  return (
    <div className="flex flex-col gap-4 h-[420px] overflow-y-auto pr-2">
      {showUser && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex gap-3 justify-end">
          <div className="max-w-[80%] rounded-2xl rounded-tr-sm bg-gradient-to-br from-ds-accent-primary to-ds-accent-secondary px-4 py-3 text-white text-sm leading-relaxed">{userQuestion}</div>
          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-ds-bg-surface border border-ds-border-default"><User className="h-4 w-4 text-ds-text-muted" /></div>
        </motion.div>
      )}
      {showAI && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex gap-3">
          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-ds-accent-primary to-ds-accent-secondary"><Bot className="h-4 w-4 text-white" /></div>
          <div className="max-w-[85%] rounded-2xl rounded-tl-sm bg-ds-bg-surface border border-ds-border-default px-4 py-3 text-sm text-ds-text-secondary leading-relaxed whitespace-pre-wrap">
            {displayedText.split("\n").map((line, i) => {
              const boldMatch = line.match(/^\*\*(.+?)\*\*$/);
              if (boldMatch) return <span key={i} className="block font-semibold text-ds-text-primary">{boldMatch[1]}{"\n"}</span>;
              const parts = line.split(/(\*\*.*?\*\*)/g);
              return <span key={i}>{parts.map((part, j) => { const m = part.match(/^\*\*(.+?)\*\*$/); return m ? <span key={j} className="font-semibold text-ds-text-primary">{m[1]}</span> : part; })}{"\n"}</span>;
            })}
            {displayedText.length < aiResponse.length && <span className="inline-block w-2 h-4 bg-ds-accent-primary/60 animate-pulse ml-0.5" />}
          </div>
        </motion.div>
      )}
    </div>
  );
}

function GraphDemo() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 600, height: 420 });
  useEffect(() => {
    const updateSize = () => { if (containerRef.current) setDimensions({ width: containerRef.current.clientWidth, height: 420 }); };
    updateSize(); window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, []);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const nodeCanvasObject = useCallback((node: any, ctx: CanvasRenderingContext2D) => {
    if (node.x === undefined || node.y === undefined) return;
    const color = categoryColors[node.category || "mortgage"] || "#059669";
    const size = 8;
    const gradient = ctx.createRadialGradient(node.x, node.y, size, node.x, node.y, size * 3);
    gradient.addColorStop(0, color + "40"); gradient.addColorStop(1, color + "00");
    ctx.beginPath(); ctx.arc(node.x, node.y, size * 3, 0, 2 * Math.PI); ctx.fillStyle = gradient; ctx.fill();
    ctx.beginPath(); ctx.arc(node.x, node.y, size, 0, 2 * Math.PI); ctx.fillStyle = color; ctx.fill();
    if (node.label) { ctx.font = "4px Inter, sans-serif"; ctx.textAlign = "center"; ctx.textBaseline = "top"; ctx.fillStyle = "#475569"; ctx.fillText(node.label, node.x, node.y + size + 4); }
  }, []);

  return (
    <div ref={containerRef} className="relative h-[420px] rounded-xl overflow-hidden bg-ds-bg-primary">
      <ForceGraph2D graphData={demoGraphData} width={dimensions.width} height={dimensions.height} backgroundColor="transparent" nodeCanvasObject={nodeCanvasObject}
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        nodePointerAreaPaint={(node: any, color: string, ctx: CanvasRenderingContext2D) => { if (node.x !== undefined && node.y !== undefined) { ctx.beginPath(); ctx.arc(node.x, node.y, 10, 0, 2 * Math.PI); ctx.fillStyle = color; ctx.fill(); } }}
        linkColor={() => "rgba(5, 150, 105, 0.2)"} linkWidth={() => 1.5} cooldownTicks={100} d3AlphaDecay={0.02} d3VelocityDecay={0.3} enableZoomInteraction={true} enablePanInteraction={true} />
      <div className="absolute bottom-3 left-3 glass rounded-lg p-3">
        <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
          {Object.entries(categoryColors).filter(([cat]) => ["income", "deposit", "property", "lender"].includes(cat)).map(([cat, color]) => (
            <div key={cat} className="flex items-center gap-2"><div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} /><span className="text-[10px] text-ds-text-muted capitalize">{cat}</span></div>
          ))}
        </div>
      </div>
    </div>
  );
}

function PDFDemo() {
  return (
    <div className="h-[420px] overflow-y-auto pr-2">
      <div className="bg-white rounded-xl border border-gray-200 shadow-lg overflow-hidden">
        <div className="bg-gradient-to-r from-[#064e3b] to-[#059669] px-6 py-4 text-center">
          <p className="text-emerald-200 text-xs">AI Mortgage Adviser</p>
          <h3 className="text-white text-lg font-bold mt-1">Mortgage Strategy Report</h3>
          <p className="text-emerald-200 text-xs mt-1">Generated on 29 June 2026</p>
        </div>
        <div className="px-6 py-5 space-y-5">
          <div><h4 className="text-[#064e3b] font-bold text-sm border-b-2 border-[#059669] pb-1 mb-2">Executive Summary</h4>
            <p className="text-xs text-gray-600 leading-relaxed">Based on your income of £55,000, deposit of £30,000, and preferred property value of £270,000, we recommend a 5-year fixed rate mortgage with HSBC at 4.39%.</p></div>
          <div><h4 className="text-[#064e3b] font-bold text-sm border-b border-[#059669] pb-1 mb-2">Top 3 Lender Comparison</h4>
            <table className="w-full text-xs border-collapse"><thead><tr className="bg-[#064e3b] text-white"><th className="px-2 py-1.5 text-left font-medium">Lender</th><th className="px-2 py-1.5 text-right font-medium">Rate</th><th className="px-2 py-1.5 text-right font-medium">Monthly</th></tr></thead>
              <tbody>{[["HSBC", "4.39%", "£1,089"],["Nationwide", "4.49%", "£1,102"],["Barclays", "4.54%", "£1,108"]].map(([l,r,m], i) => (<tr key={l} className={i % 2 === 0 ? "bg-gray-50" : "bg-white"}><td className="px-2 py-1.5 text-gray-700 font-medium border border-gray-200">{l}</td><td className="px-2 py-1.5 text-right text-gray-600 border border-gray-200">{r}</td><td className="px-2 py-1.5 text-right text-gray-600 border border-gray-200">{m}</td></tr>))}</tbody></table></div>
          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3"><p className="text-xs font-semibold text-[#059669] mb-1">Recommendation</p><p className="text-xs text-gray-600 leading-relaxed">HSBC 5-year fixed at 4.39% offers the best combination of rate stability and monthly affordability for your situation.</p></div>
        </div>
      </div>
      <div className="mt-4 text-center"><button disabled className="inline-flex items-center gap-2 rounded-xl border border-ds-border-default bg-ds-bg-surface/50 px-5 py-2.5 text-sm text-ds-text-muted cursor-not-allowed"><Lock className="h-4 w-4" />Download Sample — Sign up to get yours</button></div>
    </div>
  );
}

export function Demo() {
  const [activeTab, setActiveTab] = useState<TabId>("chat");
  return (
    <section className="relative py-24">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-ds-text-primary">See What You Get for <span className="text-gradient">£15</span></h2>
          <p className="mt-4 text-lg text-ds-text-secondary max-w-xl mx-auto">Try our interactive demo. No signup required.</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }}>
          <div className="glass rounded-2xl overflow-hidden border border-ds-border-default/50">
            <div className="flex border-b border-ds-border-default bg-ds-bg-secondary/50">
              {tabs.map((tab) => { const Icon = tab.icon; const isActive = activeTab === tab.id; return (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex-1 flex items-center justify-center gap-2 px-4 py-3.5 text-sm font-medium transition-all duration-200 border-b-2 ${isActive ? "text-ds-text-accent border-ds-accent-primary bg-ds-accent-primary/5" : "text-ds-text-muted border-transparent hover:text-ds-text-secondary hover:bg-ds-bg-surface/50"}`}><Icon className="h-4 w-4" />{tab.label}</button>
              ); })}
            </div>
            <div className="p-6">
              {activeTab === "chat" && <ChatDemo />}
              {activeTab === "graph" && <GraphDemo />}
              {activeTab === "pdf" && <PDFDemo />}
            </div>
          </div>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.2 }} className="text-center mt-10">
          <Link to="/register"><Button variant="glow" size="xl" rightIcon={<ArrowRight className="h-5 w-5" />}>Start Your Free Trial</Button></Link>
          <p className="mt-3 text-sm text-ds-text-muted">No credit card required. 3 free questions included.</p>
        </motion.div>
      </div>
    </section>
  );
}

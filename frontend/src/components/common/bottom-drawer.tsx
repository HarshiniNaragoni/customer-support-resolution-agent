import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronUp, ChevronDown, Code, Wrench, Brain, BookOpen, Timer,
  CheckCircle2, Circle, Copy, Check,
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { useAppStore } from "@/store";
import { cn } from "@/lib/utils";

type Tab = "json" | "tools" | "agent" | "rag" | "timeline";

const tabs: { id: Tab; label: string; icon: typeof Code }[] = [
  { id: "timeline", label: "Timeline", icon: Timer },
  { id: "json", label: "Raw JSON", icon: Code },
  { id: "tools", label: "Tool Calls", icon: Wrench },
  { id: "agent", label: "Agent State", icon: Brain },
  { id: "rag", label: "RAG Results", icon: BookOpen },
];

function CopyJsonButton({ data }: { data: unknown }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(JSON.stringify(data, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button onClick={handleCopy} className="p-1.5 rounded-lg hover:bg-white/10 transition-colors text-text-secondary hover:text-text-primary" aria-label="Copy JSON">
      {copied ? <Check className="w-3 h-3 text-success" /> : <Copy className="w-3 h-3" />}
    </button>
  );
}

const TIMELINE_STEPS = [
  { key: "query", label: "Customer Query" },
  { key: "intent", label: "Intent Detection" },
  { key: "retrieval", label: "Policy Retrieval" },
  { key: "tool", label: "Tool Execution" },
  { key: "confidence", label: "Confidence Evaluation" },
  { key: "gate", label: "Human Approval Check" },
  { key: "resolution", label: "Final Resolution" },
];

export function BottomDrawer() {
  const { bottomDrawerOpen, toggleBottomDrawer, lastAgentResponse } = useAppStore();
  const [activeTab, setActiveTab] = useState<Tab>("timeline");

  return (
    <div className="border-t border-glass-border bg-bg-secondary/50 backdrop-blur-xl">
      <button
        onClick={toggleBottomDrawer}
        aria-expanded={bottomDrawerOpen}
        className="w-full flex items-center justify-between px-5 py-2.5 hover:bg-white/5 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Code className="w-3.5 h-3.5 text-primary" />
          <span className="text-xs font-semibold text-text-primary">Inspector</span>
          {lastAgentResponse && <Badge variant="ghost" className="text-[9px]">Live</Badge>}
        </div>
        {bottomDrawerOpen ? <ChevronDown className="w-4 h-4 text-text-secondary" /> : <ChevronUp className="w-4 h-4 text-text-secondary" />}
      </button>

      <AnimatePresence>
        {bottomDrawerOpen && (
          <motion.div initial={{ height: 0 }} animate={{ height: 320 }} exit={{ height: 0 }} transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }} className="overflow-hidden">
            {/* Tabs */}
            <div className="flex gap-1 px-5 border-b border-glass-border overflow-x-auto">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-2 text-[11px] font-medium transition-all border-b-2 -mb-px whitespace-nowrap",
                    activeTab === tab.id ? "text-primary border-primary" : "text-text-secondary border-transparent hover:text-text-primary"
                  )}
                >
                  <tab.icon className="w-3 h-3" />
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Content */}
            <ScrollArea className="h-[270px] p-5">
              {activeTab === "timeline" && (
                <div className="space-y-0">
                  {lastAgentResponse ? (
                    TIMELINE_STEPS.map((step, i) => (
                      <motion.div key={step.key} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }} className="flex items-center gap-3 relative">
                        {!i && <div className="absolute left-[11px] top-[24px] w-[2px] h-[calc(100%+4px)] bg-glass-border" />}
                        <div className="w-6 h-6 rounded-full bg-success/20 border border-success/40 flex items-center justify-center shrink-0 z-10">
                          <CheckCircle2 className="w-3 h-3 text-success" />
                        </div>
                        <div className="py-2 flex-1">
                          <p className="text-xs text-text-primary">{step.label}</p>
                          {step.key === "intent" && <p className="text-[10px] text-primary">{lastAgentResponse.intent}</p>}
                          {step.key === "tool" && <p className="text-[10px] text-text-secondary">{lastAgentResponse.tool_used !== "none" ? lastAgentResponse.tool_used : "Skipped"}</p>}
                          {step.key === "confidence" && <p className="text-[10px] text-text-secondary">{Math.round(lastAgentResponse.confidence * 100)}%</p>}
                          {step.key === "gate" && <p className={cn("text-[10px]", lastAgentResponse.escalated ? "text-danger" : "text-success")}>{lastAgentResponse.escalated ? "Escalated" : "Passed"}</p>}
                        </div>
                      </motion.div>
                    ))
                  ) : (
                    <p className="text-xs text-text-secondary text-center py-8">No execution data yet</p>
                  )}
                </div>
              )}

              {activeTab === "json" && (
                <div className="relative">
                  <div className="absolute top-0 right-0"><CopyJsonButton data={lastAgentResponse || { status: "waiting" }} /></div>
                  <pre className="text-[11px] text-text-secondary font-mono whitespace-pre-wrap break-all leading-relaxed pr-8">
                    {lastAgentResponse
                      ? JSON.stringify(lastAgentResponse, null, 2)
                      : '{\n  "status": "waiting_for_input"\n}'}
                  </pre>
                </div>
              )}

              {activeTab === "tools" && (
                <div className="space-y-2">
                  {lastAgentResponse?.tool_used && lastAgentResponse.tool_used !== "none" ? (
                    <div className="p-3 rounded-lg glass text-xs space-y-1">
                      <div className="flex items-center gap-2">
                        <Wrench className="w-3 h-3 text-primary" />
                        <span className="font-medium text-text-primary">{lastAgentResponse.tool_used}</span>
                        <Badge variant="success" className="text-[9px]">Success</Badge>
                      </div>
                      <p className="text-text-secondary">Tool executed successfully</p>
                    </div>
                  ) : (
                    <p className="text-xs text-text-secondary text-center py-8">No tools were called for this request</p>
                  )}
                </div>
              )}

              {activeTab === "agent" && (
                <div className="space-y-2 text-xs font-mono">
                  {lastAgentResponse ? (
                    Object.entries({
                      intent: lastAgentResponse.intent,
                      confidence: lastAgentResponse.confidence,
                      escalated: String(lastAgentResponse.escalated),
                      tool_used: lastAgentResponse.tool_used,
                      citations_count: lastAgentResponse.citations?.length || 0,
                      ticket_id: lastAgentResponse.ticket_id,
                    }).map(([key, value]) => (
                      <div key={key} className="flex justify-between p-2 rounded bg-white/[0.03]">
                        <span className="text-text-secondary">{key}</span>
                        <span className="text-primary truncate ml-4 max-w-[60%] text-right">{String(value)}</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-text-secondary text-center py-8">No agent state available</p>
                  )}
                </div>
              )}

              {activeTab === "rag" && (
                <div className="space-y-2">
                  {lastAgentResponse?.citations && lastAgentResponse.citations.length > 0 ? (
                    lastAgentResponse.citations.map((c, i) => (
                      <div key={i} className="p-3 rounded-lg glass text-xs">
                        <p className="font-medium text-text-primary mb-1">
                          {typeof c === "object" && c !== null && "title" in c ? String((c as Record<string, unknown>).title) : `Document ${i + 1}`}
                        </p>
                        <p className="text-text-secondary line-clamp-3">
                          {typeof c === "object" && c !== null && "content_preview" in c
                            ? String((c as Record<string, unknown>).content_preview)
                            : JSON.stringify(c)}
                        </p>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-text-secondary text-center py-8">No RAG results</p>
                  )}
                </div>
              )}
            </ScrollArea>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Code, Wrench, Brain, BookOpen, Timer,
  CheckCircle2, Copy, Check, ShieldAlert, Ban, EyeOff,
  PanelRightClose, PanelRightOpen,
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { useAppStore } from "@/store";
import { cn } from "@/lib/utils";

type Tab = "json" | "tools" | "agent" | "rag" | "timeline" | "security";

const tabs: { id: Tab; label: string; icon: typeof Code }[] = [
  { id: "timeline", label: "Timeline", icon: Timer },
  { id: "security", label: "Security", icon: ShieldAlert },
  { id: "json", label: "JSON", icon: Code },
  { id: "tools", label: "Tools", icon: Wrench },
  { id: "agent", label: "State", icon: Brain },
  { id: "rag", label: "RAG", icon: BookOpen },
];

function CopyJsonButton({ data }: { data: unknown }) {
  const [copied, setCopied] = useState(false);
  return (
    <button onClick={() => { navigator.clipboard.writeText(JSON.stringify(data, null, 2)); setCopied(true); setTimeout(() => setCopied(false), 2000); }} className="p-1.5 rounded-lg hover:bg-white/10 transition-colors text-text-secondary hover:text-text-primary" aria-label="Copy JSON">
      {copied ? <Check className="w-3 h-3 text-success" /> : <Copy className="w-3 h-3" />}
    </button>
  );
}

const TIMELINE_STEPS = [
  { key: "query", label: "Customer Query" },
  { key: "intent", label: "Intent Detection" },
  { key: "retrieval", label: "Policy Retrieval" },
  { key: "tool", label: "Tool Execution" },
  { key: "confidence", label: "Confidence Eval" },
  { key: "gate", label: "Human Check" },
  { key: "resolution", label: "Resolution" },
];

const SECURITY_TIMELINE_STEPS = [
  { key: "received", label: "Message Received" },
  { key: "scan", label: "Security Scan" },
  { key: "detected", label: "Injection Detected" },
  { key: "intent_skip", label: "Intent Skipped" },
  { key: "rag_skip", label: "RAG Skipped" },
  { key: "tool_skip", label: "Tools Skipped" },
  { key: "safe_response", label: "Safe Response" },
  { key: "escalated", label: "Escalated" },
];

export function InspectorPanel() {
  const { inspectorOpen, toggleInspector, lastAgentResponse } = useAppStore();
  const [activeTab, setActiveTab] = useState<Tab>("timeline");
  const isInjection = lastAgentResponse?.intent === "prompt_injection" || lastAgentResponse?.prompt_injection_detected;

  return (
    <AnimatePresence mode="wait">
      {inspectorOpen ? (
        <motion.div
          key="inspector"
          initial={{ width: 0, opacity: 0 }}
          animate={{ width: 320, opacity: 1 }}
          exit={{ width: 0, opacity: 0 }}
          transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
          className="h-full border-l border-glass-border bg-bg-secondary/50 backdrop-blur-xl flex flex-col overflow-hidden shrink-0"
        >
          {/* Header */}
          <div className="px-4 py-3 border-b border-glass-border flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              {isInjection ? (
                <ShieldAlert className="w-3.5 h-3.5 text-danger" />
              ) : (
                <Code className="w-3.5 h-3.5 text-primary" />
              )}
              <span className="text-xs font-semibold text-text-primary">
                {isInjection ? "Security" : "Inspector"}
              </span>
              {lastAgentResponse && (
                <Badge variant={isInjection ? "danger" : "ghost"} className="text-[9px]">
                  {isInjection ? "Threat" : "Live"}
                </Badge>
              )}
            </div>
            <button onClick={toggleInspector} className="p-1.5 rounded-lg hover:bg-white/10 transition-colors text-text-secondary hover:text-text-primary" aria-label="Close inspector">
              <PanelRightClose className="w-4 h-4" />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-0.5 px-3 py-1.5 border-b border-glass-border overflow-x-auto shrink-0">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex items-center gap-1 px-2.5 py-1.5 text-[10px] font-medium rounded-md transition-all whitespace-nowrap",
                  activeTab === tab.id ? "bg-primary/15 text-primary" : "text-text-secondary hover:text-text-primary hover:bg-white/5"
                )}
              >
                <tab.icon className="w-3 h-3" />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Content */}
          <ScrollArea className="flex-1 p-4">
            {activeTab === "timeline" && (
              <div className="space-y-0">
                {lastAgentResponse ? (
                  (isInjection ? SECURITY_TIMELINE_STEPS : TIMELINE_STEPS).map((step, i) => {
                    const isSecurity = isInjection;
                    const isDetected = step.key === "detected";
                    return (
                      <motion.div key={step.key} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }} className="flex items-center gap-2.5 relative">
                        {!i && <div className={cn("absolute left-[9px] top-[20px] w-[2px] h-[calc(100%+4px)]", isSecurity ? "bg-danger/30" : "bg-glass-border")} />}
                        <div className={cn(
                          "w-5 h-5 rounded-full flex items-center justify-center shrink-0 z-10",
                          isSecurity ? "bg-danger/20 border border-danger/40" : "bg-success/20 border border-success/40"
                        )}>
                          {isDetected ? (
                            <Ban className="w-2.5 h-2.5 text-danger" />
                          ) : step.key.includes("skip") ? (
                            <EyeOff className="w-2.5 h-2.5 text-danger/70" />
                          ) : (
                            <CheckCircle2 className={cn("w-2.5 h-2.5", isSecurity ? "text-danger/70" : "text-success")} />
                          )}
                        </div>
                        <div className="py-1.5 flex-1 min-w-0">
                          <p className={cn(
                            "text-[11px] truncate",
                            isDetected ? "text-danger font-medium" : step.key.includes("skip") ? "text-danger/70" : "text-text-primary"
                          )}>{step.label}</p>
                          {!isSecurity && step.key === "intent" && <p className="text-[9px] text-primary truncate">{lastAgentResponse.intent}</p>}
                          {!isSecurity && step.key === "tool" && <p className="text-[9px] text-text-secondary truncate">{lastAgentResponse.tool_used !== "none" ? lastAgentResponse.tool_used : "Skipped"}</p>}
                          {!isSecurity && step.key === "confidence" && <p className="text-[9px] text-text-secondary">{Math.round(lastAgentResponse.confidence * 100)}%</p>}
                          {!isSecurity && step.key === "gate" && <p className={cn("text-[9px]", lastAgentResponse.escalated ? "text-danger" : "text-success")}>{lastAgentResponse.escalated ? "Escalated" : "Passed"}</p>}
                        </div>
                      </motion.div>
                    );
                  })
                ) : (
                  <p className="text-[11px] text-text-secondary text-center py-8">No execution data yet</p>
                )}
              </div>
            )}

            {activeTab === "security" && (
              <div className="space-y-3">
                {isInjection && lastAgentResponse ? (
                  <>
                    <div className="space-y-1.5 text-[11px] font-mono">
                      {[
                        { label: "Injection", value: "TRUE", color: "text-danger" },
                        { label: "Decision", value: "Blocked", color: "text-danger" },
                        { label: "Pipeline", value: "Security", color: "text-warning" },
                        { label: "Confidence", value: `${Math.round(lastAgentResponse.confidence * 100)}%`, color: "text-danger" },
                        { label: "Escalation", value: "Required", color: "text-danger" },
                      ].map((item) => (
                        <div key={item.label} className="flex justify-between p-1.5 rounded bg-danger/5 border border-danger/10">
                          <span className="text-text-secondary">{item.label}</span>
                          <span className={cn("truncate ml-3 max-w-[60%] text-right font-medium", item.color)}>{item.value}</span>
                        </div>
                      ))}
                    </div>
                    {lastAgentResponse.injection_patterns && lastAgentResponse.injection_patterns.length > 0 && (
                      <div className="space-y-1.5">
                        <p className="text-[9px] font-semibold text-text-secondary uppercase tracking-wider">Patterns</p>
                        <div className="space-y-1">
                          {lastAgentResponse.injection_patterns.map((pattern, i) => (
                            <div key={i} className="p-1.5 rounded bg-danger/5 border border-danger/10 text-[9px] font-mono text-danger/80 break-all">
                              {pattern}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <p className="text-[11px] text-text-secondary text-center py-8">No threats detected</p>
                )}
              </div>
            )}

            {activeTab === "json" && (
              <div className="relative">
                <div className="absolute top-0 right-0"><CopyJsonButton data={lastAgentResponse || { status: "waiting" }} /></div>
                <pre className="text-[10px] text-text-secondary font-mono whitespace-pre-wrap break-all leading-relaxed pr-6">
                  {lastAgentResponse ? JSON.stringify(lastAgentResponse, null, 2) : '{\n  "status": "waiting"\n}'}
                </pre>
              </div>
            )}

            {activeTab === "tools" && (
              <div className="space-y-2">
                {isInjection ? (
                  <div className="p-2.5 rounded-lg bg-danger/5 border border-danger/10 text-[11px] space-y-1">
                    <div className="flex items-center gap-2">
                      <Ban className="w-3 h-3 text-danger" />
                      <span className="font-medium text-danger">Tools Blocked</span>
                    </div>
                    <p className="text-text-secondary">Skipped due to injection detection.</p>
                  </div>
                ) : lastAgentResponse?.tool_used && lastAgentResponse.tool_used !== "none" ? (
                  <div className="p-2.5 rounded-lg glass text-[11px] space-y-1">
                    <div className="flex items-center gap-2">
                      <Wrench className="w-3 h-3 text-primary" />
                      <span className="font-medium text-text-primary">{lastAgentResponse.tool_used}</span>
                      <Badge variant="success" className="text-[8px]">OK</Badge>
                    </div>
                  </div>
                ) : (
                  <p className="text-[11px] text-text-secondary text-center py-8">No tools called</p>
                )}
              </div>
            )}

            {activeTab === "agent" && (
              <div className="space-y-1.5 text-[11px] font-mono">
                {lastAgentResponse ? (
                  Object.entries({
                    intent: lastAgentResponse.intent,
                    confidence: lastAgentResponse.confidence,
                    escalated: String(lastAgentResponse.escalated),
                    tool_used: lastAgentResponse.tool_used,
                    citations: lastAgentResponse.citations?.length || 0,
                    injection: String(lastAgentResponse.prompt_injection_detected),
                  }).map(([key, value]) => (
                    <div key={key} className={cn(
                      "flex justify-between p-1.5 rounded",
                      key === "injection" && value === "true" ? "bg-danger/5 border border-danger/10" : "bg-white/[0.03]"
                    )}>
                      <span className="text-text-secondary truncate">{key}</span>
                      <span className={cn(
                        "truncate ml-3 max-w-[60%] text-right",
                        key === "injection" && value === "true" ? "text-danger font-medium" : "text-primary"
                      )}>{String(value)}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-text-secondary text-center py-8">No state</p>
                )}
              </div>
            )}

            {activeTab === "rag" && (
              <div className="space-y-2">
                {isInjection ? (
                  <div className="p-2.5 rounded-lg bg-danger/5 border border-danger/10 text-[11px] space-y-1">
                    <div className="flex items-center gap-2">
                      <Ban className="w-3 h-3 text-danger" />
                      <span className="font-medium text-danger">RAG Skipped</span>
                    </div>
                  </div>
                ) : lastAgentResponse?.citations && lastAgentResponse.citations.length > 0 ? (
                  lastAgentResponse.citations.map((c, i) => (
                    <div key={i} className="p-2.5 rounded-lg glass text-[11px]">
                      <p className="font-medium text-text-primary mb-0.5 truncate">
                        {typeof c === "object" && c !== null && "title" in c ? String((c as Record<string, unknown>).title) : `Doc ${i + 1}`}
                      </p>
                      <p className="text-text-secondary line-clamp-2">
                        {typeof c === "object" && c !== null && "content_preview" in c ? String((c as Record<string, unknown>).content_preview) : JSON.stringify(c)}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-[11px] text-text-secondary text-center py-8">No RAG results</p>
                )}
              </div>
            )}
          </ScrollArea>
        </motion.div>
      ) : (
        <motion.button
          key="toggle"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={toggleInspector}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-20 p-2 rounded-l-lg bg-bg-secondary/80 backdrop-blur-xl border border-r-0 border-glass-border text-text-secondary hover:text-text-primary hover:bg-white/10 transition-all"
          aria-label="Open inspector"
        >
          <PanelRightOpen className="w-4 h-4" />
        </motion.button>
      )}
    </AnimatePresence>
  );
}

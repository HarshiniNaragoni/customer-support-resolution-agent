import { motion, AnimatePresence } from "framer-motion";
import {
  Brain,
  Target,
  Wrench,
  BookOpen,
  Shield,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  FileText,
  ChevronDown,
  ChevronUp,
  Timer,
  Circle,
  X,
  Eye,
  EyeOff,
  Ban,
  MessageSquare,
} from "lucide-react";
import { useState, useMemo } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAppStore } from "@/store";
import { cn } from "@/lib/utils";

function Section({ title, icon: Icon, children, defaultOpen = true }: {
  title: string;
  icon: typeof Brain;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-glass-border last:border-0">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2.5 w-full px-4 py-3 hover:bg-white/5 transition-colors"
      >
        <Icon className="w-3.5 h-3.5 text-primary" />
        <span className="text-xs font-semibold text-text-primary flex-1 text-left">{title}</span>
        {open ? <ChevronUp className="w-3 h-3 text-text-secondary" /> : <ChevronDown className="w-3 h-3 text-text-secondary" />}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
            <div className="px-4 pb-3">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ConfidenceBar({ value }: { value: number }) {
  const pct = Math.round(value * 100);
  const color = pct >= 75 ? "bg-success" : pct >= 50 ? "bg-warning" : "bg-danger";
  const glow = pct >= 75 ? "shadow-[0_0_10px_rgba(34,197,94,0.3)]" : pct >= 50 ? "shadow-[0_0_10px_rgba(245,158,11,0.3)]" : "shadow-[0_0_10px_rgba(239,68,68,0.3)]";

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-xs text-text-secondary">Confidence Score</span>
        <span className="text-sm font-bold text-text-primary">{pct}%</span>
      </div>
      <div className="h-2 rounded-full bg-white/10 overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className={cn("h-full rounded-full", color, glow)}
        />
      </div>
    </div>
  );
}

const TIMELINE_STEPS = [
  { key: "query", label: "Customer Query", icon: FileText },
  { key: "intent", label: "Intent Detection", icon: Target },
  { key: "retrieval", label: "Policy Retrieval", icon: BookOpen },
  { key: "tool", label: "Tool Execution", icon: Wrench },
  { key: "confidence", label: "Confidence Evaluation", icon: Brain },
  { key: "gate", label: "Human Approval Check", icon: Shield },
  { key: "resolution", label: "Final Resolution", icon: CheckCircle2 },
];

const SECURITY_TIMELINE_STEPS = [
  { key: "received", label: "Message Received", icon: FileText },
  { key: "scan", label: "Security Scan", icon: ShieldAlert },
  { key: "detected", label: "Prompt Injection Detected", icon: Ban },
  { key: "intent_skip", label: "Intent Classification Skipped", icon: EyeOff },
  { key: "rag_skip", label: "RAG Retrieval Skipped", icon: EyeOff },
  { key: "tool_skip", label: "Tool Execution Skipped", icon: EyeOff },
  { key: "safe_response", label: "Safe Response Generated", icon: CheckCircle2 },
  { key: "escalated", label: "Escalated", icon: AlertTriangle },
];

function SecurityTimeline() {
  return (
    <div className="space-y-0">
      {SECURITY_TIMELINE_STEPS.map((step, i) => {
        const isLast = i === SECURITY_TIMELINE_STEPS.length - 1;
        const StepIcon = step.icon;
        const isDetected = step.key === "detected";

        return (
          <motion.div
            key={step.key}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.08, duration: 0.3 }}
            className="flex items-start gap-3 relative"
          >
            {!isLast && (
              <div className="absolute left-[11px] top-[24px] w-[2px] h-[calc(100%-12px)] bg-danger/30" />
            )}
            <div className={cn(
              "w-6 h-6 rounded-full flex items-center justify-center shrink-0 z-10 transition-all",
              isDetected
                ? "bg-danger/20 border border-danger/40 shadow-[0_0_8px_rgba(239,68,68,0.4)]"
                : "bg-danger/10 border border-danger/30"
            )}>
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: i * 0.08 + 0.1, type: "spring" }}
              >
                <CheckCircle2 className={cn("w-3 h-3", isDetected ? "text-danger" : "text-danger/70")} />
              </motion.div>
            </div>
            <div className="pb-4 pt-0.5">
              <p className={cn(
                "text-xs font-medium",
                isDetected ? "text-danger" : "text-text-primary"
              )}>
                {step.label}
              </p>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

function ExecutionTimeline({ response }: { response: { intent: string; tool_used: string; confidence: number; escalated: boolean; citations: unknown[] } }) {
  const steps = useMemo(() => {
    const completed: string[] = ["query", "intent"];

    if (response.citations && response.citations.length > 0) completed.push("retrieval");
    else completed.push("retrieval");

    if (response.tool_used && response.tool_used !== "none") completed.push("tool");
    else completed.push("tool");

    completed.push("confidence");
    completed.push("gate");
    completed.push("resolution");

    return completed;
  }, [response]);

  return (
    <div className="space-y-0">
      {TIMELINE_STEPS.map((step, i) => {
        const isCompleted = steps.includes(step.key);
        const isLast = i === TIMELINE_STEPS.length - 1;

        return (
          <motion.div
            key={step.key}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.08, duration: 0.3 }}
            className="flex items-start gap-3 relative"
          >
            {!isLast && (
              <div className="absolute left-[11px] top-[24px] w-[2px] h-[calc(100%-12px)] bg-glass-border" />
            )}
            <div className={cn(
              "w-6 h-6 rounded-full flex items-center justify-center shrink-0 z-10 transition-all",
              isCompleted
                ? "bg-success/20 border border-success/40"
                : "bg-white/5 border border-glass-border"
            )}>
              {isCompleted ? (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: i * 0.08 + 0.1, type: "spring" }}
                >
                  <CheckCircle2 className="w-3 h-3 text-success" />
                </motion.div>
              ) : (
                <Circle className="w-3 h-3 text-text-secondary/30" />
              )}
            </div>
            <div className="pb-4 pt-0.5">
              <p className={cn(
                "text-xs font-medium",
                isCompleted ? "text-text-primary" : "text-text-secondary/50"
              )}>
                {step.label}
              </p>
              {step.key === "intent" && (
                <p className="text-[10px] text-primary mt-0.5">{response.intent.replace(/_/g, " ")}</p>
              )}
              {step.key === "tool" && (
                <p className="text-[10px] text-text-secondary mt-0.5">
                  {response.tool_used !== "none" ? response.tool_used : "No tool needed"}
                </p>
              )}
              {step.key === "confidence" && (
                <p className={cn("text-[10px] mt-0.5", response.confidence >= 0.55 ? "text-success" : "text-warning")}>
                  {Math.round(response.confidence * 100)}%
                </p>
              )}
              {step.key === "gate" && (
                <p className={cn("text-[10px] mt-0.5", response.escalated ? "text-danger" : "text-success")}>
                  {response.escalated ? "Escalated" : "Passed"}
                </p>
              )}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

function SecurityThreatCard({ response }: { response: { confidence: number; injection_patterns: string[] } }) {
  const pipelineSteps = [
    { label: "Security Filter", done: true },
    { label: "Intent Classification Skipped", done: true },
    { label: "RAG Retrieval Skipped", done: true },
    { label: "Tool Execution Skipped", done: true },
    { label: "Safe Response Generated", done: true },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="rounded-xl border border-danger/30 bg-danger/5 backdrop-blur-xl overflow-hidden shadow-[0_0_30px_rgba(239,68,68,0.15)]"
    >
      {/* Header */}
      <div className="px-4 py-3 border-b border-danger/20 bg-danger/10">
        <div className="flex items-center gap-2.5">
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            className="w-8 h-8 rounded-lg bg-danger/20 flex items-center justify-center"
          >
            <ShieldAlert className="w-4 h-4 text-danger" />
          </motion.div>
          <div>
            <p className="text-xs font-bold text-danger uppercase tracking-wider">Security Threat</p>
            <p className="text-sm font-semibold text-text-primary">Prompt Injection Detected</p>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Status */}
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-success" />
          <span className="text-xs font-medium text-success">Blocked Successfully</span>
        </div>

        {/* Pipeline */}
        <div className="space-y-2">
          <p className="text-[10px] font-semibold text-text-secondary uppercase tracking-wider">Pipeline</p>
          <div className="space-y-1.5">
            {pipelineSteps.map((step) => (
              <div key={step.label} className="flex items-center gap-2">
                <CheckCircle2 className="w-3 h-3 text-success shrink-0" />
                <span className="text-xs text-text-secondary">{step.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Matched Patterns */}
        {response.injection_patterns.length > 0 && (
          <div className="space-y-2">
            <p className="text-[10px] font-semibold text-text-secondary uppercase tracking-wider">Matched Patterns</p>
            <div className="flex flex-wrap gap-1.5">
              {response.injection_patterns.slice(0, 6).map((pattern, i) => (
                <Badge key={i} variant="danger" className="text-[9px] font-mono">
                  {pattern.length > 40 ? pattern.substring(0, 40) + "..." : pattern}
                </Badge>
              ))}
              {response.injection_patterns.length > 6 && (
                <Badge variant="ghost" className="text-[9px]">+{response.injection_patterns.length - 6} more</Badge>
              )}
            </div>
          </div>
        )}

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-3">
          <div className="p-2.5 rounded-lg bg-white/[0.03] border border-glass-border text-center">
            <p className="text-lg font-bold text-danger">{Math.round(response.confidence * 100)}%</p>
            <p className="text-[9px] text-text-secondary mt-0.5">Confidence</p>
          </div>
          <div className="p-2.5 rounded-lg bg-white/[0.03] border border-glass-border text-center">
            <p className="text-sm font-bold text-danger">Required</p>
            <p className="text-[9px] text-text-secondary mt-0.5">Escalation</p>
          </div>
          <div className="p-2.5 rounded-lg bg-white/[0.03] border border-glass-border text-center">
            <p className="text-sm font-bold text-success">Blocked</p>
            <p className="text-[9px] text-text-secondary mt-0.5">Status</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export function AIResolutionPanel() {
  const { lastAgentResponse } = useAppStore();
  const isInjection = lastAgentResponse?.intent === "prompt_injection" || lastAgentResponse?.prompt_injection_detected;

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-3 border-b border-glass-border">
        <div className="flex items-center gap-2">
          <div className={cn(
            "w-6 h-6 rounded-lg flex items-center justify-center",
            isInjection
              ? "bg-gradient-to-br from-danger to-danger/60"
              : "bg-gradient-to-br from-primary to-accent"
          )}>
            {isInjection ? (
              <ShieldAlert className="w-3 h-3 text-white" />
            ) : (
              <Brain className="w-3 h-3 text-white" />
            )}
          </div>
          <h3 className="text-sm font-semibold text-text-primary">
            {isInjection ? "Security Alert" : "AI Resolution"}
          </h3>
        </div>
      </div>

      <ScrollArea className="flex-1">
        {lastAgentResponse ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="divide-y divide-glass-border">
            {isInjection ? (
              <>
                {/* Security Threat Card */}
                <Section title="Security Threat" icon={ShieldAlert}>
                  <SecurityThreatCard response={lastAgentResponse} />
                </Section>

                {/* Security Timeline */}
                <Section title="Execution Timeline" icon={Timer}>
                  <SecurityTimeline />
                </Section>

                {/* Resolution */}
                <Section title="Safe Response" icon={FileText}>
                  <p className="text-xs text-text-secondary leading-relaxed whitespace-pre-wrap">{lastAgentResponse.resolution}</p>
                </Section>

                {/* Human Approval Required */}
                <Section title="Human Review Required" icon={Shield}>
                  <div className="space-y-2">
                    <p className="text-xs text-danger">This message was flagged as a prompt injection attempt and requires human review.</p>
                    <div className="flex gap-2">
                      <Button variant="success" size="sm" className="flex-1"><CheckCircle2 className="w-3 h-3" />Approve</Button>
                      <Button variant="danger" size="sm" className="flex-1"><X className="w-3 h-3" />Block</Button>
                    </div>
                  </div>
                </Section>
              </>
            ) : (
              <>
                {/* Execution Timeline */}
                <Section title="Execution Timeline" icon={Timer}>
                  <ExecutionTimeline response={lastAgentResponse} />
                </Section>

                {/* Intent */}
                <Section title="Detected Intent" icon={Target}>
                  <Badge variant="default" className="text-xs">{lastAgentResponse.intent.replace(/_/g, " ")}</Badge>
                </Section>

                {/* Confidence */}
                <Section title="Confidence Score" icon={Target}>
                  <ConfidenceBar value={lastAgentResponse.confidence} />
                </Section>

                {/* Tool Used */}
                <Section title="Tool Used" icon={Wrench}>
                  <Badge variant={lastAgentResponse.tool_used !== "none" ? "secondary" : "ghost"} className="text-xs">
                    {lastAgentResponse.tool_used !== "none" ? lastAgentResponse.tool_used : "No tool needed"}
                  </Badge>
                </Section>

                {/* Escalation Status */}
                <Section title="Escalation Status" icon={AlertTriangle}>
                  <div className="flex items-center gap-2">
                    {lastAgentResponse.escalated ? (
                      <>
                        <AlertTriangle className="w-4 h-4 text-danger" />
                        <span className="text-xs text-danger font-medium">Escalated to Human</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-success" />
                        <span className="text-xs text-success font-medium">AI Resolved</span>
                      </>
                    )}
                  </div>
                </Section>

                {/* Citations */}
                {lastAgentResponse.citations && lastAgentResponse.citations.length > 0 && (
                  <Section title="Policy Citations" icon={BookOpen}>
                    <div className="space-y-2">
                      {lastAgentResponse.citations.map((c, i) => (
                        <div key={i} className="p-2.5 rounded-lg bg-white/[0.03] border border-glass-border text-xs">
                          <p className="text-text-primary font-medium">
                            {typeof c === "object" && c !== null && "title" in c ? String((c as Record<string, unknown>).title) : `Citation ${i + 1}`}
                          </p>
                          {typeof c === "object" && c !== null && "content_preview" in c && (
                            <p className="text-text-secondary mt-1 line-clamp-2">{String((c as Record<string, unknown>).content_preview)}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </Section>
                )}

                {/* Resolution */}
                <Section title="Resolution" icon={FileText}>
                  <p className="text-xs text-text-secondary leading-relaxed whitespace-pre-wrap">{lastAgentResponse.resolution}</p>
                </Section>

                {/* Human Approval */}
                {lastAgentResponse.escalated && (
                  <Section title="Human Approval Required" icon={Shield}>
                    <div className="space-y-2">
                      <p className="text-xs text-warning">This issue requires human intervention.</p>
                      <div className="flex gap-2">
                        <Button variant="success" size="sm" className="flex-1"><CheckCircle2 className="w-3 h-3" />Approve</Button>
                        <Button variant="danger" size="sm" className="flex-1"><AlertTriangle className="w-3 h-3" />Reject</Button>
                      </div>
                    </div>
                  </Section>
                )}
              </>
            )}
          </motion.div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center px-4 py-12">
            <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center mb-3">
              <Brain className="w-6 h-6 text-text-secondary/30" />
            </div>
            <p className="text-xs text-text-secondary">Send a message to see AI analysis</p>
          </div>
        )}
      </ScrollArea>
    </div>
  );
}

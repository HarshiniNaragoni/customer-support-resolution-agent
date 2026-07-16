import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bot, User, Send, Loader2, Sparkles, Copy, Check, RefreshCw, Trash2, PanelRightOpen, PanelRightClose, Package, RotateCcw, FileText, UserCircle } from "lucide-react";
import { useInvokeAgent } from "@/hooks";
import { useAppStore } from "@/store";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { InspectorPanel } from "@/components/common/inspector-panel";
import { cn, formatTime } from "@/lib/utils";
import type { ChatMessage } from "@/types";

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
      className="p-1 rounded hover:bg-white/10 transition-colors text-text-secondary hover:text-text-primary"
      aria-label="Copy message"
    >
      {copied ? <Check className="w-3 h-3 text-success" /> : <Copy className="w-3 h-3" />}
    </button>
  );
}

function MessageBubble({ msg, onRetry }: { msg: ChatMessage; onRetry?: (text: string) => void }) {
  const isCustomer = msg.role === "customer";
  const r = msg.agentResponse;
  const isError = msg.content.includes("Connection error") || msg.content.includes("trouble connecting");

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={cn("flex gap-2.5 max-w-[85%]", isCustomer ? "ml-auto flex-row-reverse" : "")}
    >
      <div className={cn(
        "w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5",
        isCustomer ? "bg-gradient-to-br from-blue-500 to-cyan-400" : "bg-gradient-to-br from-primary to-accent"
      )}>
        {isCustomer ? <User className="w-3.5 h-3.5 text-white" /> : <Bot className="w-3.5 h-3.5 text-white" />}
      </div>
      <div className={cn("space-y-1 min-w-0", isCustomer ? "text-right" : "")}>
        <div className="group relative inline-block">
          <div className={cn(
            "px-3.5 py-2 text-sm leading-relaxed inline-block",
            isCustomer
              ? "bg-secondary/20 border border-secondary/20 text-text-primary rounded-2xl rounded-tr-md"
              : "glass border-glass-border text-text-primary rounded-2xl rounded-tl-md",
            isError && "border-danger/30 bg-danger/5"
          )}>
            {msg.content}
          </div>
          <div className={cn(
            "absolute -bottom-6 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1",
            isCustomer ? "right-0" : "left-0"
          )}>
            <CopyButton text={msg.content} />
            {isError && onRetry && (
              <button onClick={() => onRetry(msg.content)} className="p-1 rounded hover:bg-white/10 transition-colors text-text-secondary hover:text-primary" aria-label="Retry">
                <RefreshCw className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
        {r && (
          <div className="flex flex-wrap gap-1 mt-0.5" style={{ justifyContent: isCustomer ? "flex-end" : "flex-start" }}>
            <Badge variant="default" className="text-[9px] px-1.5 py-0">{r.intent.replace(/_/g, " ")}</Badge>
            <Badge variant={r.confidence >= 0.55 ? "success" : "warning"} className="text-[9px] px-1.5 py-0">{Math.round(r.confidence * 100)}%</Badge>
            {r.escalated && <Badge variant="danger" className="text-[9px] px-1.5 py-0">Escalated</Badge>}
            {r.tool_used !== "none" && <Badge variant="secondary" className="text-[9px] px-1.5 py-0">{r.tool_used}</Badge>}
          </div>
        )}
        <p className="text-[10px] text-text-secondary">{formatTime(msg.timestamp)}</p>
      </div>
    </motion.div>
  );
}

const QUICK_ACTIONS = [
  { q: "Where is my order ORD-2024-001?", label: "Track Order", icon: Package },
  { q: "I want to return a product", label: "Return / Refund", icon: RotateCcw },
  { q: "What is your refund policy?", label: "Policy", icon: FileText },
  { q: "I need help with my account", label: "Account", icon: UserCircle },
];

function EmptyState({ onSelect }: { onSelect: (q: string) => void }) {
  return (
    <div className="flex flex-col items-center justify-center h-full px-4 select-none">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/10 flex items-center justify-center mb-4"
      >
        <Bot className="w-7 h-7 text-primary" />
      </motion.div>
      <motion.h3
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="text-lg font-bold text-text-primary mb-1"
      >
        How can I help you?
      </motion.h3>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.15 }}
        className="text-xs text-text-secondary mb-6"
      >
        Ask about orders, refunds, policies, or your account.
      </motion.p>

      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="flex flex-wrap justify-center gap-2 max-w-md"
      >
        {QUICK_ACTIONS.map((item, i) => (
          <motion.button
            key={item.label}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 + i * 0.04 }}
            onClick={() => onSelect(item.q)}
            className="flex items-center gap-2 px-3 py-2 rounded-xl glass border border-transparent hover:border-primary/30 hover:bg-white/10 transition-all group text-left"
          >
            <item.icon className="w-3.5 h-3.5 text-text-secondary group-hover:text-primary transition-colors shrink-0" />
            <div className="min-w-0">
              <p className="text-xs font-medium text-text-primary group-hover:text-primary transition-colors truncate">{item.label}</p>
            </div>
          </motion.button>
        ))}
      </motion.div>
    </div>
  );
}

export default function AssistantPage() {
  const { chatMessages, addChatMessage, clearChat, setLastAgentResponse, inspectorOpen, toggleInspector } = useAppStore();
  const invokeAgent = useInvokeAgent();
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [chatMessages, invokeAgent.isPending]);

  const handleSend = useCallback(async (text?: string) => {
    const msg = (text || input).trim();
    if (!msg || invokeAgent.isPending) return;

    addChatMessage({ id: crypto.randomUUID(), role: "customer", content: msg, timestamp: new Date().toISOString() });
    if (!text) setInput("");

    try {
      const res = await invokeAgent.mutateAsync({ customer_message: msg });
      addChatMessage({ id: crypto.randomUUID(), role: "assistant", content: res.resolution, timestamp: new Date().toISOString(), agentResponse: res });
      setLastAgentResponse(res);
    } catch (err) {
      console.error("Agent invoke failed:", err);
      addChatMessage({ id: crypto.randomUUID(), role: "assistant", content: "Connection error. Please try again.", timestamp: new Date().toISOString() });
    }
  }, [input, invokeAgent, addChatMessage, setLastAgentResponse]);

  return (
    <div className="flex h-[calc(100vh-64px)]">
      {/* Chat Column */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="px-4 py-2.5 border-b border-glass-border flex items-center gap-3 shrink-0">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center shrink-0">
            <Bot className="w-4 h-4 text-white" />
          </div>
          <div className="min-w-0">
            <h2 className="text-sm font-bold text-text-primary">AI Assistant</h2>
            <p className="text-[10px] text-text-secondary truncate">Orders, refunds, policies, accounts</p>
          </div>
          <div className="ml-auto flex items-center gap-1">
            {chatMessages.length > 0 && (
              <button onClick={clearChat} className="p-1.5 rounded-lg hover:bg-white/5 transition-colors text-text-secondary hover:text-danger" aria-label="Clear conversation">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              onClick={toggleInspector}
              className={cn(
                "p-1.5 rounded-lg transition-colors",
                inspectorOpen ? "bg-primary/15 text-primary" : "hover:bg-white/5 text-text-secondary hover:text-text-primary"
              )}
              aria-label={inspectorOpen ? "Close inspector" : "Open inspector"}
            >
              {inspectorOpen ? <PanelRightClose className="w-4 h-4" /> : <PanelRightOpen className="w-4 h-4" />}
            </button>
            <Badge variant="default" className="text-[10px]"><Sparkles className="w-2.5 h-2.5 mr-1" />AI Active</Badge>
          </div>
        </div>

        {/* Messages */}
        <ScrollArea ref={scrollRef} className="flex-1 px-5 py-4">
          {chatMessages.length === 0 ? (
            <EmptyState onSelect={(q) => { setInput(q); inputRef.current?.focus(); }} />
          ) : (
            <div className="space-y-5">
              <AnimatePresence>
                {chatMessages.map((m) => (
                  <MessageBubble
                    key={m.id}
                    msg={m}
                    onRetry={m.role === "assistant" ? (text) => handleSend(text.replace("Connection error. Please try again.", "").trim() || "Please try again") : undefined}
                  />
                ))}
              </AnimatePresence>
              {invokeAgent.isPending && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-2.5">
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center shrink-0">
                    <Bot className="w-3.5 h-3.5 text-white" />
                  </div>
                  <div className="glass rounded-2xl rounded-tl-md px-4 py-2.5 flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 bg-primary/60 rounded-full animate-bounce [animation-delay:-0.3s]" />
                    <div className="w-1.5 h-1.5 bg-primary/60 rounded-full animate-bounce [animation-delay:-0.15s]" />
                    <div className="w-1.5 h-1.5 bg-primary/60 rounded-full animate-bounce" />
                  </div>
                </motion.div>
              )}
            </div>
          )}
        </ScrollArea>

        {/* Input Bar — sticky bottom */}
        <div className="px-4 py-3 border-t border-glass-border bg-bg-primary/80 backdrop-blur-xl shrink-0">
          <div className="flex items-center gap-2">
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
              placeholder="Type your message..."
              className="flex-1 h-10 rounded-xl border border-glass-border bg-white/5 px-4 text-sm text-text-primary placeholder:text-text-secondary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 transition-all"
              aria-label="Message input"
            />
            <Button size="icon" onClick={() => handleSend()} disabled={!input.trim() || invokeAgent.isPending} className="shrink-0 h-10 w-10 rounded-xl">
              {invokeAgent.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Inspector Side Panel */}
      <InspectorPanel />
    </div>
  );
}

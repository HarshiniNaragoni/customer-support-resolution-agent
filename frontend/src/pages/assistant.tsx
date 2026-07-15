import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bot, User, Send, Loader2, Sparkles, Copy, Check, RefreshCw, Trash2 } from "lucide-react";
import { useInvokeAgent } from "@/hooks";
import { useAppStore } from "@/store";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BottomDrawer } from "@/components/common/bottom-drawer";
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
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className={cn("flex gap-3 max-w-3xl", isCustomer ? "ml-auto flex-row-reverse" : "")}>
      <div className={cn("w-9 h-9 rounded-full flex items-center justify-center shrink-0", isCustomer ? "bg-gradient-to-br from-blue-500 to-cyan-400" : "bg-gradient-to-br from-primary to-accent")}>
        {isCustomer ? <User className="w-4 h-4 text-white" /> : <Bot className="w-4 h-4 text-white" />}
      </div>
      <div className={cn("space-y-1.5", isCustomer ? "text-right" : "")}>
        <div className="group relative">
          <div className={cn("px-4 py-3 text-sm leading-relaxed inline-block", isCustomer ? "bg-secondary/20 border border-secondary/20 text-text-primary rounded-2xl rounded-tr-md" : "glass border-glass-border text-text-primary rounded-2xl rounded-tl-md", isError && "border-danger/30 bg-danger/5")}>
            {msg.content}
          </div>
          <div className={cn("absolute -bottom-8 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1", isCustomer ? "right-0" : "left-0")}>
            <CopyButton text={msg.content} />
            {isError && onRetry && (
              <button onClick={() => onRetry(msg.content)} className="p-1 rounded hover:bg-white/10 transition-colors text-text-secondary hover:text-primary" aria-label="Retry">
                <RefreshCw className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
        {r && (
          <div className="flex flex-wrap gap-1.5 mt-1">
            <Badge variant="default" className="text-[10px]">{r.intent.replace(/_/g, " ")}</Badge>
            <Badge variant={r.confidence >= 0.75 ? "success" : "warning"} className="text-[10px]">{Math.round(r.confidence * 100)}%</Badge>
            {r.escalated && <Badge variant="danger" className="text-[10px]">Escalated</Badge>}
            {r.tool_used !== "none" && <Badge variant="secondary" className="text-[10px]">{r.tool_used}</Badge>}
          </div>
        )}
        <p className="text-[10px] text-text-secondary">{formatTime(msg.timestamp)}</p>
      </div>
    </motion.div>
  );
}

export default function AssistantPage() {
  const { chatMessages, addChatMessage, clearChat, setLastAgentResponse } = useAppStore();
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
    <div className="flex flex-col h-[calc(100vh-64px)]">
      <div className="px-6 py-4 border-b border-glass-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-base font-bold text-text-primary">AI Assistant</h2>
            <p className="text-xs text-text-secondary">Ask me anything about orders, refunds, policies, or account issues.</p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            {chatMessages.length > 0 && (
              <button onClick={clearChat} className="p-2 rounded-lg hover:bg-white/5 transition-colors text-text-secondary hover:text-danger" aria-label="Clear conversation">
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            <Badge variant="default" className="text-xs"><Sparkles className="w-3 h-3 mr-1" />AI Active</Badge>
          </div>
        </div>
      </div>

      <ScrollArea ref={scrollRef} className="flex-1 px-6 py-6">
        {chatMessages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.5 }} className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center mb-5">
              <Bot className="w-10 h-10 text-primary" />
            </motion.div>
            <motion.h3 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="text-xl font-bold text-text-primary mb-2">How can I help you today?</motion.h3>
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="text-sm text-text-secondary max-w-sm mb-8">I can check order status, process refunds, answer policy questions, and more.</motion.p>
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="grid grid-cols-2 gap-3 max-w-md">
              {[{ q: "Where is my order ORD-2024-001?", label: "Track Order" }, { q: "I want to return a product", label: "Return/Refund" }, { q: "What is your refund policy?", label: "Policy Question" }, { q: "I need help with my account", label: "Account Help" }].map((item) => (
                <button key={item.label} onClick={() => { setInput(item.q); inputRef.current?.focus(); }} className="p-3 rounded-xl glass text-left hover:bg-white/10 transition-all group">
                  <p className="text-xs font-semibold text-text-primary group-hover:text-primary transition-colors">{item.label}</p>
                  <p className="text-[10px] text-text-secondary mt-0.5 line-clamp-1">{item.q}</p>
                </button>
              ))}
            </motion.div>
          </div>
        ) : (
          <div className="space-y-5 max-w-3xl mx-auto">
            <AnimatePresence>{chatMessages.map((m) => <MessageBubble key={m.id} msg={m} onRetry={m.role === "assistant" ? (text) => handleSend(text.replace("Connection error. Please try again.", "").trim() || "Please try again") : undefined} />)}</AnimatePresence>
            {invokeAgent.isPending && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-3">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center shrink-0"><Bot className="w-4 h-4 text-white" /></div>
                <div className="glass rounded-2xl rounded-tl-md px-4 py-3 flex items-center gap-1.5">
                  <div className="w-2 h-2 bg-primary/60 rounded-full animate-bounce [animation-delay:-0.3s]" />
                  <div className="w-2 h-2 bg-primary/60 rounded-full animate-bounce [animation-delay:-0.15s]" />
                  <div className="w-2 h-2 bg-primary/60 rounded-full animate-bounce" />
                </div>
              </motion.div>
            )}
          </div>
        )}
      </ScrollArea>

      <div className="px-6 py-4 border-t border-glass-border">
        <div className="flex items-center gap-3 max-w-3xl mx-auto">
          <button className="p-2.5 rounded-xl hover:bg-white/5 transition-colors text-text-secondary hover:text-text-primary" aria-label="Attach file">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
          </button>
          <input ref={inputRef} value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }} placeholder="Type your message..." className="flex-1 h-11 rounded-xl border border-glass-border bg-white/5 px-4 text-sm text-text-primary placeholder:text-text-secondary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 transition-all" aria-label="Message input" />
          <Button size="lg" onClick={() => handleSend()} disabled={!input.trim() || invokeAgent.isPending} className="shrink-0">
            {invokeAgent.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </Button>
        </div>
      </div>
      <BottomDrawer />
    </div>
  );
}

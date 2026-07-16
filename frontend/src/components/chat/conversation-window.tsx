import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Bot, User, Loader2, Paperclip, Copy, Check, RefreshCw, Trash2 } from "lucide-react";
import { useInvokeAgent } from "@/hooks";
import { useAppStore } from "@/store";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn, formatTime } from "@/lib/utils";
import type { ChatMessage } from "@/types";

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button
      onClick={handleCopy}
      className="p-1 rounded hover:bg-white/10 transition-colors text-text-secondary hover:text-text-primary"
      aria-label="Copy message"
    >
      {copied ? <Check className="w-3 h-3 text-success" /> : <Copy className="w-3 h-3" />}
    </button>
  );
}

function TypingIndicator() {
  return (
    <div className="flex items-center gap-1.5 px-4 py-3">
      <div className="w-2 h-2 bg-primary/60 rounded-full animate-bounce [animation-delay:-0.3s]" />
      <div className="w-2 h-2 bg-primary/60 rounded-full animate-bounce [animation-delay:-0.15s]" />
      <div className="w-2 h-2 bg-primary/60 rounded-full animate-bounce" />
    </div>
  );
}

function MessageBubble({ message, onRetry }: { message: ChatMessage; onRetry?: (text: string) => void }) {
  const isCustomer = message.role === "customer";
  const response = message.agentResponse;
  const isError = message.content.includes("Connection error") || message.content.includes("trouble connecting");

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.3 }}
      className={cn("flex gap-3 max-w-[85%]", isCustomer ? "ml-auto flex-row-reverse" : "")}
    >
      <div
        className={cn(
          "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
          isCustomer
            ? "bg-gradient-to-br from-blue-500 to-cyan-400"
            : "bg-gradient-to-br from-primary to-accent"
        )}
      >
        {isCustomer ? <User className="w-4 h-4 text-white" /> : <Bot className="w-4 h-4 text-white" />}
      </div>

      <div className="space-y-1.5">
        <div className="group relative">
          <div
            className={cn(
              "px-4 py-3 rounded-2xl text-sm leading-relaxed",
              isCustomer
                ? "bg-secondary/20 border border-secondary/20 text-text-primary rounded-tr-md"
                : "glass border-glass-border text-text-primary rounded-tl-md",
              isError && "border-danger/30 bg-danger/5"
            )}
          >
            {message.content}
          </div>
          {/* Copy + Retry buttons */}
          <div className={cn(
            "absolute -bottom-8 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1",
            isCustomer ? "right-0" : "left-0"
          )}>
            <CopyButton text={message.content} />
            {isError && onRetry && (
              <button
                onClick={() => onRetry(message.content)}
                className="p-1 rounded hover:bg-white/10 transition-colors text-text-secondary hover:text-primary"
                aria-label="Retry message"
              >
                <RefreshCw className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>

        {response && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="ml-1 space-y-1.5"
          >
            <div className="flex flex-wrap gap-1.5">
              <Badge variant="default" className="text-[10px]">{response.intent.replace(/_/g, " ")}</Badge>
              <Badge
                variant={response.confidence >= 0.55 ? "success" : response.confidence >= 0.3 ? "warning" : "danger"}
                className="text-[10px]"
              >
                {Math.round(response.confidence * 100)}% confident
              </Badge>
              {response.escalated && (
                <Badge variant="danger" className="text-[10px]">Escalated</Badge>
              )}
              {response.tool_used && response.tool_used !== "none" && (
                <Badge variant="secondary" className="text-[10px]">Tool: {response.tool_used}</Badge>
              )}
            </div>
            {response.citations && response.citations.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {response.citations.map((c, i) => (
                  <Badge key={i} variant="ghost" className="text-[9px]">
                    {typeof c === "object" && c !== null && "source" in c ? String((c as Record<string, unknown>).source) : `Source ${i + 1}`}
                  </Badge>
                ))}
              </div>
            )}
          </motion.div>
        )}

        <p className={cn("text-[10px] text-text-secondary", isCustomer ? "text-right" : "")}>
          {formatTime(message.timestamp)}
        </p>
      </div>
    </motion.div>
  );
}

export function ConversationWindow() {
  const { chatMessages, addChatMessage, clearChat, selectedTicket, setLastAgentResponse } = useAppStore();
  const invokeAgent = useInvokeAgent();
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
    }
  }, [chatMessages, invokeAgent.isPending]);

  useEffect(() => {
    inputRef.current?.focus();
  }, [selectedTicket]);

  const handleSend = useCallback(async (text?: string) => {
    const msg = (text || input).trim();
    if (!msg || invokeAgent.isPending) return;

    const customerMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: "customer",
      content: msg,
      timestamp: new Date().toISOString(),
    };
    addChatMessage(customerMsg);
    if (!text) setInput("");

    try {
      const response = await invokeAgent.mutateAsync({
        customer_message: msg,
        customer_name: selectedTicket?.customer_name || "Guest",
        customer_email: selectedTicket?.customer_email || "",
        ticket_id: selectedTicket?.ticket_id || "",
      });

      const assistantMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: response.resolution,
        timestamp: new Date().toISOString(),
        agentResponse: response,
      };
      addChatMessage(assistantMsg);
      setLastAgentResponse(response);
    } catch (err) {
      console.error("Agent invoke failed:", err);
      const errorMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: "Connection error. Please try again.",
        timestamp: new Date().toISOString(),
      };
      addChatMessage(errorMsg);
    }
  }, [input, invokeAgent, selectedTicket, addChatMessage, setLastAgentResponse]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-5 py-3 border-b border-glass-border flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
            <Bot className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-text-primary">
              {selectedTicket ? `Conversation \u2014 ${selectedTicket.customer_name}` : "AI Assistant"}
            </h3>
            <p className="text-[10px] text-text-secondary">
              {selectedTicket ? `Ticket #${selectedTicket.ticket_id.slice(0, 8)}` : "Send a message to start"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {chatMessages.length > 0 && (
            <button
              onClick={clearChat}
              className="p-2 rounded-lg hover:bg-white/5 transition-colors text-text-secondary hover:text-danger"
              aria-label="Clear conversation"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
          <Badge variant="default" className="text-[10px]">AI Active</Badge>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea ref={scrollRef} className="flex-1 px-5 py-4">
        {chatMessages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center mb-4">
              <Bot className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-lg font-semibold text-text-primary mb-1">CSRA AI Assistant</h3>
            <p className="text-sm text-text-secondary max-w-sm">
              Ask me anything about orders, refunds, policies, or account issues.
            </p>
            <div className="flex flex-wrap gap-2 mt-6">
              {["Where is my order?", "I need a refund", "Reset my password", "Talk to a human"].map((q) => (
                <button
                  key={q}
                  onClick={() => { setInput(q); inputRef.current?.focus(); }}
                  className="px-3 py-1.5 rounded-lg glass text-xs text-text-secondary hover:text-text-primary hover:bg-white/10 transition-all"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <AnimatePresence>
              {chatMessages.map((msg) => (
                <MessageBubble
                  key={msg.id}
                  message={msg}
                  onRetry={msg.role === "assistant" ? (text) => handleSend(text.replace("Connection error. Please try again.", "").trim() || "Please try again") : undefined}
                />
              ))}
            </AnimatePresence>
            {invokeAgent.isPending && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center shrink-0">
                  <Bot className="w-4 h-4 text-white" />
                </div>
                <div className="glass rounded-2xl rounded-tl-md">
                  <TypingIndicator />
                </div>
              </motion.div>
            )}
          </div>
        )}
      </ScrollArea>

      {/* Input */}
      <div className="px-5 py-3 border-t border-glass-border">
        <div className="flex items-center gap-2">
          <button className="p-2 rounded-xl hover:bg-white/5 transition-colors text-text-secondary hover:text-text-primary" aria-label="Attach file">
            <Paperclip className="w-4 h-4" />
          </button>
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={selectedTicket ? `Reply to ${selectedTicket.customer_name}...` : "Ask me anything..."}
            className="flex-1 h-10 rounded-xl border border-glass-border bg-white/5 px-4 text-sm text-text-primary placeholder:text-text-secondary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 transition-all"
            aria-label="Message input"
          />
          <Button
            size="icon"
            onClick={() => handleSend()}
            disabled={!input.trim() || invokeAgent.isPending}
            className="shrink-0"
          >
            {invokeAgent.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </Button>
        </div>
      </div>
    </div>
  );
}

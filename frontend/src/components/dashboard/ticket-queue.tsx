import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Clock, AlertTriangle, CheckCircle2, XCircle, MessageSquare } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useTickets } from "@/hooks";
import { useAppStore } from "@/store";
import { cn, timeAgo } from "@/lib/utils";
import type { Ticket } from "@/types";
import { Skeleton } from "@/components/ui/skeleton";

const priorityColors: Record<string, "danger" | "warning" | "default"> = {
  high: "danger",
  medium: "warning",
  low: "default",
};

const statusConfig: Record<string, { icon: typeof CheckCircle2; color: string }> = {
  open: { icon: MessageSquare, color: "text-secondary" },
  in_progress: { icon: Clock, color: "text-warning" },
  resolved: { icon: CheckCircle2, color: "text-success" },
  escalated: { icon: AlertTriangle, color: "text-danger" },
  closed: { icon: XCircle, color: "text-text-secondary" },
};

function TicketCard({ ticket, isSelected, onClick }: { ticket: Ticket; isSelected: boolean; onClick: () => void }) {
  const sc = statusConfig[ticket.status] || statusConfig.open;
  const StatusIcon = sc.icon;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      whileHover={{ x: 2 }}
      onClick={onClick}
      className={cn(
        "p-3.5 rounded-xl border cursor-pointer transition-all duration-200",
        isSelected
          ? "bg-primary/10 border-primary/40 shadow-glow-sm"
          : "bg-white/[0.03] border-glass-border hover:bg-white/[0.06] hover:border-white/20"
      )}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-text-primary truncate">{ticket.customer_name}</p>
          <p className="text-xs text-text-secondary truncate mt-0.5">{ticket.ticket_type}</p>
        </div>
        <StatusIcon className={cn("w-4 h-4 shrink-0", sc.color)} />
      </div>
      <p className="text-xs text-text-secondary line-clamp-2 mb-2">{ticket.message}</p>
      <div className="flex items-center gap-2">
        <Badge variant={priorityColors[ticket.priority]} className="text-[10px] px-1.5 py-0">
          {ticket.priority}
        </Badge>
        <Badge variant={ticket.status === "escalated" ? "danger" : ticket.status === "resolved" ? "success" : "ghost"} className="text-[10px] px-1.5 py-0">
          {ticket.status}
        </Badge>
        <span className="text-[10px] text-text-secondary ml-auto">{timeAgo(ticket.created_at)}</span>
      </div>
    </motion.div>
  );
}

function TicketSkeleton() {
  return (
    <div className="p-3.5 rounded-xl border border-glass-border space-y-3">
      <div className="flex justify-between">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-4 rounded-full" />
      </div>
      <Skeleton className="h-3 w-full" />
      <div className="flex gap-2">
        <Skeleton className="h-4 w-12 rounded-full" />
        <Skeleton className="h-4 w-16 rounded-full" />
      </div>
    </div>
  );
}

export function TicketQueue() {
  const { data: tickets, isLoading } = useTickets();
  const { selectedTicket, setSelectedTicket } = useAppStore();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<string>("all");

  const filtered = useMemo(() => {
    if (!tickets) return [];
    return tickets.filter((t) => {
      const matchesSearch =
        !search ||
        t.customer_name.toLowerCase().includes(search.toLowerCase()) ||
        t.message.toLowerCase().includes(search.toLowerCase());
      const matchesFilter = filter === "all" || t.status === filter || t.priority === filter;
      return matchesSearch && matchesFilter;
    });
  }, [tickets, search, filter]);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 pt-4 pb-3 border-b border-glass-border">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-text-primary">Ticket Queue</h3>
          <Badge variant="ghost" className="text-[10px]">{filtered.length} tickets</Badge>
        </div>
        <div className="relative mb-2">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-secondary" />
          <Input
            placeholder="Search tickets..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-8 pl-8 text-xs bg-white/5"
          />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {["all", "open", "in_progress", "escalated", "resolved"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              aria-pressed={filter === f}
              className={cn(
                "px-2.5 py-1 rounded-lg text-[10px] font-medium transition-all",
                filter === f
                  ? "bg-primary/20 text-primary border border-primary/30"
                  : "bg-white/5 text-text-secondary hover:bg-white/10 border border-transparent"
              )}
            >
              {f === "all" ? "All" : f.replace("_", " ")}
            </button>
          ))}
        </div>
      </div>

      {/* Ticket List */}
      <ScrollArea className="flex-1 px-3 py-3">
        <div className="space-y-2">
          {isLoading ? (
            Array.from({ length: 5 }).map((_, i) => <TicketSkeleton key={i} />)
          ) : filtered.length === 0 ? (
            <div className="text-center py-8">
              <MessageSquare className="w-8 h-8 text-text-secondary/30 mx-auto mb-2" />
              <p className="text-xs text-text-secondary">No tickets found</p>
            </div>
          ) : (
            <AnimatePresence mode="popLayout">
              {filtered.map((ticket) => (
                <TicketCard
                  key={ticket.ticket_id}
                  ticket={ticket}
                  isSelected={selectedTicket?.ticket_id === ticket.ticket_id}
                  onClick={() => setSelectedTicket(ticket)}
                />
              ))}
            </AnimatePresence>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

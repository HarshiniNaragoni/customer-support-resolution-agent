import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { useTickets } from "@/hooks";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { timeAgo } from "@/lib/utils";
import { AlertTriangle } from "lucide-react";

export default function TicketsPage() {
  const { data: tickets, isLoading, isError } = useTickets();

  return (
    <div className="p-6">
      <motion.h2 initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="text-lg font-bold text-text-primary mb-4">
        All Tickets
      </motion.h2>

      {isError && (
        <div className="glass rounded-2xl p-8 text-center">
          <AlertTriangle className="w-8 h-8 text-danger mx-auto mb-2" />
          <p className="text-sm text-text-secondary">Failed to load tickets. Please try again.</p>
        </div>
      )}

      {!isError && (
        <div className="glass rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <div className="grid grid-cols-[minmax(0,2fr)_minmax(120px,1fr)_auto_auto_auto_auto] gap-4 px-5 py-3 border-b border-glass-border text-xs font-medium text-text-secondary uppercase tracking-wider">
              <span>Customer</span>
              <span>Type</span>
              <span>Priority</span>
              <span>Status</span>
              <span>Confidence</span>
              <span>Time</span>
            </div>
            <ScrollArea className="max-h-[calc(100vh-200px)]">
              {isLoading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="grid grid-cols-[minmax(0,2fr)_minmax(120px,1fr)_auto_auto_auto_auto] gap-4 px-5 py-3 border-b border-glass-border/50">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-4 w-16 rounded-full" />
                    <Skeleton className="h-4 w-16 rounded-full" />
                    <Skeleton className="h-4 w-12" />
                    <Skeleton className="h-4 w-14" />
                  </div>
                ))
              ) : tickets && tickets.length > 0 ? (
                tickets.map((t, i) => (
                  <motion.div
                    key={t.ticket_id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.02 }}
                    className="grid grid-cols-[minmax(0,2fr)_minmax(120px,1fr)_auto_auto_auto_auto] gap-4 px-5 py-3 border-b border-glass-border/50 hover:bg-white/[0.02] transition-colors"
                  >
                    <div>
                      <p className="text-sm text-text-primary">{t.customer_name}</p>
                      <p className="text-[10px] text-text-secondary truncate">{t.customer_email}</p>
                    </div>
                    <span className="text-xs text-text-secondary">{t.ticket_type}</span>
                    <Badge variant={t.priority === "high" ? "danger" : t.priority === "medium" ? "warning" : "ghost"} className="text-[10px] w-fit">
                      {t.priority}
                    </Badge>
                    <Badge variant={t.status === "escalated" ? "danger" : t.status === "resolved" ? "success" : "secondary"} className="text-[10px] w-fit">
                      {t.status}
                    </Badge>
                    <span className="text-xs text-text-secondary">{t.confidence != null ? `${Math.round(t.confidence * 100)}%` : "\u2014"}</span>
                    <span className="text-[10px] text-text-secondary">{timeAgo(t.created_at)}</span>
                  </motion.div>
                ))
              ) : (
                <div className="text-center py-12">
                  <p className="text-sm text-text-secondary">No tickets found.</p>
                </div>
              )}
            </ScrollArea>
          </div>
        </div>
      )}
    </div>
  );
}

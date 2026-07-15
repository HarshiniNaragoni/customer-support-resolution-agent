import { motion } from "framer-motion";
import { useAuditLogs } from "@/hooks";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { timeAgo } from "@/lib/utils";
import { AlertTriangle, CheckCircle2, XCircle } from "lucide-react";

export default function AuditPage() {
  const { data: logs, isLoading, isError } = useAuditLogs();

  return (
    <div className="p-6">
      <motion.h2 initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="text-lg font-bold text-text-primary mb-4">
        Audit Logs
      </motion.h2>

      {isError && (
        <div className="glass rounded-2xl p-8 text-center">
          <AlertTriangle className="w-8 h-8 text-danger mx-auto mb-2" />
          <p className="text-sm text-text-secondary">Failed to load audit logs. Please try again.</p>
        </div>
      )}

      {!isError && (
        <div className="glass rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <div className="grid grid-cols-[minmax(100px,1fr)_minmax(100px,1fr)_auto_auto_minmax(0,2fr)_auto] gap-4 px-5 py-3 border-b border-glass-border text-xs font-medium text-text-secondary uppercase tracking-wider">
              <span>Ticket ID</span>
              <span>Intent</span>
              <span>Confidence</span>
              <span>Status</span>
              <span>Resolution</span>
              <span>Time</span>
            </div>
            <ScrollArea className="max-h-[calc(100vh-200px)]">
              {isLoading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="grid grid-cols-[minmax(100px,1fr)_minmax(100px,1fr)_auto_auto_minmax(0,2fr)_auto] gap-4 px-5 py-3 border-b border-glass-border/50">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-4 w-12" />
                    <Skeleton className="h-4 w-4" />
                    <Skeleton className="h-4 w-40" />
                    <Skeleton className="h-4 w-14" />
                  </div>
                ))
              ) : logs && logs.length > 0 ? (
                logs.map((log, i) => (
                  <motion.div
                    key={log.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.02 }}
                    className="grid grid-cols-[minmax(100px,1fr)_minmax(100px,1fr)_auto_auto_minmax(0,2fr)_auto] gap-4 px-5 py-3 border-b border-glass-border/50 hover:bg-white/[0.02] transition-colors items-center"
                  >
                    <span className="text-xs font-mono text-primary truncate">{log.ticket_id.slice(0, 12)}</span>
                    <Badge variant="ghost" className="text-[10px] w-fit">{log.intent || "\u2014"}</Badge>
                    <span className="text-xs text-text-secondary">{log.confidence != null ? `${Math.round(log.confidence * 100)}%` : "\u2014"}</span>
                    <div className="flex items-center gap-1">
                      {log.escalated ? (
                        <AlertTriangle className="w-3.5 h-3.5 text-danger" />
                      ) : (
                        <CheckCircle2 className="w-3.5 h-3.5 text-success" />
                      )}
                    </div>
                    <p className="text-xs text-text-secondary truncate">{log.final_resolution || "\u2014"}</p>
                    <span className="text-[10px] text-text-secondary">{timeAgo(log.created_at)}</span>
                  </motion.div>
                ))
              ) : (
                <div className="text-center py-12">
                  <p className="text-sm text-text-secondary">No audit logs found.</p>
                </div>
              )}
            </ScrollArea>
          </div>
        </div>
      )}
    </div>
  );
}

import { motion } from "framer-motion";
import { BarChart3, TrendingUp, PieChart, Activity } from "lucide-react";
import { useTickets, useAuditLogs } from "@/hooks";

export default function AnalyticsPage() {
  const { data: tickets } = useTickets();
  const { data: logs } = useAuditLogs();

  const total = tickets?.length || 0;
  const resolved = tickets?.filter((t) => t.status === "resolved" || t.status === "closed").length || 0;
  const escalated = tickets?.filter((t) => t.status === "escalated").length || 0;
  const avgConfidence = tickets?.length
    ? tickets.reduce((s, t) => s + (t.confidence || 0), 0) / tickets.length
    : 0;

  const intentCounts: Record<string, number> = {};
  logs?.forEach((l) => {
    if (l.intent) intentCounts[l.intent] = (intentCounts[l.intent] || 0) + 1;
  });

  return (
    <div className="p-6">
      <motion.h2 initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="text-lg font-bold text-text-primary mb-4">
        Analytics
      </motion.h2>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Resolution Rate", value: total ? `${Math.round((resolved / total) * 100)}%` : "0%", icon: TrendingUp, color: "#22C55E" },
          { label: "Escalation Rate", value: total ? `${Math.round((escalated / total) * 100)}%` : "0%", icon: Activity, color: "#EF4444" },
          { label: "Avg Confidence", value: `${Math.round(avgConfidence * 100)}%`, icon: BarChart3, color: "#B84DFF" },
          { label: "Total Interactions", value: String(logs?.length || 0), icon: PieChart, color: "#8B5CF6" },
        ].map((card, i) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="glass rounded-2xl p-5"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${card.color}20` }}>
                <card.icon className="w-5 h-5" style={{ color: card.color }} />
              </div>
              <div>
                <p className="text-xs text-text-secondary">{card.label}</p>
                <p className="text-2xl font-bold text-text-primary">{card.value}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Intent Distribution */}
      <div className="glass rounded-2xl p-5">
        <h3 className="text-sm font-semibold text-text-primary mb-4">Intent Distribution</h3>
        <div className="space-y-3">
          {Object.entries(intentCounts)
            .sort((a, b) => b[1] - a[1])
            .map(([intent, count]) => {
              const pct = logs?.length ? Math.round((count / logs.length) * 100) : 0;
              return (
                <div key={intent} className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-text-secondary">{intent.replace(/_/g, " ")}</span>
                    <span className="text-text-primary font-medium">{count}</span>
                  </div>
                  <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.8 }}
                      className="h-full rounded-full bg-gradient-to-r from-primary to-accent"
                    />
                  </div>
                </div>
              );
            })}
          {Object.keys(intentCounts).length === 0 && (
            <p className="text-xs text-text-secondary text-center py-4">No audit data yet. Send some messages to see analytics.</p>
          )}
        </div>
      </div>
    </div>
  );
}

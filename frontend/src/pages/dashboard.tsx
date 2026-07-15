import { motion } from "framer-motion";
import {
  Ticket,
  CheckCircle2,
  AlertTriangle,
  Clock,
  TrendingUp,
  Users,
  Brain,
  Shield,
} from "lucide-react";
import { StatsCard } from "@/components/dashboard/stats-card";
import { TicketQueue } from "@/components/dashboard/ticket-queue";
import { ConversationWindow } from "@/components/chat/conversation-window";
import { AIResolutionPanel } from "@/components/dashboard/ai-resolution-panel";
import { BottomDrawer } from "@/components/common/bottom-drawer";
import { useTickets } from "@/hooks";
import { useAppStore } from "@/store";

export default function DashboardPage() {
  const { data: tickets } = useTickets();
  const { lastAgentResponse } = useAppStore();

  const total = tickets?.length || 0;
  const resolved = tickets?.filter((t) => t.status === "resolved" || t.status === "closed").length || 0;
  const escalated = tickets?.filter((t) => t.status === "escalated").length || 0;
  const pending = tickets?.filter((t) => t.status === "open" || t.status === "in_progress").length || 0;
  const avgConfidence = tickets?.length
    ? tickets.reduce((sum, t) => sum + (t.confidence || 0), 0) / tickets.length
    : 0;

  return (
    <div className="flex flex-col h-[calc(100vh-64px)]">
      {/* Stats Row */}
      <div className="px-6 pt-5 pb-4">
        <motion.h2
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-lg font-bold text-text-primary mb-4"
        >
          Dashboard
        </motion.h2>
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
          <StatsCard title="Total Tickets" value={total} icon={Ticket} color="#B84DFF" delay={0} />
          <StatsCard title="Resolved" value={resolved} icon={CheckCircle2} color="#22C55E" delay={0.05} trend={{ value: 12, positive: true }} />
          <StatsCard title="Escalated" value={escalated} icon={AlertTriangle} color="#EF4444" delay={0.1} />
          <StatsCard title="Pending" value={pending} icon={Clock} color="#F59E0B" delay={0.15} />
          <StatsCard title="Avg Confidence" value={Math.round(avgConfidence * 100)} suffix="%" icon={Brain} color="#8B5CF6" delay={0.2} />
          <StatsCard title="Satisfaction" value={94} suffix="%" icon={TrendingUp} color="#D946EF" delay={0.25} trend={{ value: 3, positive: true }} />
        </div>
      </div>

      {/* Three-Panel Layout */}
      <div className="flex-1 flex gap-0 border-t border-glass-border overflow-hidden">
        {/* Left - Ticket Queue */}
        <div className="w-[320px] border-r border-glass-border shrink-0 overflow-hidden">
          <TicketQueue />
        </div>

        {/* Center - Conversation */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-hidden">
            <ConversationWindow />
          </div>
          <BottomDrawer />
        </div>

        {/* Right - AI Resolution */}
        <div className="w-[340px] border-l border-glass-border shrink-0 overflow-hidden">
          <AIResolutionPanel />
        </div>
      </div>
    </div>
  );
}

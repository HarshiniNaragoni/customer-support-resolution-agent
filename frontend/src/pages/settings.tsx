import { motion } from "framer-motion";
import { Settings as SettingsIcon } from "lucide-react";

export default function SettingsPage() {
  return (
    <div className="p-6">
      <motion.h2 initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="text-lg font-bold text-text-primary mb-4">
        Settings
      </motion.h2>
      <div className="glass rounded-2xl p-6 max-w-4xl">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center">
            <SettingsIcon className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-text-primary">System Settings</h3>
            <p className="text-xs text-text-secondary">Configure your AI support agent</p>
          </div>
        </div>
        <div className="space-y-4">
          {[
            { label: "AI Model", value: "GPT-4o (OpenAI)" },
            { label: "Confidence Threshold", value: "55%" },
            { label: "Max Goodwill Credit", value: "$10.00" },
            { label: "Refund Window", value: "30 days" },
            { label: "RAG Chunk Size", value: "1000 tokens" },
            { label: "RAG Top K", value: "3 documents" },
            { label: "Version", value: "1.0.0" },
          ].map((item) => (
            <div key={item.label} className="flex items-center justify-between py-2 border-b border-glass-border/50">
              <span className="text-xs text-text-secondary">{item.label}</span>
              <span className="text-xs font-medium text-text-primary">{item.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

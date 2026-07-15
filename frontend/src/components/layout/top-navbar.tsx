import { useState } from "react";
import { motion } from "framer-motion";
import { Search, Bell, Wifi, WifiOff, Activity } from "lucide-react";
import { useHealth } from "@/hooks";
import { useAppStore } from "@/store";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export function TopNavbar() {
  const { data: health } = useHealth();
  const { sidebarOpen } = useAppStore();
  const [searchFocused, setSearchFocused] = useState(false);

  const isOnline = health?.status === "healthy";

  return (
    <header
      className={cn(
        "h-16 border-b border-glass-border bg-bg-primary/80 backdrop-blur-xl flex items-center justify-between px-6 sticky top-0 z-40 transition-all duration-300"
      )}
    >
      {/* Search */}
      <div className="flex items-center gap-3 flex-1 max-w-xl">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
          <Input
            placeholder="Search tickets, orders, policies..."
            className="pl-10 h-9 bg-white/5"
            aria-label="Search tickets, orders, policies"
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
          />
          {searchFocused && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute inset-0 rounded-xl ring-2 ring-primary/30 pointer-events-none"
            />
          )}
        </div>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-4">
        {/* AI Model */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg glass">
          <Activity className="w-3.5 h-3.5 text-primary" />
          <span className="text-xs font-medium text-text-secondary">GPT-4o</span>
        </div>

        {/* Backend Status */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg glass">
          {isOnline ? (
            <Wifi className="w-3.5 h-3.5 text-success" />
          ) : (
            <WifiOff className="w-3.5 h-3.5 text-danger" />
          )}
          <span className={cn("text-xs font-medium", isOnline ? "text-success" : "text-danger")}>
            {isOnline ? "Connected" : "Offline"}
          </span>
        </div>

        {/* Notifications */}
        <button className="relative p-2 rounded-xl hover:bg-white/5 transition-colors" aria-label="Notifications">
          <Bell className="w-5 h-5 text-text-secondary" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-primary rounded-full" />
        </button>

        {/* Avatar */}
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
          <span className="text-xs font-bold text-white">A</span>
        </div>
      </div>
    </header>
  );
}

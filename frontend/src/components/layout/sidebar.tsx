import { NavLink } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  Bot,
  Ticket,
  ShoppingBag,
  Shield,
  FileText,
  BarChart3,
  Settings,
  ChevronLeft,
  Sparkles,
  User,
  Moon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/store";

const navItems = [
  { to: "/", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/assistant", icon: Bot, label: "AI Assistant" },
  { to: "/tickets", icon: Ticket, label: "Tickets" },
  { to: "/orders", icon: ShoppingBag, label: "Orders" },
  { to: "/policies", icon: Shield, label: "Policies" },
  { to: "/audit", icon: FileText, label: "Audit Logs" },
  { to: "/analytics", icon: BarChart3, label: "Analytics" },
  { to: "/settings", icon: Settings, label: "Settings" },
];

export function Sidebar() {
  const { sidebarOpen, toggleSidebar } = useAppStore();

  return (
    <motion.aside
      initial={false}
      animate={{ width: sidebarOpen ? 260 : 76 }}
      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
      className="fixed left-0 top-0 h-screen bg-bg-sidebar border-r border-glass-border flex flex-col z-50"
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 h-16 border-b border-glass-border">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shrink-0">
          <Sparkles className="w-5 h-5 text-white" />
        </div>
        <AnimatePresence>
          {sidebarOpen && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="overflow-hidden"
            >
              <p className="text-sm font-semibold text-text-primary whitespace-nowrap">CSRA</p>
              <p className="text-[10px] text-text-secondary whitespace-nowrap">Resolution Agent</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-3 space-y-1 overflow-hidden">
        {navItems.map((item) => (
          <NavLink key={item.to} to={item.to} end={item.to === "/"}>
            {({ isActive }) => (
              <motion.div
                whileHover={{ x: 2 }}
                whileTap={{ scale: 0.98 }}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group relative",
                  isActive
                    ? "bg-primary/15 text-primary"
                    : "text-text-secondary hover:text-text-primary hover:bg-white/5"
                )}
              >
                {isActive && (
                  <motion.div
                    layoutId="sidebar-active"
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-primary rounded-r-full"
                  />
                )}
                <item.icon className={cn("w-5 h-5 shrink-0", isActive && "drop-shadow-[0_0_8px_rgba(184,77,255,0.5)]")} />
                <AnimatePresence>
                  {sidebarOpen && (
                    <motion.span
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="text-sm font-medium whitespace-nowrap"
                    >
                      {item.label}
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.div>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Bottom */}
      <div className="px-3 pb-4 space-y-2 border-t border-glass-border pt-3">
        <button
          onClick={toggleSidebar}
          aria-label={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
          className="flex items-center gap-3 px-3 py-2 rounded-xl text-text-secondary hover:text-text-primary hover:bg-white/5 w-full transition-all"
        >
          <ChevronLeft
            className={cn(
              "w-5 h-5 shrink-0 transition-transform duration-300",
              !sidebarOpen && "rotate-180"
            )}
          />
          <AnimatePresence>
            {sidebarOpen && (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-sm whitespace-nowrap"
              >
                Collapse
              </motion.span>
            )}
          </AnimatePresence>
        </button>
        <div className={cn("flex items-center gap-3 px-3 py-2 rounded-xl", sidebarOpen ? "" : "justify-center")}>
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center shrink-0">
            <User className="w-4 h-4 text-white" />
          </div>
          <AnimatePresence>
            {sidebarOpen && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex-1 min-w-0"
              >
                <p className="text-sm font-medium text-text-primary truncate">Admin</p>
                <p className="text-[10px] text-text-secondary">v1.0.0</p>
              </motion.div>
            )}
          </AnimatePresence>
          {sidebarOpen && (
            <Moon className="w-4 h-4 text-text-secondary shrink-0" />
          )}
        </div>
      </div>
    </motion.aside>
  );
}

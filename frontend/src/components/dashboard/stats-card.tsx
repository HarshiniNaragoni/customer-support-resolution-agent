import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatsCardProps {
  title: string;
  value: number;
  suffix?: string;
  icon: LucideIcon;
  trend?: { value: number; positive: boolean };
  color: string;
  delay?: number;
}

function AnimatedNumber({ value, suffix = "" }: { value: number; suffix?: string }) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    const duration = 1200;
    const steps = 40;
    const increment = value / steps;
    let current = 0;
    const timer = setInterval(() => {
      current += increment;
      if (current >= value) {
        setDisplay(value);
        clearInterval(timer);
      } else {
        setDisplay(Math.floor(current));
      }
    }, duration / steps);
    return () => clearInterval(timer);
  }, [value]);

  return (
    <span>
      {display.toLocaleString()}
      {suffix}
    </span>
  );
}

export function StatsCard({ title, value, suffix, icon: Icon, trend, color, delay = 0 }: StatsCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      whileHover={{ y: -2, transition: { duration: 0.2 } }}
      className="glass rounded-2xl p-5 relative overflow-hidden group cursor-default"
    >
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        style={{
          background: `radial-gradient(circle at 50% 50%, ${color}15, transparent 70%)`,
        }}
      />
      <div className="relative flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-text-secondary uppercase tracking-wider">{title}</p>
          <p className="text-3xl font-bold text-text-primary mt-2">
            <AnimatedNumber value={value} suffix={suffix} />
          </p>
          {trend && (
            <p className={cn("text-xs mt-1.5 font-medium", trend.positive ? "text-success" : "text-danger")}>
              {trend.positive ? "+" : ""}{trend.value}% from last week
            </p>
          )}
        </div>
        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
          style={{ backgroundColor: `${color}20` }}
        >
          <Icon className="w-5 h-5" style={{ color }} />
        </div>
      </div>
      <div
        className="absolute bottom-0 left-0 right-0 h-[2px]"
        style={{ background: `linear-gradient(90deg, transparent, ${color}60, transparent)` }}
      />
    </motion.div>
  );
}

import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { useOrders } from "@/hooks";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { timeAgo } from "@/lib/utils";
import { AlertTriangle } from "lucide-react";

export default function OrdersPage() {
  const { data: orders, isLoading, isError } = useOrders();

  return (
    <div className="p-6">
      <motion.h2 initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="text-lg font-bold text-text-primary mb-4">
        Orders
      </motion.h2>

      {isError && (
        <div className="glass rounded-2xl p-8 text-center">
          <AlertTriangle className="w-8 h-8 text-danger mx-auto mb-2" />
          <p className="text-sm text-text-secondary">Failed to load orders. Please try again.</p>
        </div>
      )}

      {!isError && (
        <div className="glass rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <div className="grid grid-cols-[minmax(100px,1fr)_minmax(0,2fr)_minmax(120px,1fr)_auto_auto_auto] gap-4 px-5 py-3 border-b border-glass-border text-xs font-medium text-text-secondary uppercase tracking-wider">
              <span>Order ID</span>
              <span>Product</span>
              <span>Customer</span>
              <span>Status</span>
              <span>Price</span>
              <span>Created</span>
            </div>
            <ScrollArea className="max-h-[calc(100vh-200px)]">
              {isLoading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="grid grid-cols-[minmax(100px,1fr)_minmax(0,2fr)_minmax(120px,1fr)_auto_auto_auto] gap-4 px-5 py-3 border-b border-glass-border/50">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-4 w-16 rounded-full" />
                    <Skeleton className="h-4 w-12" />
                    <Skeleton className="h-4 w-14" />
                  </div>
                ))
              ) : orders && orders.length > 0 ? (
                orders.map((o, i) => (
                  <motion.div
                    key={o.order_id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.02 }}
                    className="grid grid-cols-[minmax(100px,1fr)_minmax(0,2fr)_minmax(120px,1fr)_auto_auto_auto] gap-4 px-5 py-3 border-b border-glass-border/50 hover:bg-white/[0.02] transition-colors"
                  >
                    <span className="text-xs font-mono text-primary truncate">{o.order_id.slice(0, 12)}</span>
                    <span className="text-sm text-text-primary">{o.product_name}</span>
                    <span className="text-xs text-text-secondary">{o.customer_name}</span>
                    <Badge
                      variant={
                        o.status === "delivered" ? "success" :
                        o.status === "shipped" ? "secondary" :
                        o.status === "refunded" ? "danger" : "ghost"
                      }
                      className="text-[10px] w-fit"
                    >
                      {o.status}
                    </Badge>
                    <span className="text-xs text-text-secondary">${o.price.toFixed(2)}</span>
                    <span className="text-[10px] text-text-secondary">{timeAgo(o.created_at)}</span>
                  </motion.div>
                ))
              ) : (
                <div className="text-center py-12">
                  <p className="text-sm text-text-secondary">No orders found.</p>
                </div>
              )}
            </ScrollArea>
          </div>
        </div>
      )}
    </div>
  );
}

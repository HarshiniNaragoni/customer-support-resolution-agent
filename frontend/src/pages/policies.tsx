import { motion } from "framer-motion";
import { usePolicies } from "@/hooks";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Shield, AlertTriangle } from "lucide-react";

export default function PoliciesPage() {
  const { data: policies, isLoading, isError } = usePolicies();

  return (
    <div className="p-6">
      <motion.h2 initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="text-lg font-bold text-text-primary mb-4">
        Knowledge Base Policies
      </motion.h2>

      {isError && (
        <div className="glass rounded-2xl p-8 text-center">
          <AlertTriangle className="w-8 h-8 text-danger mx-auto mb-2" />
          <p className="text-sm text-text-secondary">Failed to load policies. Please try again.</p>
        </div>
      )}

      {!isError && (
        <ScrollArea className="max-h-[calc(100vh-200px)]">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-4">
            {isLoading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="glass rounded-2xl p-5 space-y-3">
                  <Skeleton className="h-5 w-48" />
                  <Skeleton className="h-4 w-20 rounded-full" />
                  <Skeleton className="h-16 w-full" />
                </div>
              ))
            ) : policies && policies.length > 0 ? (
              policies.map((p, i) => (
                <motion.div
                  key={p.policy_id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  whileHover={{ y: -2 }}
                  className="glass rounded-2xl p-5 hover:border-primary/30 transition-all"
                >
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center shrink-0">
                      <Shield className="w-4 h-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-semibold text-text-primary truncate">{p.title}</h4>
                      <Badge variant="ghost" className="text-[10px] mt-1">{p.category}</Badge>
                    </div>
                  </div>
                  <p className="text-xs text-text-secondary line-clamp-4 leading-relaxed">{p.content}</p>
                </motion.div>
              ))
            ) : (
              <div className="col-span-full text-center py-12">
                <p className="text-sm text-text-secondary">No policies found.</p>
              </div>
            )}
          </div>
        </ScrollArea>
      )}
    </div>
  );
}

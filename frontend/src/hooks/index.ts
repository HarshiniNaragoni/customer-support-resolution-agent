import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ticketApi, orderApi, policyApi, auditApi, agentApi, healthApi } from "@/api/client";
import type { AgentInvokeRequest } from "@/types";

export function useHealth() {
  return useQuery({ queryKey: ["health"], queryFn: healthApi.check, refetchInterval: 30000 });
}

export function useTickets(skip = 0, limit = 50) {
  return useQuery({ queryKey: ["tickets", skip, limit], queryFn: () => ticketApi.list(skip, limit) });
}

export function useTicket(id: string) {
  return useQuery({ queryKey: ["ticket", id], queryFn: () => ticketApi.get(id), enabled: !!id });
}

export function useOrders(skip = 0, limit = 50) {
  return useQuery({ queryKey: ["orders", skip, limit], queryFn: () => orderApi.list(skip, limit) });
}

export function usePolicies(skip = 0, limit = 50) {
  return useQuery({ queryKey: ["policies", skip, limit], queryFn: () => policyApi.list(skip, limit) });
}

export function useAuditLogs(skip = 0, limit = 50) {
  return useQuery({ queryKey: ["audit", skip, limit], queryFn: () => auditApi.list(skip, limit) });
}

export function useInvokeAgent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: AgentInvokeRequest) => agentApi.invoke(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tickets"] });
      qc.invalidateQueries({ queryKey: ["audit"] });
    },
  });
}

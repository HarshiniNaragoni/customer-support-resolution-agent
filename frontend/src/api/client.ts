import axios from "axios";
import type {
  Ticket,
  Order,
  Policy,
  AuditLog,
  AgentInvokeRequest,
  AgentInvokeResponse,
  HealthResponse,
} from "@/types";

const api = axios.create({
  baseURL: "/api/v1",
  timeout: 30000,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    const message =
      err.response?.data?.detail || err.message || "Network error";
    return Promise.reject(new Error(message));
  }
);

export const healthApi = {
  check: () => api.get<HealthResponse>("/health").then((r) => r.data),
};

export const ticketApi = {
  list: (skip = 0, limit = 50) =>
    api.get<Ticket[]>("/tickets", { params: { skip, limit } }).then((r) => r.data),
  get: (id: string) => api.get<Ticket>(`/tickets/${id}`).then((r) => r.data),
  create: (data: Partial<Ticket>) =>
    api.post<Ticket>("/tickets", data).then((r) => r.data),
  update: (id: string, data: Partial<Ticket>) =>
    api.put<Ticket>(`/tickets/${id}`, data).then((r) => r.data),
  delete: (id: string) => api.delete(`/tickets/${id}`),
};

export const orderApi = {
  list: (skip = 0, limit = 50) =>
    api.get<Order[]>("/orders", { params: { skip, limit } }).then((r) => r.data),
  get: (id: string) => api.get<Order>(`/orders/${id}`).then((r) => r.data),
};

export const policyApi = {
  list: (skip = 0, limit = 50) =>
    api.get<Policy[]>("/policies", { params: { skip, limit } }).then((r) => r.data),
};

export const auditApi = {
  list: (skip = 0, limit = 50) =>
    api.get<AuditLog[]>("/audit", { params: { skip, limit } }).then((r) => r.data),
};

export const agentApi = {
  invoke: (data: AgentInvokeRequest) =>
    api.post<AgentInvokeResponse>("/agent/invoke", data).then((r) => r.data),
};

export default api;

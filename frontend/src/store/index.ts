import { create } from "zustand";
import type { Ticket, ChatMessage, AgentInvokeResponse } from "@/types";

interface AppState {
  selectedTicket: Ticket | null;
  setSelectedTicket: (ticket: Ticket | null) => void;
  chatMessages: ChatMessage[];
  addChatMessage: (msg: ChatMessage) => void;
  clearChat: () => void;
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  bottomDrawerOpen: boolean;
  toggleBottomDrawer: () => void;
  lastAgentResponse: AgentInvokeResponse | null;
  setLastAgentResponse: (r: AgentInvokeResponse | null) => void;
}

export const useAppStore = create<AppState>((set) => ({
  selectedTicket: null,
  setSelectedTicket: (ticket) => set({ selectedTicket: ticket }),
  chatMessages: [],
  addChatMessage: (msg) =>
    set((s) => ({ chatMessages: [...s.chatMessages, msg] })),
  clearChat: () => set({ chatMessages: [] }),
  sidebarOpen: true,
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  bottomDrawerOpen: false,
  toggleBottomDrawer: () => set((s) => ({ bottomDrawerOpen: !s.bottomDrawerOpen })),
  lastAgentResponse: null,
  setLastAgentResponse: (r) => set({ lastAgentResponse: r }),
}));

import { BrowserRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Layout } from "@/components/layout/layout";
import DashboardPage from "@/pages/dashboard";
import AssistantPage from "@/pages/assistant";
import TicketsPage from "@/pages/tickets";
import OrdersPage from "@/pages/orders";
import PoliciesPage from "@/pages/policies";
import AuditPage from "@/pages/audit";
import AnalyticsPage from "@/pages/analytics";
import SettingsPage from "@/pages/settings";

const qc = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 10000,
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={qc}>
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/assistant" element={<AssistantPage />} />
            <Route path="/tickets" element={<TicketsPage />} />
            <Route path="/orders" element={<OrdersPage />} />
            <Route path="/policies" element={<PoliciesPage />} />
            <Route path="/audit" element={<AuditPage />} />
            <Route path="/analytics" element={<AnalyticsPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="*" element={
              <div className="flex items-center justify-center h-[calc(100vh-64px)]">
                <div className="text-center">
                  <h1 className="text-6xl font-bold text-text-primary mb-4">404</h1>
                  <p className="text-text-secondary">Page not found</p>
                </div>
              </div>
            } />
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

import { Outlet } from "react-router-dom";
import { Sidebar } from "./sidebar";
import { TopNavbar } from "./top-navbar";
import { useAppStore } from "@/store";
import { cn } from "@/lib/utils";

export function Layout() {
  const { sidebarOpen } = useAppStore();

  return (
    <div className="min-h-screen bg-bg-primary">
      <Sidebar />
      <div
        className={cn(
          "min-h-screen flex flex-col",
          sidebarOpen ? "ml-[260px]" : "ml-[76px]"
        )}
      >
        <TopNavbar />
        <main className="flex-1 overflow-hidden">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

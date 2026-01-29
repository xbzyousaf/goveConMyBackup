import { ReactNode } from "react";
import { AdminSidebar } from "./AdminSidebar";
import Header from "@/components/examples/Header";

export function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen bg-muted">
      <AdminSidebar />
      <div className="flex-1 flex flex-col">
      
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}

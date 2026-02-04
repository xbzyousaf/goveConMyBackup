import { Header } from "@/components/Header";
import { AdminLayout } from "./AdminLayouts";
import { Card } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import type { VendorProfile } from "@shared/schema";

export default function AdminDashboard() {
  
  const { data: vendorStats, isLoading: isStatsLoading } = useQuery({
    queryKey: ["/api/admin/vendor-stats"],
    queryFn: async () => {
      const res = await fetch("/api/admin/vendor-stats");
      if (!res.ok) throw new Error("Failed to fetch vendor stats");
      return res.json();
    },
  });
  const stats = [
    { label: "Pending Vendors", value: vendorStats?.pending ?? 0 },
    { label: "Active Vendors", value: vendorStats?.approved ?? 0 },
    { label: "Active Matches", value: 17 },
    { label: "Escrow Balance", value: "$48,500" },
  ];

  return (
    <div>
    <Header />
    <AdminLayout>
      <div className="space-y-6">
        <h2 className="text-2xl font-bold">Overview</h2>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {stats.map((s) => (
            <Card key={s.label} className="p-6">
              <p className="text-sm text-muted-foreground">{s.label}</p>
              <p className="text-2xl font-bold">{s.value}</p>
            </Card>
          ))}
        </div>
      </div>
    </AdminLayout></div>
  );
}
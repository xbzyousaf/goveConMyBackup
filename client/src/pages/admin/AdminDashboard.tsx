import { Header } from "@/components/Header";
import { AdminLayout } from "./AdminLayouts";
import { Card } from "@/components/ui/card";

export default function AdminDashboard() {
  const stats = [
    { label: "Pending Vendors", value: 8 },
    { label: "Active Vendors", value: 42 },
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

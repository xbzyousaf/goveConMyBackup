import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, TrendingUp, Star, Clock, AlertTriangle, Magnet, Dessert, CheckCheck, ClockAlert } from "lucide-react";

interface PerformanceData {
  vendorScore: number;
  rating: number;
  totalRequests: number;
  completedRequests: number;
  autoCompletedRequests: number;
  disputesLost: number;
  responseTime: number;
  completionRate: number;
  onTimeRate: number;
}

export default function VendorPerformanceTab({ vendorId }: { vendorId: string }) {
  const [data, setData] = useState<PerformanceData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/vendors/${vendorId}/performance`)
      .then(res => res.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, [vendorId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-10">
        <Loader2 className="animate-spin h-6 w-6" />
      </div>
    );
  }

  if (!data) {
    return <div>No performance data available.</div>;
  }

  return (
    <div className="space-y-6">
      {/* Top Score Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Vendor Score
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-4xl font-bold">
            {Number(data.vendorScore || 0).toFixed(1)} / 100
          </div>
          <div className="text-sm text-muted-foreground mt-2">
            {Number(data.rating || 0).toFixed(1)} Average Rating
          </div>
        </CardContent>
      </Card>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Completion Rate" value={`${data.completionRate}%`} icon={<TrendingUp className="h-4 w-4" />} />
        <StatCard title="On-Time Delivery" value={`${data.onTimeRate}%`} icon={<ClockAlert className="h-4 w-4" />} />
        <StatCard title="Total Requests" value={data.totalRequests} icon={<Magnet className="h-4 w-4" />} />
        <StatCard title="Completed Jobs" value={data.completedRequests} icon={<CheckCheck className="h-4 w-4" />} />
        <StatCard title="Auto Completed" value={data.autoCompletedRequests} icon={<Dessert className="h-4 w-4" />} />
        <StatCard title="Disputes Lost" value={data.disputesLost} icon={<AlertTriangle className="h-4 w-4" />} />
        <StatCard title="Avg Response Time" value={`${data.responseTime}`} icon={<Clock className="h-4 w-4" />} />
        <StatCard title="Avg Rating" value={`${data.rating}`} icon={<Star className="h-4 w-4" />} />
      </div>
    </div>
  );
}

function StatCard({ title, value, icon }: any) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
      </CardContent>
    </Card>
  );
}
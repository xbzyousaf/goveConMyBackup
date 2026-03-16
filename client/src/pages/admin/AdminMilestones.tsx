import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Header } from "@/components/Header";
import { AdminLayout } from "./AdminLayouts";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { Milestone } from "@shared/schema";
import { Plus } from "lucide-react";

export default function AdminMilestones() {
  const queryClient = useQueryClient();

  // Fetch milestones
  const { data: milestones = [], isLoading } = useQuery<Milestone[]>({
    queryKey: ["/api/milestones"],
    queryFn: async () => {
      const res = await fetch("/api/milestones");
      if (!res.ok) throw new Error("Failed to fetch milestones");
      return res.json();
    },
  });

  // Toggle "required" status (example)
  const toggleRequired = useMutation({
    mutationFn: async ({ id, required }: { id: string; required: boolean }) => {
      const res = await fetch(`/api/admin/milestones/${id}/required`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ required }),
      });

      if (!res.ok) throw new Error("Failed to update milestone required status");
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/milestones"] }),
  });

  if (isLoading) return <p className="p-6">Loading milestones...</p>;

  return (
    <div>
      <Header />

      <AdminLayout>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">Manage Milestones</h2>
          <Button
            size="sm"
            onClick={() => window.location.assign("/admin/milestones/create")}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add New
          </Button>
        </div>

        <Card className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr className="bg-gray-50 text-sm">
                <th className="px-4 py-2 text-left">Key</th>
                <th className="px-4 py-2 text-left">Title</th>
                <th className="px-4 py-2 text-left">Process</th>
                <th className="px-4 py-2 text-left">Stage</th>
                <th className="px-4 py-2 text-left">Description</th>
                <th className="px-4 py-2 text-left">Required</th>
              </tr>
            </thead>

            <tbody className="bg-white divide-y divide-gray-200">
              {milestones.map((m) => (
                <tr key={m.id}>
                  <td className="px-4 py-2 font-medium">{m.key}</td>
                  <td className="px-4 py-2">{m.title}</td>
                  <td className="px-4 py-2">{m.process}</td>
                  <td className="px-4 py-2">{m.stage}</td>
                  <td className="px-4 py-2 max-w-[250px] truncate">{m.description}</td>
                  <td className="px-4 py-2">{m.required ? "Yes" : "No"}</td>
                  
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </AdminLayout>
    </div>
  );
}
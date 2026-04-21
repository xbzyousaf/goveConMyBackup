import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Header } from "@/components/Header";
import { AdminLayout } from "./AdminLayouts";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { Milestone } from "@shared/schema";
import { Plus } from "lucide-react";
import { useLocation } from "wouter";

export default function AdminMilestones() {
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();

  // Fetch milestones
  const { data: milestones = [], isLoading } = useQuery<Milestone[]>({
    queryKey: ["/api/admin/milestones"],
    queryFn: async () => {
      const res = await fetch("/api/admin/milestones");
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
        <div className="flex justify-between items-center mb-4 w-full table-auto">
          <h2 className="text-2xl font-bold">Manage Milestones</h2>
          <Button
            size="sm"
            onClick={() => window.location.assign("/admin/create-milestones")}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add New
          </Button>
        </div>

       <Card>
  <div className="w-full overflow-x-auto">
    <table className="w-full table-auto divide-y divide-gray-200">
      <thead>
        <tr className="bg-gray-50 text-sm">
          <th className="px-4 py-2 text-left">Key</th>
          <th className="px-4 py-2 text-left">Title</th>
          <th className="px-4 py-2 text-left">Process</th>
          <th className="px-4 py-2 text-left">Stage</th>
          <th className="px-4 py-2 text-left">Category</th>
          {/* <th className="px-4 py-2 text-left">Description</th> */}
          {/* <th className="px-4 py-2 text-left">Required</th> */}
          <th className="px-4 py-2 text-left">Actions</th>
        </tr>
      </thead>

      <tbody className="bg-white divide-y divide-gray-200">
        {milestones.map((m) => (
          <tr key={m.id}>
            <td className="px-4 py-2 font-medium">{m.key}</td>
            <td className="px-4 py-2">{m.title}</td>
            <td className="px-4 py-2">{m.process}</td>
            <td className="px-4 py-2">{m.stage}</td>
            <td className="px-4 py-2">{m.categoryName || m.categoryId}</td>

            {/* <td className="px-4 py-2 max-w-[250px]">
              <div className="line-clamp-2 break-words">
                {m.description}
              </div>
            </td> */}

            {/* <td className="px-4 py-2">{m.required ? "Yes" : "No"}</td> */}

            <td className="px-4 py-2">
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={() => setLocation(`/admin/edit-milestones/${m.id}`)}
                >
                  Edit
                </Button>
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
</Card>
      </AdminLayout>
    </div>
  );
}
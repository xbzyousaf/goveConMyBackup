import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Header } from "@/components/Header";
import { AdminLayout } from "./AdminLayouts";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { Milestone } from "@shared/schema";
import { Plus } from "lucide-react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

export default function AdminMilestones() {
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");

  // Fetch milestones
  const { data: milestones = [], isLoading } = useQuery<Milestone[]>({
    queryKey: ["/api/admin/milestones"],
    queryFn: async () => {
      const res = await fetch("/api/admin/milestones");
      if (!res.ok) throw new Error("Failed to fetch milestones");
      return res.json();
    },
  });
  const deleteMilestoneMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/admin/milestones/${id}`, {
        method: "DELETE",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to delete milestone");
      }

      return data;
    },

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/admin/milestones"],
      });

      toast({
        title: "Success",
        description: "Milestone deleted successfully.",
      });
    },

    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete milestone.",
        variant: "destructive",
      });
    },
  });
  const filteredMilestones = milestones.filter((m) => {
    const search = searchTerm.toLowerCase().trim();

    return (
      m.title?.toLowerCase().includes(search) ||
      m.categoryName?.toLowerCase().includes(search) ||
      m.process?.toLowerCase().includes(search) ||
      m.stage?.toLowerCase().includes(search)
    );
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

  if (isLoading) return <p className="p-6">Loading Checklist...</p>;

  return (
    <div>
      <Header />

      <AdminLayout>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">Manage Checklist</h2>

          <div className="flex items-center gap-6">
            <input
              type="text"
              placeholder="Search with title, category, stage or process ..."
              className="w-72 h-9 px-3 border rounded-md text-xs"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />

            <Button
              size="sm"
              onClick={() => window.location.assign("/admin/create-milestones")}
            >
              <Plus className="w-4 h-4 mr-1" />
              Add New
            </Button>
          </div>
        </div>

       <Card className=" overflow-x-auto">
  <div className="w-full">
    <table className="w-full table-auto divide-y divide-gray-200">
      <thead>
        <tr className="bg-gray-50 text-sm">
          <th className="px-4 py-2 text-left">Title</th>
          <th className="px-4 py-2 text-left">Process</th>
          <th className="px-4 py-2 text-left">Stage</th>
          <th className="px-4 py-2 text-left">Category</th>
          <th className="px-4 py-2 text-left">Actions</th>
        </tr>
      </thead>

      <tbody className="bg-white divide-y divide-gray-200 text-sm">
        {filteredMilestones.length === 0 && (
          <tr>
            <td colSpan={5} className="text-center py-6 text-muted-foreground">
              No milestones found.
            </td>
          </tr>
        )}
        {filteredMilestones.map((m) => (
          <tr key={m.id}>
            <td className="px-4 py-2">{m.title}</td>
            <td className="px-4 py-2">
              {m.process
                ?.replace("business_", "")
                .replaceAll("_", " ")
                .replace(/\b\w/g, (char) => char.toUpperCase())}
            </td>

            <td className="px-4 py-2">
              {m.stage
                ? m.stage.charAt(0).toUpperCase() + m.stage.slice(1)
                : ""}
            </td>
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

                <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => {
                      const confirmed = window.confirm(
                        "Are you sure you want to delete this milestone?"
                      );

                      if (confirmed) {
                        deleteMilestoneMutation.mutate(m.id);
                      }
                    }}
                  >
                  Delete
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
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/queryClient";
import { AdminLayout } from "./AdminLayouts";
import { Header } from "@/components/Header";
import { Card } from "@/components/ui/card";
import { Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function AdminCategories() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: categories = [], isLoading } = useQuery({
    queryKey: ["/api/admin/categories"],
    queryFn: async () => {
        const res = await fetch("/api/admin/categories");
        const data = await res.json();

        // FIX: ensure array
        return Array.isArray(data) ? data : data.data || data.categories || [];
    },
    });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
        return apiRequest("DELETE", `/api/admin/categories/${id}`);
    },
    onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["/api/admin/categories"] });

        toast({
        title: "Deleted",
        description: "Category deleted successfully",
        });
    },
    onError: (error: any) => {
        toast({
        title: "Error",
        description: error.message || "Failed to delete category",
        variant: "destructive",
        });
    },
    });

  if (isLoading) return <p className="p-6">Loading categories...</p>;

  return (
    <div>
      <Header />
      <AdminLayout>

        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">Manage Categories</h2>

          <Button onClick={() => setLocation("/admin/create-categories")}>
            <Plus className="w-4 h-4 mr-2" />
            Add Category
          </Button>
        </div>

        <Card className="overflow-x-auto">
          <table className="min-w-full divide-y">
            <thead>
              <tr className="bg-gray-50 text-sm">
                <th className="px-4 py-2 text-left">Name</th>
                <th className="px-4 py-2 text-left">Description</th>
                <th className="px-4 py-2 text-left">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y">
              {categories.map((cat: any) => (
                <tr key={cat.id}>
                  <td className="px-4 py-2">{cat.name}</td>
                  <td className="px-4 py-2 max-w-[300px] truncate">
                    {cat.description}
                  </td>

                  <td className="px-4 py-2 flex gap-2">
                    <Button
                      size="sm"
                      onClick={() =>
                        setLocation(`/admin/edit-categories/${cat.id}`)
                      }
                    >
                      Edit
                    </Button>

                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => {
                        if (confirm("Are you sure you want to delete this category?")) {
                            deleteMutation.mutate(cat.id);
                        }
                    }}
                    >
                      Delete
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>

      </AdminLayout>
    </div>
  );
}
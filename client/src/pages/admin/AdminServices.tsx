import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Header } from "@/components/Header";
import { AdminLayout } from "./AdminLayouts";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { Service } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

export default function AdminServices() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  // Fetch services
  const { data: services = [], isLoading } = useQuery<Service[]>({
    queryKey: ["/api/admin/all-services"],
    queryFn: async () => {
      const res = await fetch("/api/admin/all-services");
      if (!res.ok) throw new Error("Failed to fetch services");
      return res.json();
    },
  });
  const deleteService = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/admin/services/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(errText || "Failed to delete service");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/admin/all-services"],
      });

      toast({
        title: "Deleted",
        description: "Service deleted successfully",
      });
    },

    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete service",
        variant: "destructive",
      });
    },
  });
  // Toggle service status
  const toggleStatus = useMutation({
    mutationFn: async ({
      id,
      isActive,
    }: {
      id: string;
      isActive: boolean;
    }) => {
      const res = await fetch(`/api/admin/services/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive }),
      });

      if (!res.ok) throw new Error("Failed to update service status");

      return res.json();
    },

    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["/api/admin/all-services"],
      });

      toast({
        title: "Success",
        description: variables.isActive
          ? "Service activated successfully"
          : "Service deactivated successfully",
      });
    },

    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update service",
        variant: "destructive",
      });
    },
  });

  if (isLoading) return <p className="p-6">Loading services...</p>;

  return (
    <div>
      <Header />

      <AdminLayout>
        <h2 className="text-2xl font-bold mb-4">Manage Services</h2>

        <Card className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr className="bg-gray-50 text-sm">
                <th className="px-4 py-2 text-left">Service</th>
                <th className="px-4 py-2 text-left">Category</th>
                <th className="px-4 py-2 text-left">Vendor Company</th>
                <th className="px-4 py-2 text-left">Vendor Title</th>
                <th className="px-4 py-2 text-left">Price</th>
                <th className="px-4 py-2 text-left">Actions</th>
              </tr>
            </thead>

            <tbody className="bg-white divide-y divide-gray-200">
              {services.map((service) => (
                <tr key={service.id}>
                  <td className="px-4 py-2 font-medium">
                    {service.name?.trim()}
                  </td>

                  <td className="px-4 py-2">
                    {service.category || "General"}
                  </td>

                  <td className="px-4 py-2">
                    {service.vendor?.companyName || "-"}
                  </td>

                  <td className="px-4 py-2">
                    {service.vendor?.title || "-"}
                  </td>

                  <td className="px-4 py-2">
                    ${Number(service.priceMin).toFixed(0)} - $
                    {Number(service.priceMax).toFixed(0)}
                  </td>

                  <td className="px-4 py-2">
                    <Button
                      size="sm"
                      variant={service.isActive ? "destructive" : "default"}
                      onClick={() =>
                        toggleStatus.mutate({
                          id: service.id,
                          isActive: !service.isActive,
                        })
                      }
                    >
                      {service.isActive ? "Deactivate" : "Activate"}
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      className="ml-2"
                      onClick={() => {
                        const confirmDelete = window.confirm(
                          "Are you sure you want to delete this service? This will also remove related requests."
                        );

                        if (confirmDelete) {
                          deleteService.mutate(service.id);
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
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Header } from "@/components/Header";
import { AdminLayout } from "./AdminLayouts";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { Service } from "@shared/schema";

export default function AdminServices() {
  const queryClient = useQueryClient();

  // Fetch services
  const { data: services = [], isLoading } = useQuery<Service[]>({
    queryKey: ["/api/all-services"],
    queryFn: async () => {
      const res = await fetch("/api/all-services");
      if (!res.ok) throw new Error("Failed to fetch services");
      return res.json();
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

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/all-services"],
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
                <th className="px-4 py-2 text-left">Description</th>
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

                  <td className="px-4 py-2 max-w-[250px] truncate">
                    {service.description}
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
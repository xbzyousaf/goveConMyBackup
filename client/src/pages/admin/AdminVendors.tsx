import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Header } from "@/components/Header";
import { AdminLayout } from "./AdminLayouts";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { VendorProfile } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

export default function AdminVendors() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [loadingVendorId, setLoadingVendorId] = useState<string | null>(null);
  const [deleteLoadingId, setDeleteLoadingId] = useState<string | null>(null);

  const { data: categories = [] } = useQuery({
    queryKey: ["/api/admin/categories"],
  });

  // Fetch vendors
  const { data: vendors = [], isLoading } = useQuery<VendorProfile[]>({
    queryKey: ["/api/admin/vendors"],
    queryFn: async () => {
      const res = await fetch("/api/admin/vendors");
      if (!res.ok) throw new Error("Failed to fetch vendors");
      return res.json();
    },
  });

  // Mutation to toggle vendor approval
  const toggleApproval = useMutation({
    mutationFn: async ({ id, approve }: { id: string; approve: boolean }) => {
      setLoadingVendorId(id);

      const res = await fetch(`/api/admin/vendors/${id}/approve`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ approve }),
      });

      if (!res.ok) throw new Error("Failed to update vendor status");

      return res.json();
    },

    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/vendors"] });

      toast({
        title: "Success",
        description: variables.approve
          ? "Vendor activated successfully"
          : "Vendor deactivated successfully",
      });

      setLoadingVendorId(null);
    },

    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update vendor",
        variant: "destructive",
      });

      setLoadingVendorId(null);
    },
  });
 const deleteVendor = useMutation({
  mutationFn: async (id: string) => {
    setDeleteLoadingId(id);

    const res = await fetch(`/api/admin/vendors/${id}`, {
      method: "DELETE",
    });

    if (!res.ok) {
      const text = await res.text();

      throw new Error("Failed to delete vendor", { cause: text });
    }

    return res.json();
  },

  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ["/api/admin/vendors"] });

    toast({
      title: "Deleted",
      description: "Vendor deleted successfully",
    });

    setDeleteLoadingId(null);
  },

  onError: (error: any) => {
    toast({
      title: "Error",
      description: error.message || "Failed to delete vendor",
      variant: "destructive",
    });

    setDeleteLoadingId(null);
  },
});

  if (isLoading) return <p>Loading vendors...</p>;

  return (
    <div>
      <Header />
      <AdminLayout>
        <h2 className="text-2xl font-bold mb-4">Manage Vendors</h2>
        <Card className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">Name</th>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">Company</th>
                {/* <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">Category</th> */}
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">Status</th>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody className="text-sm bg-white divide-y divide-gray-200">
              {vendors.map((vendor) => (
                <tr key={vendor.id}>
                  <td className="px-4 py-2">{vendor.userName}</td>
                  <td className="px-4 py-2">{vendor.companyName || "-"}</td>
                  {/* <td className="px-4 py-2">{vendor.categories?.[0] || "General"}</td> */}
                  <td className="px-4 py-2">
                    {vendor.isApproved ? (
                      <span className="text-green-600 font-medium">Active</span>
                    ) : (
                      <span className="text-red-600 font-medium">Pending</span>
                    )}
                  </td>
                  <td className="px-4 py-2">
                    <Button
                      className="mr-2"
                      size="sm"
                      data-testid={`button-toggle-${vendor.id}`}
                      variant={vendor.isApproved ? "destructive" : "default"}
                      disabled={loadingVendorId === vendor.id}
                      onClick={() =>
                        toggleApproval.mutate({
                          id: vendor.id,
                          approve: !vendor.isApproved,
                        })
                      }
                    >
                      {loadingVendorId === vendor.id ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />

                          {vendor.isApproved ? "Deactivating..." : "Activating..."}
                        </>
                      ) : vendor.isApproved ? (
                        "Deactivate"
                      ) : (
                        "Activate"
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      data-testid={`button-delete-${vendor.id}`}
                      disabled={deleteLoadingId === vendor.userId}
                      onClick={() => {
                        const confirmDelete = window.confirm(
                          "Are you sure you want to delete this vendor? This action cannot be undone."
                        );

                        if (confirmDelete) {
                          console.log("Deleting vendor ID:", vendor.userId);

                          deleteVendor.mutate(vendor.userId);
                        }
                      }}
                    >
                      {deleteLoadingId === vendor.userId ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Deleting...
                        </>
                      ) : (
                        "Delete"
                      )}
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

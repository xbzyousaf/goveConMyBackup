import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Header } from "@/components/Header";
import { AdminLayout } from "./AdminLayouts";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { VendorProfile } from "@shared/schema";


export default function AdminVendors() {
  const queryClient = useQueryClient();

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
      const res = await fetch(`/api/admin/vendors/${id}/approve`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ approve }),
      });
      if (!res.ok) throw new Error("Failed to update vendor status");
      return res.json();
    },
    onSuccess: () => {
      // Refresh vendor list
      queryClient.invalidateQueries(["/api/admin/vendors"]);
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
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">Category</th>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">Location</th>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">Status</th>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {vendors.map((vendor) => (
                <tr key={vendor.id}>
                  <td className="px-4 py-2">{vendor.title}</td>
                  <td className="px-4 py-2">{vendor.companyName || "-"}</td>
                  <td className="px-4 py-2">{vendor.categories?.[0] || "General"}</td>
                  <td className="px-4 py-2">{vendor.location || "-"}</td>
                  <td className="px-4 py-2">
                    {vendor.isApproved ? (
                      <span className="text-green-600 font-medium">Active</span>
                    ) : (
                      <span className="text-red-600 font-medium">Pending</span>
                    )}
                  </td>
                  <td className="px-4 py-2">
                    <Button
                      size="sm"
                      variant={vendor.isApproved ? "destructive" : "default"}
                      onClick={() =>
                        toggleApproval.mutate({ id: vendor.id, approve: !vendor.isApproved })
                      }
                    >
                      {vendor.isApproved ? "Deactivate" : "Activate"}
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

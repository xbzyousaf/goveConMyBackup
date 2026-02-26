import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Header } from "@/components/Header";
import { AdminLayout } from "./AdminLayouts";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { ServiceRequest } from "@shared/schema";

export default function AdminDisputes() {
  const queryClient = useQueryClient();

  const { data: disputes = [], isLoading } = useQuery<ServiceRequest[]>({
    queryKey: ["/api/service-requests"],
    queryFn: async () => {
      const res = await fetch("/api/service-requests");
      if (!res.ok) throw new Error("Failed to fetch disputes");
      return res.json();
    },
  });

  const updateStatus = useMutation({
    mutationFn: async ({
      id,
      status,
    }: {
      id: string;
      status: "completed" | "cancelled";
    }) => {
      const res = await fetch(`/api/service-requests/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });

      if (!res.ok) throw new Error("Failed to update dispute status");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/service-requests"] });
    },
  });

  if (isLoading) return <p>Loading disputes...</p>;

  return (
    <div>
      <Header />
      <AdminLayout>
        <h2 className="text-2xl font-bold mb-4">Manage Disputes</h2>

        <Card className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">
                  Contractor
                </th>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">
                  Vendor
                </th>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">
                  Reason
                </th>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">
                  Status
                </th>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody className="bg-white divide-y divide-gray-200">
              {disputes.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center py-4">
                    No disputes found
                  </td>
                </tr>
              )}

              {disputes.map((dispute) => (
                <tr key={dispute.id}>
                  <td className="px-4 py-2">
                    {dispute.contractor?.firstName || "N/A"}{" "}
                    {dispute.contractor?.lastName || ""}
                  </td>

                  <td className="px-4 py-2">
                    {dispute.vendor?.firstName || "N/A"}{" "}
                    {dispute.vendor?.lastName || ""}
                  </td>

                  <td className="px-4 py-2">
                    {dispute.reason || "-"}
                  </td>

                  <td className="px-4 py-2">
                    <span className="font-medium capitalize">
                      {dispute.status || "unknown"}
                    </span>
                  </td>

                  <td className="px-4 py-2 space-x-2">
                    {dispute.status === "suspended" && (
                      <>
                        <Button
                          size="sm"
                          onClick={() =>
                            updateStatus.mutate({
                              id: dispute.id,
                              status: "completed",
                            })
                          }
                        >
                          Complete
                        </Button>

                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() =>
                            updateStatus.mutate({
                              id: dispute.id,
                              status: "cancelled",
                            })
                          }
                        >
                          Cancel
                        </Button>
                      </>
                    )}
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
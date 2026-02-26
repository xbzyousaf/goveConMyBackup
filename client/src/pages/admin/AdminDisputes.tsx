import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Header } from "@/components/Header";
import { AdminLayout } from "./AdminLayouts";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { ServiceRequest } from "@shared/schema";

export default function AdminDisputes() {
  const queryClient = useQueryClient();

  // Fetch disputes
  const { data: disputes = [], isLoading } = useQuery<ServiceRequest[]>({
    queryKey: ["/api/service-requests/"],
    queryFn: async () => {
      const res = await fetch("/api/service-requests/");
      if (!res.ok) throw new Error("Failed to fetch disputes");
      return res.json();
    },
  });

  // Mutation to update dispute status
  const updateStatus = useMutation({
    mutationFn: async ({
      id,
      status,
    }: {
      id: string;
      status: "resolved" | "rejected";
    }) => {
      const res = await fetch(`/api/admin/disputes/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });

      if (!res.ok) throw new Error("Failed to update dispute status");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/disputes"] });
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
              {disputes.map((dispute) => (
                <tr key={dispute.id}>
                  <td className="px-4 py-2">{dispute.contractor?.firstName} {dispute.contractor?.lastName}</td>
                  <td className="px-4 py-2">{dispute.vendor?.firstName} {dispute.vendor?.lastName}</td>
                  <td className="px-4 py-2">{dispute.reason}</td>

                  <td className="px-4 py-2">
                    {dispute.status === "pending" && (
                      <span className="text-yellow-600 font-medium">
                        Pending
                      </span>
                    )}
                    {dispute.status === "resolved" && (
                      <span className="text-green-600 font-medium">
                        Resolved
                      </span>
                    )}
                    {dispute.status === "rejected" && (
                      <span className="text-red-600 font-medium">
                        Rejected
                      </span>
                    )}
                  </td>

                  <td className="px-4 py-2 space-x-2">
                    {dispute.status === "pending" && (
                      <>
                        <Button
                          size="sm"
                          onClick={() =>
                            updateStatus.mutate({
                              id: dispute.id,
                              status: "resolved",
                            })
                          }
                        >
                          Resolve
                        </Button>

                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() =>
                            updateStatus.mutate({
                              id: dispute.id,
                              status: "rejected",
                            })
                          }
                        >
                          Reject
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
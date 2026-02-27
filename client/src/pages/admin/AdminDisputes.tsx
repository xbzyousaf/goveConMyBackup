import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Header } from "@/components/Header";
import { AdminLayout } from "./AdminLayouts";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import type { ServiceRequest } from "@shared/schema";

export default function AdminDisputes() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [selectedDispute, setSelectedDispute] =
    useState<ServiceRequest | null>(null);

  const [status, setStatus] =
    useState<"completed" | "cancelled">("completed");

  const [winner, setWinner] =
    useState<"vendor" | "contractor">("vendor");

  const [isModalOpen, setIsModalOpen] = useState(false);

  // Fetch disputes
  const { data: disputes = [], isLoading } = useQuery<ServiceRequest[]>({
    queryKey: ["/api/service-requests"],
    queryFn: async () => {
      const res = await fetch("/api/service-requests");
      if (!res.ok) throw new Error("Failed to fetch disputes");
      return res.json();
    },
  });

  // Resolve mutation
  const updateStatus = useMutation({
    mutationFn: async ({
      id,
      status,
      winner,
      disputeId,
    }: {
      id: string;
      status: "completed" | "cancelled";
      winner: "vendor" | "contractor";
      disputeId: string;
    }) => {
      const res = await fetch(`/api/service-requests/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, winner, disputeId }),
      });

      if (!res.ok) {
        const error = await res.json().catch(() => null);
        throw new Error(error?.message || "Failed to resolve dispute");
      }

      return res.json();
    },

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/service-requests"] });

      toast({
        title: "Dispute Resolved",
        description:
          winner === "vendor"
            ? "Vendor won the dispute."
            : "Contractor won the dispute.",
      });
    },

    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Something went wrong",
        variant: "destructive",
      });
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
                  Description
                </th>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">
                  Status
                </th>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">
                  Action
                </th>
              </tr>
            </thead>

            <tbody className="bg-white divide-y divide-gray-200">
              {disputes.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-4">
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
                    {dispute.disputes?.reason || "-"}
                  </td>

                  <td className="px-4 py-2">
                    {dispute.disputes?.description || "-"}
                  </td>

                  <td className="px-4 py-2">
                    <span className="font-medium capitalize">
                      {dispute.status || "unknown"}
                    </span>
                  </td>

                  <td className="px-4 py-2">
                    {dispute.status === "disputed" && (
                      <Button
                        size="sm"
                        onClick={() => {
                          setSelectedDispute(dispute);
                          setStatus("completed");
                          setWinner("vendor");
                          setIsModalOpen(true);
                        }}
                      >
                        Resolve
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>

        {/* Modal */}
        {isModalOpen && selectedDispute && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
            <div className="bg-white rounded-lg shadow-lg p-6 w-96">
              <h3 className="text-lg font-semibold mb-4">
                Resolve Dispute
              </h3>

              {/* Action Selection */}
              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-2">
                  Select Action:
                </p>

                <div className="space-y-2">
                  <label className="flex items-center space-x-2">
                    <input
                      type="radio"
                      checked={status === "completed"}
                      onChange={() => setStatus("completed")}
                    />
                    <span>Approve (Complete)</span>
                  </label>
                </div>
              </div>

              {/* Winner Selection */}
              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-2">
                  Select Winner:
                </p>

                <div className="space-y-2">
                  <label className="flex items-center space-x-2">
                    <input
                      type="radio"
                      checked={winner === "vendor"}
                      onChange={() => setWinner("vendor")}
                    />
                    <span>Vendor</span>
                  </label>

                  <label className="flex items-center space-x-2">
                    <input
                      type="radio"
                      checked={winner === "contractor"}
                      onChange={() => setWinner("contractor")}
                    />
                    <span>Contractor</span>
                  </label>
                </div>
              </div>

              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsModalOpen(false);
                    setSelectedDispute(null);
                  }}
                >
                  Close
                </Button>

                <Button
                  disabled={updateStatus.isPending}
                  onClick={() => {
                    if (!selectedDispute?.disputes?.id) return;

                    updateStatus.mutate({
                      id: selectedDispute.id,
                      status,
                      winner,
                      disputeId: selectedDispute.disputes.id,
                    });

                    setIsModalOpen(false);
                    setSelectedDispute(null);
                  }}
                >
                  {updateStatus.isPending ? "Resolving..." : "Confirm"}
                </Button>
              </div>
            </div>
          </div>
        )}
      </AdminLayout>
    </div>
  );
}
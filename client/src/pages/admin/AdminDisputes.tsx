import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Header } from "@/components/Header";
import { AdminLayout } from "./AdminLayouts";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import type { ServiceRequest } from "@shared/schema";
import { useMessages } from "@/components/ui/MessageContext";
import { MessageSquare } from "lucide-react";

export default function AdminDisputes() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { openConversation } = useMessages();

  const [selectedDispute, setSelectedDispute] = useState<ServiceRequest | null>(null);
  const [status, setStatus] = useState<"completed" | "cancelled">("completed");
  const [winner, setWinner] = useState<"vendor" | "contractor" | "partial">("vendor");
  const [contractorPercent, setContractorPercent] = useState<number>(50);
  const [vendorPercent, setVendorPercent] = useState<number>(50);
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
      contractorPercent,
      vendorPercent,
    }: {
      id: string;
      status: "completed" | "cancelled";
      winner: "vendor" | "contractor" | "partial";
      disputeId: string;
      contractorPercent?: number;
      vendorPercent?: number;
    }) => {
      const res = await fetch(`/api/service-requests/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, winner, disputeId, contractorPercent, vendorPercent }),
      });

      if (!res.ok) {
        const error = await res.json().catch(() => null);
        throw new Error(error?.message || "Failed to resolve dispute");
      }

      return res.json();
    },

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/service-requests"] });
      let message = "";
      if (winner === "vendor") message = "Vendor won the dispute.";
      else if (winner === "contractor") message = "Contractor won the dispute.";
      else message = `Partial win: Contractor ${contractorPercent}%, Vendor ${vendorPercent}%`;

      toast({
        title: "Dispute Resolved",
        description: message,
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
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">Contractor</th>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">Vendor</th>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">Reason</th>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">Description</th>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">Status</th>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">Action</th>
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
                  <td className="px-4 py-2">{dispute.contractor?.firstName || "N/A"} {dispute.contractor?.lastName || ""}</td>
                  <td className="px-4 py-2">{dispute.vendor?.firstName || "N/A"} {dispute.vendor?.lastName || ""}</td>
                  <td className="px-4 py-2">{dispute.disputes?.reason || "-"}</td>
                  <td className="px-4 py-2">{dispute.disputes?.description || "-"}</td>
                  <td className="px-4 py-2">
                    <span className="font-medium capitalize">{dispute.status || "unknown"}</span>
                  </td>
                  <td className="px-4 py-2">
                    {dispute.status === "disputed" && (
                      <Button
                        size="sm"
                        onClick={() => {
                          setSelectedDispute(dispute);
                          setStatus("completed");
                          setWinner("vendor");
                          setContractorPercent(50);
                          setVendorPercent(50);
                          setIsModalOpen(true);
                        }}
                      >
                        Resolve
                      </Button>
                    )}
                    <Button
                      variant="secondary"
                      className="ml-2"
                      onClick={() => openConversation(dispute.disputes.serviceRequestId)}
                    >
                      <MessageSquare className="w-4 h-4 mr-2" />
                      Message
                    </Button>
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
              <h3 className="text-lg font-semibold mb-4">Resolve Dispute</h3>

              {/* Action Selection */}
              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-2">Select Action:</p>
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
                <p className="text-sm text-gray-600 mb-2">Select Winner:</p>
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

                  <label className="flex items-center space-x-2">
                    <input
                      type="radio"
                      checked={winner === "partial"}
                      onChange={() => setWinner("partial")}
                    />
                    <span>Partial</span>
                  </label>
                </div>

                {/* Partial Percent Inputs */}
                {winner === "partial" && (
                  <div className="mt-3 space-y-2">
                    <div>
                      <label className="text-sm">Contractor %</label>
                      <input
                        type="number"
                        value={contractorPercent}
                        onChange={(e) => setContractorPercent(Number(e.target.value))}
                        className="w-full border p-2 rounded"
                        min={0}
                        max={100}
                      />
                    </div>
                    <div>
                      <label className="text-sm">Vendor %</label>
                      <input
                        type="number"
                        value={vendorPercent}
                        onChange={(e) => setVendorPercent(Number(e.target.value))}
                        className="w-full border p-2 rounded"
                        min={0}
                        max={100}
                      />
                    </div>
                    <p className="text-xs text-gray-500">Total must equal 100%</p>
                  </div>
                )}
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

                    if (winner === "partial" && contractorPercent + vendorPercent !== 100) {
                      toast({
                        title: "Invalid percentage",
                        description: "Total must equal 100%",
                        variant: "destructive",
                      });
                      return;
                    }

                    updateStatus.mutate({
                      id: selectedDispute.id,
                      status,
                      winner,
                      disputeId: selectedDispute.disputes.id,
                      contractorPercent,
                      vendorPercent,
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
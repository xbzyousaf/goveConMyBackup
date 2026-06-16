import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/Header";
import { AdminLayout } from "./AdminLayouts";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type Transaction = {
  id: string;
  amount: string;
  platformFee: string;
  vendorEarning: string;
  status: string;
  heldAt: string | null;
  releasedAt: string | null;
  refundedAt: string | null;

  serviceRequest: {
    title: string;
    description: string;
  };

  vendor: {
    firstName: string;
    lastName: string;
    email: string;
  };

  contractor: {
    firstName: string;
    lastName: string;
    email: string;
  };
};
type TransactionResponse = {
  data: Transaction[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

export default function Transactions() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const limit = 10;

  const { data, isLoading } =
  useQuery<TransactionResponse>({
    queryKey: [
      "/api/admin/admin-transactions",
      page,
    ],
    queryFn: async () => {
      const res = await fetch(
        `/api/admin/admin-transactions?page=${page}&limit=${limit}`
      );

      if (!res.ok) {
        throw new Error(
          "Failed to fetch transactions"
        );
      }

      return res.json();
    },
  });

  const transactions = data?.data ?? [];

  const filteredTransactions = useMemo(() => {
    const searchTerm = search.toLowerCase().trim();
    if (!searchTerm) return transactions;

    return transactions.filter((tx) => {
      const vendorName =
        `${tx.vendor?.firstName || ""} ${tx.vendor?.lastName || ""}`.toLowerCase();

      const contractorName =
        `${tx.contractor?.firstName || ""} ${tx.contractor?.lastName || ""}`.toLowerCase();

      const serviceTitle =
        tx.serviceRequest?.title?.toLowerCase() || "";

      const serviceDescription =
        tx.serviceRequest?.description?.toLowerCase() || "";

      const status =
        tx.status?.toLowerCase() || "";

      return (
        vendorName.includes(searchTerm) ||
        contractorName.includes(searchTerm) ||
        serviceTitle.includes(searchTerm) ||
        serviceDescription.includes(searchTerm) ||
        status.includes(searchTerm)
      );
    });
  }, [transactions, search]);

  if (isLoading) return <p>Loading Transactions...</p>;

  return (
    <div>
      <Header />
      <AdminLayout>

        {/* Filters */}
        <div className="flex justify-between gap-4">
          <h2 className="text-2xl font-bold mb-2">Transactions</h2>
          <Input
            className="max-w-60"
            placeholder="Search vendor, contractor, service, status..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <Card className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-4 py-2 text-left">Vendor</th>
                <th className="px-4 py-2 text-left">Contractor</th>
                <th className="px-4 py-2 text-left">Status</th>
                <th className="px-4 py-2 text-left">Amount</th>
                <th className="px-4 py-2 text-left">Platform Fee</th>
                <th className="px-4 py-2 text-left">Vendor Earning</th>
                <th className="px-4 py-2 text-left">Date</th>
              </tr>
            </thead>

            <tbody className="bg-white divide-y divide-gray-200">
              {filteredTransactions.map((tx) => (
                <tr key={tx.id}>
                  <td className="px-4 py-2">
                    {tx.vendor.firstName} {tx.vendor.lastName}
                  </td>

                  <td className="px-4 py-2">
                    {tx.contractor.firstName} {tx.contractor.lastName}
                  </td>

                  <td className="px-4 py-2">
                    <span
                      className={`font-medium capitalize ${
                        tx.status === "released"
                          ? "text-green-600"
                          : tx.status === "held"
                          ? "text-yellow-600"
                          : "text-red-600"
                      }`}
                    >
                      {tx.status}
                    </span>
                  </td>

                  <td className="px-4 py-2 font-semibold">
                    ${Number(tx.amount).toFixed(2)}
                  </td>

                  <td className="px-4 py-2">
                    ${Number(tx.platformFee).toFixed(2)}
                  </td>

                  <td className="px-4 py-2">
                    ${Number(tx.vendorEarning).toFixed(2)}
                  </td>

                  <td className="px-4 py-2">
                    {new Date(
                      tx.releasedAt || tx.heldAt || ""
                    ).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
        <div className="flex items-center justify-between p-3">
            <p className="text-xs text-gray-500">
              Page {data?.page || 1} of{" "}
              {data?.totalPages || 1}
            </p>

            <div className="flex gap-2">
              <button
                 size="sm"
                className="px-2 py-1 border rounded"
                disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}
              >
                Previous
              </button>

              <button
                size="sm"
                className="px-3 py-1 border rounded"
                disabled={
                  page >= (data?.totalPages || 1)
                }
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </button>
            </div>
          </div>
      </AdminLayout>
    </div>
  );
}
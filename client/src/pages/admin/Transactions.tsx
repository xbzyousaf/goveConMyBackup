import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/Header";
import { AdminLayout } from "./AdminLayouts";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type Transaction = {
  id: string;
  amount: string;
  type: string;
  createdAt: string;

  wallet: {
    id: string;
    balance: number;
    user: {
      firstName: string;
      lastName: string;
    };
  };

  serviceRequests: {
    title: string;
    description: string;
  };
};

export default function Transactions() {
  const [userFilter, setUserFilter] = useState("");
  const [serviceFilter, setServiceFilter] = useState("");

  const { data: transactions = [], isLoading } = useQuery<Transaction[]>({
    queryKey: ["/api/transactions"],
    queryFn: async () => {
      const res = await fetch("/api/transactions");
      if (!res.ok) throw new Error("Failed to fetch transactions");
      return res.json();
    },
  });

  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      const fullName =
        `${tx.wallet.user.firstName} ${tx.wallet.user.lastName}`.toLowerCase();

      const serviceTitle =
        tx.serviceRequests?.title?.toLowerCase() || "";

      const matchesUser = fullName.includes(userFilter.toLowerCase());
      const matchesService = serviceTitle.includes(
        serviceFilter.toLowerCase()
      );

      return matchesUser && matchesService;
    });
  }, [transactions, userFilter, serviceFilter]);

  if (isLoading) return <p>Loading Transactions...</p>;

  return (
    <div>
      <Header />
      <AdminLayout>
        <h2 className="text-2xl font-bold mb-4">Transactions</h2>

        {/* Filters */}
        <div className="flex gap-4 mb-4">
          <Input
            placeholder="Filter by Username..."
            value={userFilter}
            onChange={(e) => setUserFilter(e.target.value)}
          />

          <Input
            placeholder="Filter by Service Title..."
            value={serviceFilter}
            onChange={(e) => setServiceFilter(e.target.value)}
          />
        </div>

        <Card className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-4 py-2 text-left font-medium text-gray-500">
                  User
                </th>
                <th className="px-4 py-2 text-left font-medium text-gray-500">
                  Service Requests
                </th>
                <th className="px-4 py-2 text-left font-medium text-gray-500">
                  Type
                </th>
                <th className="px-4 py-2 text-left font-medium text-gray-500">
                  Amount
                </th>
                <th className="px-4 py-2 text-left font-medium text-gray-500">
                  Date
                </th>
              </tr>
            </thead>

            <tbody className="bg-white divide-y divide-gray-200">
              {filteredTransactions.map((tx) => (
                <tr key={tx.id}>
                  {/* User */}
                  <td className="px-4 py-2">
                    {tx.wallet.user.firstName}{" "}
                    {tx.wallet.user.lastName}
                  </td>

                  {/* Service Title */}
                  <td className="px-4 py-2 font-medium">
                    {tx.serviceRequests?.title || "-"}
                  </td>

                  {/* Type */}
                  <td className="px-4 py-2 capitalize">
                    <span
                      className={`font-medium ${
                        tx.type === "escrow_funding"
                          ? "text-blue-600"
                          : "text-green-600"
                      }`}
                    >
                      {tx.type.replace("_", " ")}
                    </span>
                  </td>

                  {/* Amount */}
                  <td className="px-4 py-2 font-semibold">
                    ${Number(tx.amount).toLocaleString()}
                  </td>

                  {/* Date */}
                  <td className="px-4 py-2">
                    {new Date(tx.createdAt).toLocaleString()}
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
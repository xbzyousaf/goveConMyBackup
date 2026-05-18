import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { AdminLayout } from "./AdminLayouts";
import { Header } from "@/components/Header";
import { Card } from "@/components/ui/card";

export default function AdminPlatformFees() {
  const [, setLocation] = useLocation();

  const {
    data: fees = [],
    isLoading,
  } = useQuery({
    queryKey: ["/api/admin/platform-fees"],

    queryFn: async () => {
      const res = await fetch(
        "/api/admin/platform-fees"
      );

      const data = await res.json();

      return Array.isArray(data)
        ? data
        : data.data || [];
    },
  });

  if (isLoading) {
    return (
      <p className="p-6">
        Loading platform fees...
      </p>
    );
  }

  return (
    <div>
      <Header />

      <AdminLayout>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">
            Manage Platform Fees
          </h2>
        </div>

        <Card className="overflow-x-auto">
          <table className="min-w-full divide-y">
            <thead>
              <tr className="bg-gray-50 text-sm">
                <th className="px-4 py-2 text-left">
                  Type
                </th>

                <th className="px-4 py-2 text-left">
                  Value
                </th>

                <th className="px-4 py-2 text-left">
                  Status
                </th>

                <th className="px-4 py-2 text-left">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody className="divide-y">
              {fees.map((fee: any) => (
                <tr key={fee.id}>
                  <td className="px-4 py-2 capitalize">
                    {fee.type}
                  </td>

                  <td className="px-4 py-2">
                    {fee.type === "percentage"
                      ? `${fee.value}%`
                      : `$${fee.value}`}
                  </td>

                  <td className="px-4 py-2">
                    <span
                      className={`px-2 py-1 rounded text-xs ${
                        fee.isActive
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {fee.isActive
                        ? "Active"
                        : "Inactive"}
                    </span>
                  </td>

                  <td className="px-4 py-2">
                    <Button
                      size="sm"
                      onClick={() =>
                        setLocation(
                          `/admin/edit-platform-fee/${fee.id}`
                        )
                      }
                    >
                      Edit
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
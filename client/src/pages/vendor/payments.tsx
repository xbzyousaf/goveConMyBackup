import { Header } from "@/components/Header";
import { useEffect, useState } from "react";

interface Payment {
  id: string;
  title: string;
  status: string;
  paymentStatus: string;
  escrowStatus: string;
  escrowAmount: number;
  releasedAt?: string;
  platformFee?: number;
  vendorEarning?: number;
  heldAt?: string;
}

export default function VendorPayments() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/vendor/payments")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch payments");
        return res.json();
      })
      .then((data) => {
        setPayments(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  // 🔹 Filters
  const escrowHeld = payments.filter(
    (p) => p.paymentStatus === "escrow_held"
  );

  const released = payments.filter(
    (p) => p.paymentStatus === "released"
  );

  const pending = payments.filter(
    (p) => p.paymentStatus === "pending"
  );

  // 🔹 Totals
  const calculateTotal = (items: Payment[]) =>
    items.reduce((sum, p) => {
      const amount =
        p.vendorEarning || 0;
      return sum + Number(amount);
    }, 0);

  if (loading) return <div className="p-6">Loading payments...</div>;
  if (error) return <div className="p-6 text-red-500">{error}</div>;

  return (
    <div>
        <Header />
    <div className="p-6 space-y-10 container mx-auto">
        
      <h1 className="text-2xl font-bold">Vendor Payments</h1>
      {/* ================= Released ================= */}
      <Section
        title="Released (Cleared Payments)"
        items={released}
        total={calculateTotal(released)}
      />
      {/* ================= Escrow Held ================= */}
      <Section
        title="Escrow Held (Being Cleared)"
        items={escrowHeld}
        total={calculateTotal(escrowHeld)}
      />

      {/* ================= Pending ================= */}
      <Section
        title="Pending Payment"
        items={pending}
        total={calculateTotal(pending)}
      />
    </div>
    </div>
  );
}

function Section({
  title,
  items,
  total,
}: {
  title: string;
  items: Payment[];
  total: number;
}) {
  return (
    <div className="bg-white shadow-md rounded-xl p-6 border border-gray-200">
      
      {/* Card Header */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">
          {title}
        </h2>
        <span className="text-lg font-bold">
          Total: ${total.toFixed(2)}
        </span>
      </div>

      {items.length === 0 ? (
        <p className="text-gray-500">No records found.</p>
      ) : (
        <table className="w-full border border-gray-200 text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-2 border">Request</th>
              <th className="p-2 border">Status</th>
              <th className="p-2 border">Escrow</th>
              <th className="p-2 border">Platform Fee</th>
              <th className="p-2 border">Vendor Amount</th>
              <th className="p-2 border">Created</th>
              <th className="p-2 border">Completed</th>
            </tr>
          </thead>
          <tbody>
            {items.map((p) => (
              <tr key={p.id} className="text-center">
                <td className="p-2 border">{p.title}</td>
                <td className="p-2 border">{p.status}</td>
                <td className="p-2 border font-medium">
                ${Number(p.escrowAmount || 0).toFixed(2)}
                </td>

                <td className="p-2 border text-red-600">
                ${Number(p.platformFee || 0).toFixed(2)}
                </td>

                <td className="p-2 border text-green-600 font-semibold">
                ${Number(p.vendorEarning || 0).toFixed(2)}
                </td>
                <td className="p-2 border">
                  {p.heldAt
                    ? new Date(p.heldAt).toLocaleString()
                    : "-"}
                </td>
                <td className="p-2 border">
                  {p.releasedAt
                    ? new Date(p.releasedAt).toLocaleString()
                    : "-"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
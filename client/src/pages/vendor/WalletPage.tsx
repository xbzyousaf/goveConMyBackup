import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

export default function StripePayoutTab() {
  console.log('jeee')
  const [status, setStatus] = useState("loading");
  const [amount, setAmount] = useState("");

  useEffect(() => {
    fetch("/api/wallet/connect-status", {
      credentials: "include",
      cache: "no-store",
    })
      .then((res) => {
        if (!res.ok) throw new Error("API failed");
        return res.json();
      })
      .then((data) => setStatus(data.status))
      .catch(() => setStatus("error"));
  }, []);

  const connectStripe = async () => {
    const res = await fetch("/api/wallet/connect-account", {
      method: "POST",
      credentials: "include",
    });

    const data = await res.json();
    window.location.href = data.url;
  };

  const withdraw = async () => {
    await fetch("/api/wallet/withdraw", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({ amount: Number(amount) }),
    });

    alert("Withdraw successful");
    window.location.reload();
  };

  if (status === "loading") return <p>Loading...</p>;

  return (
    <div className="border p-4 rounded mt-6">
      <h2 className="text-lg font-semibold mb-3">
        Payout Settings
      </h2>

      {status === "not_connected" && (
  <Button onClick={connectStripe}>Connect Stripe</Button>
)}

{status === "pending_verification" && (
  <p className="text-yellow-600">
    Verification in progress (Stripe reviewing your details)
  </p>
)}

{status === "verified" && (
  <p className="text-green-600">
    Ready for payouts ✅
  </p>
)}
    </div>
  );
}
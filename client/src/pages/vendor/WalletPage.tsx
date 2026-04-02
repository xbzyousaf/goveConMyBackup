import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

export default function StripePayoutTab() {
  const [account, setAccount] = useState<any>(null);
  const [earnings, setEarnings] = useState<any[]>([]);
  const [amount, setAmount] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/wallet/connect-status", {
      credentials: "include",
      cache: "no-store",
    })
      .then((res) => {
        if (!res.ok) throw new Error("API failed");
        return res.json();
      })
      .then((data) => setAccount(data))
      .catch(() => setAccount("error"));
  }, []);
  useEffect(() => {
    loadEarnings(1);
  }, []);

const loadEarnings = async (pageNumber: number) => {
  if (pageNumber < 1 || pageNumber > totalPages) return;

  setLoading(true);

  try {
    const res = await fetch(
      `/api/wallet/vendor/earnings?page=${pageNumber}&limit=5`,
      { credentials: "include" }
    );

    const data = await res.json();

    setEarnings(data.data);
    setPage(data.currentPage);
    setTotalPages(data.totalPages);

  } catch (err) {
    console.error(err);
  }

  setLoading(false);
};
const handlePrev = () => {
  if (page > 1) {
    loadEarnings(page - 1);
  }
};

const handleNext = () => {
  if (page < totalPages) {
    loadEarnings(page + 1);
  }
};
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

  if (!account) return <p>Loading...</p>;

  return (
    <div className="border rounded-2xl p-5 mt-6 shadow-sm bg-white">

  <h2 className="text-xl font-semibold mb-4">
    Payout Settings
  </h2>

  {/* NOT CONNECTED */}
  {!account?.connected && (
    <div className="flex flex-col items-center justify-center py-6 text-center">
      <p className="text-gray-500 mb-3">
        Connect your Stripe account to receive payouts
      </p>

      <Button onClick={connectStripe}>
        Connect Stripe
      </Button>
    </div>
  )}

  {/* CONNECTED */}
  {account?.connected && (
    <div className="space-y-4">

      {/* STATUS BADGES */}
      <div className="p-3 border rounded-lg bg-gray-50">
        <p className="text-xs text-gray-500 mb-2">Statuses</p>
      <div className="flex flex-wrap gap-2">
        <span className={`px-3 py-1 text-sm rounded-full ${
          account.chargesEnabled
            ? "bg-green-100 text-green-700"
            : "bg-red-100 text-red-600"
        }`}>
          Charges {account.chargesEnabled ? "Enabled ✅" : "Disabled"}
        </span>

        <span className={`px-3 py-1 text-sm rounded-full ${
          account.payoutsEnabled
            ? "bg-green-100 text-green-700"
            : "bg-yellow-100 text-yellow-700"
        }`}>
          Payouts {account.payoutsEnabled ? "Enabled ✅" : "Pending"}
        </span>

        <span className={`px-3 py-1 text-sm rounded-full ${
          account.detailsSubmitted
            ? "bg-green-100 text-green-700"
            : "bg-gray-100 text-gray-600"
        }`}>
          Details {account.detailsSubmitted ? "Submitted ✅" : "Incomplete"}
        </span>
      </div>
      </div>

      {/* ACCOUNT INFO GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        <div className="p-3 border rounded-lg bg-gray-50">
          <p className="text-xs text-gray-500">Account ID</p>
          <p className="font-medium break-all">{account.accountId}</p>
        </div>

        <div className="p-3 border rounded-lg bg-gray-50">
          <p className="text-xs text-gray-500">Account Type</p>
          <p className="font-medium capitalize">{account.type}</p>
        </div>

        <div className="p-3 border rounded-lg bg-gray-50">
          <p className="text-xs text-gray-500">Email</p>
          <p className="font-medium">{account.email || "N/A"}</p>
        </div>

        <div className="p-3 border rounded-lg bg-gray-50">
          <p className="text-xs text-gray-500">Status</p>
          <p className="font-medium">
            {account.payoutsEnabled
              ? "Ready for payouts"
              : "Verification required"}
          </p>
        </div>

      </div>

      {/* REQUIREMENTS */}
      {account?.requirements?.currentlyDue?.length > 0 && (
        <div className="border rounded-lg p-4 bg-yellow-50">
          <p className="font-semibold text-yellow-700 mb-2">
            Action Required
          </p>

          <ul className="text-sm text-yellow-700 list-disc ml-5 space-y-1">
            {account.requirements.currentlyDue.map((item: string) => (
              <li key={item}>{item.replace(/_/g, " ")}</li>
            ))}
          </ul>

          <Button
            onClick={connectStripe}
            className="mt-3"
            variant="secondary"
          >
            Complete Verification
          </Button>
        </div>
      )}

      {/* READY MESSAGE */}
      {account.payoutsEnabled && (
        <div className="p-3 bg-green-50 border rounded-lg text-green-700 font-medium">
          ✅ Your account is fully verified and ready for payouts
        </div>
      )}
     <div className="mt-6 border rounded-2xl p-5 shadow-sm bg-white">
  <h3 className="text-lg font-semibold mb-4">Earnings</h3>

  {earnings.length === 0 && (
    <p className="text-gray-500 text-sm">No earnings yet</p>
  )}

  <div className="space-y-3">
    {earnings.map((e, i) => {
      const amount = Number(e.amount);
      const fee = Number(e.platformFee || 0);
      const earning = Number(e.vendorEarning);

      const isDisputedRelease = earning !== (amount - fee);

      const displayStatus = isDisputedRelease
        ? "released after disputed"
        : e.status;

      return (
        <div
          key={i}
          className="border rounded-lg p-4 flex justify-between items-center"
        >
          {loading && (
            <p className="text-xs text-gray-400 text-center mt-2">
              Loading...
            </p>
          )}
          <div>
            <p className="font-medium text-gray-800">${earning}</p>

            <p className="text-xs text-gray-500">
              {displayStatus} • {new Date(e.heldAt).toLocaleString()}
            </p>
          </div>

          <span
            className={`text-xs px-2 py-1 rounded-full ${
              isDisputedRelease
                ? "bg-yellow-100 text-yellow-700"
                : "bg-green-100 text-green-700"
            }`}
          >
            {isDisputedRelease ? "Disputed" : "Paid"}
          </span>
        </div>
      );
    })}
  </div>

  {/* Pagination */}
<div className="mt-4 flex items-center justify-between">

  {/* LEFT - PREVIOUS */}
  <Button
    variant="outline"
    onClick={handlePrev}
    disabled={page === 1 || loading}
  >
    ← Previous
  </Button>

  {/* CENTER - PAGE INFO */}
  <p className="text-sm text-gray-600">
    Page {page} of {totalPages}
  </p>

  {/* RIGHT - NEXT */}
  <Button
    variant="outline"
    onClick={handleNext}
    disabled={page === totalPages || loading}
  >
    Next →
  </Button>

</div>
  </div>

    </div>
  )}
</div>
  );
}
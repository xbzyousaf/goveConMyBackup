import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/Header";

export default function BillingPage() {
  const queryClient = useQueryClient();

  const { data: sub } = useQuery({
    queryKey: ["/api/subscription/current"],
  });

  const [confirmAction, setConfirmAction] = useState<null | "cancel" | "resume">(null);

  // =============================
  // ✅ REAL STATUS FROM DB
  // =============================
  const status = sub?.status || "free";

  const isActive = status === "active";
  const isCanceled = status === "canceled";
  const isPastDue = status === "past_due";

  const isCancelScheduled = sub?.cancelAtPeriodEnd === true;

  const isExpired =
    sub?.currentPeriodEnd &&
    new Date(sub.currentPeriodEnd).getTime() < Date.now();

  // ✅ CURRENT PLAN DETECTION
  const isOnMonthly = isActive && !isExpired;
    const isOnFree = !isOnMonthly;

  // ✅ MUTATIONS
  const cancelMutation = useMutation({
    mutationFn: async () => {
      await fetch("/api/subscription/cancel", { method: "POST" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/subscription/current"] });
      setConfirmAction(null);
    },
  });

  const resumeMutation = useMutation({
    mutationFn: async () => {
      await fetch("/api/subscription/resume", { method: "POST" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/subscription/current"] });
      setConfirmAction(null);
    },
  });

  const subscribe = async (plan: "monthly" | "yearly") => {
    const res = await fetch("/api/stripe/create-subscription", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ plan }),
    });

    const data = await res.json();
    window.location.href = data.url;
  };

  // =============================
  // ✅ PLANS (UNCHANGED)
  // =============================
  const plans = [
    {
      id: "free",
      name: "Free",
      price: "$0",
      description: "Basic access",
      features: ["Limited Marketplace", "Basic Visibility"],
    },
    {
      id: "monthly",
      name: "Monthly",
      price: "$9.97",
      description: "Billed monthly",
      features: ["Full Access", "Templates", "Priority Support"],
    },
    {
      id: "yearly",
      name: "Yearly",
      price: "$119.64",
      description: "Billed yearly (save more)",
      features: ["Full Access", "Templates", "Priority Support"],
    },
  ];

  return (
    <div>
      <Header />

      <div className="max-w-6xl mx-auto p-6 space-y-8">
        <h1 className="text-2xl font-bold">Billing & Subscription</h1>

        {/* =============================
            ✅ CURRENT STATUS
        ============================= */}
        <div className="border p-6 rounded-lg space-y-3">
          <p>
            <b>Plan:</b> {isOnMonthly ? "Monthly" : "Free"}
          </p>

          <p>
            <b>Status:</b>{" "}
            <span
              className={
                isActive
                  ? "text-green-600"
                  : isPastDue
                  ? "text-yellow-600"
                  : "text-red-600"
              }
            >
              {status}
            </span>
          </p>

          <p>
            <b>Next Billing / Expiry:</b>{" "}
            {sub?.currentPeriodEnd
              ? new Date(sub.currentPeriodEnd).toLocaleDateString()
              : "-"}
          </p>

          {isActive && isCancelScheduled && !isExpired && (
            <p className="text-red-500">
              Will cancel on{" "}
              {new Date(sub.currentPeriodEnd).toLocaleDateString()}
            </p>
          )}

          {isExpired && sub && (
            <p className="text-red-600 font-semibold">
              Subscription ended
            </p>
          )}
        </div>

        {/* =============================
            ✅ PLANS GRID (FIXED LOGIC ONLY)
        ============================= */}
        <div className="grid md:grid-cols-3 gap-6">
          {plans.map((plan) => {
            // ✅ FIXED CURRENT PLAN LOGIC
            let isCurrent = false;

            if (plan.id === "monthly" && isOnMonthly) {
            isCurrent = true;
            }

            if (plan.id === "free" && isOnFree) {
            isCurrent = true;
            }

            return (
              <div
                key={plan.id}
                className={`border rounded-lg p-6 space-y-4 ${
                  isCurrent ? "border-green-500" : ""
                }`}
              >
                <h2 className="text-xl font-semibold">{plan.name}</h2>

                <p className="text-2xl font-bold">{plan.price}</p>
                <p className="text-sm text-gray-500">{plan.description}</p>

                <ul className="text-sm space-y-1">
                  {plan.features.map((f) => (
                    <li key={f}>✔ {f}</li>
                  ))}
                </ul>

                {/* ✅ CURRENT PLAN TEXT */}
                {isCurrent && (
                  <p className="text-green-600">Current Plan</p>
                )}

                {/* =============================
                    ✅ MONTHLY PLAN
                ============================= */}
                {plan.id === "monthly" && (
                  <>
                  
                    {/* SUBSCRIBE */}
                    {( !sub) && (
                      <Button onClick={() => subscribe("monthly")}>
                        Subscribe ($9.97/month)
                      </Button>
                    )}

                    {/* CANCEL */}
                    {isCurrent && isActive && !isCancelScheduled && (
                      <Button
                        variant="destructive"
                        onClick={() => setConfirmAction("cancel")}
                      >
                        Cancel
                      </Button>
                    )}

                    {/* RESUME */}
                    {sub && isExpired && (
                    <Button onClick={() => setConfirmAction("resume")}>
                        Resume
                    </Button>
                    )}
                  </>
                )}

                {/* =============================
                    // ❌ YEARLY PLAN
                ============================= */}
                {plan.id === "yearly" && (
                  <p className="text-sm text-gray-400">
                    Coming soon
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* =============================
          ✅ MODAL
      ============================= */}
      {confirmAction && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 space-y-4 w-96">
            <h2 className="text-lg font-semibold">
              {confirmAction === "cancel"
                ? "Cancel Subscription"
                : "Resume Subscription"}
            </h2>

            <p className="text-sm text-gray-600">
              {confirmAction === "cancel"
                ? "You will keep access until period end."
                : "Subscription will continue normally."}
            </p>

            <div className="flex justify-end gap-3">
              <Button variant="ghost" onClick={() => setConfirmAction(null)}>
                Close
              </Button>

              <Button
                variant={
                  confirmAction === "cancel" ? "destructive" : "default"
                }
                onClick={() => {
                  if (confirmAction === "cancel") {
                    cancelMutation.mutate();
                  } else {
                    resumeMutation.mutate();
                  }
                }}
              >
                Confirm
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
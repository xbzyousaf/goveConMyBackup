import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/Header";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useEffect } from "react";
import { useLocation } from "wouter";

export default function BillingPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  useEffect(() => {
  const url = new URL(window.location.href);

  if (url.searchParams.get("success")) {
    toast.success("Subscription activated successfully 🎉");
  }

  if (url.searchParams.get("canceled")) {
    toast.error("Payment was canceled");
  }
}, []);

  const { data: sub } = useQuery({
    queryKey: ["/api/subscription/current"],
  });
  const { data: gateData } = useQuery({
    queryKey: ["/api/urgency-slots"],
  });
    
    console.log("Stripe URL missing", sub);

  const [confirmAction, setConfirmAction] = useState<null | "cancel" | "resume">(null);
  const [isSubscribing, setIsSubscribing] = useState<null | "pilot" | "beta">(null);
  // =============================
  // ✅ REAL STATUS FROM DB
  // =============================
  const status = sub?.status || "inactive";

  const isActive = status === "active";
  const isCanceled = status === "canceled";
  const isPastDue = status === "past_due";
  const currentPlan = (
  sub?.subscriptionTier ||
  sub?.planName ||
  ""
).toLowerCase();

  const isCancelScheduled = sub?.cancelAtPeriodEnd === true;

  const isExpired =
    sub?.currentPeriodEnd &&
    new Date(sub.currentPeriodEnd).getTime() < Date.now();

  // ✅ CURRENT PLAN DETECTION
  const isOnPilot = isActive && !isExpired;
    const isOnFree = !isOnPilot;

  // ✅ MUTATIONS
 const cancelMutation = useMutation({
  mutationFn: async () => {
    await fetch("/api/subscription/cancel", { method: "POST" });
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ["/api/subscription/current"] });
    setConfirmAction(null);

    toast({
      title: "Subscription Cancelled",
      description: "Your subscription will end at the billing period.",
    });
  },
  onError: () => {
    toast({
      title: "Error",
      description: "Failed to cancel subscription",
      variant: "destructive",
    });
  },
});

const handleResume = async () => {
  try {
    const res = await fetch("/api/subscription/resume", {
      method: "POST",
    });

    const data = await res.json();

    // 🔥 redirect case (resubscribe)
    if (data.type === "checkout") {
      toast({
        title: "Redirecting...",
        description: "Taking you to secure payment page",
      });

      window.location.href = data.url;
      return;
    }

    // ✅ normal resume
    queryClient.invalidateQueries({ queryKey: ["/api/subscription/current"] });
    setConfirmAction(null);

    toast({
      title: "Subscription Resumed",
      description: "Your subscription is active again.",
    });

  } catch (err) {
    toast({
      title: "Error",
      description: "Failed to resume subscription",
      variant: "destructive",
    });
  }
};
const subscribe = async (plan: "pilot" | "beta") => {
  if (isSubscribing) return;

  setIsSubscribing(plan);

  await new Promise((r) => setTimeout(r, 300));

  try {
    const res = await fetch("/api/subscription", {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ plan }),
    });

    const data = await res.json();

    if (!data?.url) {
      toast({
        title: "Error",
        description: data?.message || "Checkout failed",
        variant: "destructive",
      });

      setIsSubscribing(null);
      return;
    }

    toast({
      title: "Redirecting...",
      description: "Opening Stripe checkout",
    });

    window.location.href = data.url;

  } catch (err) {
    toast({
      title: "Error",
      description: "Something went wrong",
      variant: "destructive",
    });

    setIsSubscribing(null);
  }
};

  // =============================
  // ✅ PLANS (UNCHANGED)
  // =============================
  const plans = [
  {
    id: "beta",
    name: "Beta",
    price: "$0",
    description: "Assessment with blurred report",
    features: [
      "AI Audit",
      "Readiness Score",
      "Blurred Report",
    ],
  },
  {
    id: "pilot",
    name: "Pilot",
    price: "$49.95/month",
    description: "Full access",
    features: [
      "Full Report",
      "Templates",
      "Vendor Matching",
    ],
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
            <b>Plan:</b>{" "} {currentPlan
                ? currentPlan.charAt(0).toUpperCase() + currentPlan.slice(1)
                : "No Subscription"}
          </p>

          <p>
            <b>Status:</b>{" "}
            <span
              className={
                isActive
                  ? "text-gold"
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
          {plans
            .filter((plan) => {
              // hide beta only for new users
              if (
                plan.id === "beta" &&
                gateData?.betaClosed &&
                currentPlan !== "beta"
              ) {
                return false;
              }

              return true;
            })
            .map((plan) => {
            // ✅ FIXED CURRENT PLAN LOGIC
            let isCurrent = false;

            if (plan.id === "beta") {
              isCurrent = currentPlan === "beta";
            }

            if (plan.id === "pilot") {
              isCurrent =
                currentPlan === "pilot" &&
                isActive &&
                !isExpired;
            }

            return (
              <div
                key={plan.id}
                className={`border rounded-lg p-6 space-y-4 ${
                  isCurrent ? "border-gold" : ""
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
                  <p className="text-gold">Current Plan</p>
                )}

                {/* =============================
                    ✅ MONTHLY PLAN
                ============================= */}
                {plan.id === "beta" && (
  <>
    {!gateData?.betaClosed && !isCurrent && (
      <Button
        onClick={() => subscribe("beta")}
        disabled={isSubscribing === "beta"}
      >
        {isSubscribing === "beta" ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Redirecting...
          </>
        ) : (
          "Join Beta Free"
        )}
      </Button>
    )}

    {!gateData?.betaClosed && (
      <p className="text-sm text-muted-foreground">
        {gateData?.remainingSlots} slots remaining
      </p>
    )}
  </>
)}

                {plan.id === "pilot" && (
                  <>
                    {/* ✅ SUBSCRIBE (only if no active plan) */}
                    {currentPlan !== "pilot" && (
                      <Button
                        onClick={() => subscribe("pilot")}
                        disabled={isSubscribing === "pilot"}
                      >
                        {isSubscribing === "pilot" ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Redirecting...
                          </>
                        ) : (
                          "Upgrade to Pilot"
                        )}
                      </Button>
                    )}

                    {/* ✅ CANCEL (only if active & not already cancel scheduled) */}
                    {isCurrent && isActive && !isCancelScheduled && (
                      <Button
                        className="bg-accent"
                        onClick={() => setConfirmAction("cancel")}
                      >
                        Cancel
                      </Button>
                    )}

                    {/* ✅ RESUME (only if expired or canceled) */}
                   {(isCancelScheduled || isExpired || isCanceled) && (
                      <Button onClick={() => setConfirmAction("resume")}>
                        {isExpired || isCanceled ? "Resubscribe" : "Resume"}
                      </Button>
                    )}
                  </>
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
                    handleResume();
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
import { Elements } from "@stripe/react-stripe-js";
import { stripePromise  } from "../../lib/stripe";
import CheckoutForm from "@/components/CheckoutForm";
import { useEffect, useState } from "react";
import { useLocation } from "wouter";

export default function Checkout() {

  const [clientSecret, setClientSecret] = useState("");
  const requestId = new URLSearchParams(window.location.search).get("requestId");

  useEffect(() => {

    fetch("/api/payments/create-intent", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        requestId
      }),
    })
      .then(res => res.json())
      .then(data => setClientSecret(data.clientSecret));

  }, [requestId]);

  if (!clientSecret) return <p>Loading payment...</p>;

  return (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">

    <div className="w-full max-w-md bg-white shadow-lg rounded-xl p-6">

      <h2 className="text-xl font-semibold mb-4">
        Fund Escrow Payment
      </h2>

      <Elements stripe={stripePromise} options={{ clientSecret }}>
        <CheckoutForm requestId={requestId} clientSecret={clientSecret} />
      </Elements>

    </div>

  </div>
);
}
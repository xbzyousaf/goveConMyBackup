import { useToast } from "@/hooks/use-toast";
import { useStripe, useElements, PaymentElement } from "@stripe/react-stripe-js";
import { useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";

type Props = {
  clientSecret: string;
  requestId: string | null;
};

export default function CheckoutForm({ requestId, clientSecret }: Props) {
  const queryClient = useQueryClient();
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [, navigate] = useLocation();

  const handleSubmit = async (e: any) => {
    e.preventDefault();

    if (!stripe || !elements) return;

    const result = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: window.location.origin + "/payment-success",
      },
      redirect: "if_required",
    });

    if (result.error) {
      console.log(result.error.message);

      toast({
        title: "Payment failed",
        description: result.error.message,
        variant: "destructive",
      });

    } else if (result.paymentIntent?.status === "succeeded") {
     await fetch(`/api/service-requests/${requestId}/pay`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({
        paymentIntentId: result.paymentIntent.id,
      }),
      
    });

      toast({
        title: "Payment successful 🎉",
        description: "Your escrow has been funded.",
      });
      // refresh request data
      queryClient.invalidateQueries({
        queryKey: ["service-request", requestId],
      });

      navigate(`/vendor/requests/${requestId}`);

    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">

      <PaymentElement />

      <button
        type="submit"
        className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-medium"
      >
        Pay
      </button>

    </form>
  );
}
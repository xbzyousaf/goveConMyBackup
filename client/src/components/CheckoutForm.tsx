import { useToast } from "@/hooks/use-toast";
import { useStripe, useElements, PaymentElement } from "@stripe/react-stripe-js";

type Props = {
  clientSecret: string;
  requestId: string | null;
};

export default function CheckoutForm({ clientSecret }: Props) {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();

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

      toast({
        title: "Payment successful 🎉",
        description: "Your escrow has been funded.",
      });

    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">

      <PaymentElement />

      <button
        type="submit"
        className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-medium"
      >
        Pay & Fund Escrow
      </button>

    </form>
  );
}
import { useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

export default function ForgotPassword() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim()) {
      toast({
        title: "Email required",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);

      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message);
      }

      toast({
        title: "Success",
        description: "Password reset email sent",
      });

      setLocation("/login");

    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Forgot Password</CardTitle>
        </CardHeader>

        <CardContent>
          <form onSubmit={submit} className="space-y-4">

            <Input
              type="email"
              placeholder="Email Address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <Button
              className="w-full"
              disabled={loading}
            >
              {loading ? "Sending..." : "Send Reset Link"}
            </Button>

          </form>
        </CardContent>
      </Card>
    </div>
  );
}
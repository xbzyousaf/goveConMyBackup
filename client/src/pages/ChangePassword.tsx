import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Header } from "../components/Header";
import { ArrowLeft, Eye, EyeOff } from "lucide-react";

export default function ChangePassword() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [form, setForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmNewPassword: "",
  });
  const isValid =
    form.currentPassword.trim() &&
    form.newPassword.trim() &&
    form.confirmNewPassword.trim() !== "";

  const validateForm = () => {
    if (!form.currentPassword.trim()) {
      toast({ title: "Current password required", variant: "destructive" });
      return false;
    }

    if (!form.newPassword.trim()) {
      toast({ title: "New password required", variant: "destructive" });
      return false;
    }

    if (form.newPassword.length < 8) {
      toast({
        title: "Password must be at least 8 characters",
        variant: "destructive",
      });
      return false;
    }

    if (form.newPassword !== form.confirmNewPassword) {
      toast({ title: "Passwords do not match", variant: "destructive" });
      return false;
    }

    if (form.currentPassword === form.newPassword) {
      toast({
        title: "New password must be different from current password",
        variant: "destructive",
      });
      return false;
    }

    return true;
  };

  const changePasswordMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/change-password", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message);
      }

      return data;
    },

    onSuccess: () => {
      toast({ title: "Password updated successfully" });

      setForm({
        currentPassword: "",
        newPassword: "",
        confirmNewPassword: "",
      });

      queryClient.invalidateQueries();

      setLocation("/dashboard");
    },

    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    changePasswordMutation.mutate();
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto max-w-2xl px-4 py-6 space-y-6">
          <Link href="/vendor-dashboard">
            <Button variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </Link>
        <Card className="">
          <CardHeader>
            <CardTitle>Change Password</CardTitle>
          </CardHeader>

          <CardContent >
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="relative">
                <Input
                  type={showCurrentPassword ? "text" : "password"}
                  placeholder="Current Password *"
                  value={form.currentPassword}
                  className={`pr-10 ${
                    !form.currentPassword ? "border-red-500" : ""
                  }`}
                  onChange={(e) =>
                    setForm({ ...form, currentPassword: e.target.value })
                  }
                />

                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                  onClick={() =>
                    setShowCurrentPassword(!showCurrentPassword)
                  }
                >
                  {showCurrentPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>

              <div className="relative">
                <Input
                  type={showNewPassword ? "text" : "password"}
                  placeholder="New Password *"
                  value={form.newPassword}
                  className={`pr-10 ${
                    !form.newPassword ? "border-red-500" : ""
                  }`}
                  onChange={(e) =>
                    setForm({ ...form, newPassword: e.target.value })
                  }
                />

                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                  onClick={() =>
                    setShowNewPassword(!showNewPassword)
                  }
                >
                  {showNewPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>

              <div className="relative">
                <Input
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirm New Password *"
                  value={form.confirmNewPassword}
                  className={`pr-10 ${
                    !form.confirmNewPassword ? "border-red-500" : ""
                  }`}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      confirmNewPassword: e.target.value,
                    })
                  }
                />

                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                  onClick={() =>
                    setShowConfirmPassword(!showConfirmPassword)
                  }
                >
                  {showConfirmPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>

              <div className="flex justify-end justify-between gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setLocation("/dashboard")}
                >
                  Cancel
                </Button>

                <Button
                  type="submit"
                  disabled={!isValid || changePasswordMutation.isPending}
                >
                  {changePasswordMutation.isPending
                    ? "Updating..."
                    : "Update Password"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

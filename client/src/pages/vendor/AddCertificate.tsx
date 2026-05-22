import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Header } from "@/components/Header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

export default function CreateCertificate() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [form, setForm] = useState({
    certificateName: "",
    receivedFrom: "",
    yearReceived: "",
    // image: null as File | null,
  });

  const isValid =
    form.certificateName.trim() &&
    form.receivedFrom.trim() &&
    form.yearReceived !== "";
    // form.image !== null;

  const mutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/certificate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          certificateName: form.certificateName,
          receivedFrom: form.receivedFrom,
          yearReceived: form.yearReceived,
        }),
      });

      if (!res.ok) {
        let message = "Failed to create certificate";

        try {
          const err = await res.json();
          message = err.message || message;
        } catch {
          message = await res.text();
        }

        throw new Error(message);
      }

      return res.json();
    },

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/certificate"] });

      toast({
        title: "Certificate created successfully",
      });

      setLocation("/vendor-dashboard");
    },

    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto max-w-2xl px-4 py-10 space-y-6">
        <Card>
          <CardContent className="p-6 space-y-4">
            <h2 className="text-2xl font-bold">Add Certificate</h2>

            <Input
              placeholder="Certificate Name *"
              value={form.certificateName}
              className={!form.certificateName ? "border-red-500" : ""}
              onChange={e => setForm({ ...form, certificateName: e.target.value })}
            />

            <Input
              placeholder="Received From *"
              value={form.receivedFrom}
              className={!form.receivedFrom ? "border-red-500" : ""}
              onChange={e => setForm({ ...form, receivedFrom: e.target.value })}
            />

            <Input
              type="number"
              placeholder="Year Received *"
              value={form.yearReceived}
              className={!form.yearReceived ? "border-red-500" : ""}
              onChange={e => setForm({ ...form, yearReceived: e.target.value })}
            />

            {/* <Input
              type="file"
              accept="image/*"
              className={!form.image ? "border-red-500" : ""}
              onChange={e => setForm({ ...form, image: e.target.files?.[0] || null })}
            /> */}
          </CardContent>
        </Card>

        <Button
          className="w-full"
          disabled={!isValid || mutation.isPending}
          onClick={() => {
            if (!isValid) {
              toast({
                title: "Missing required fields",
                description:
                  "Certificate name, received from, and year received, are required",
                variant: "destructive",
              });
              return;
            }
            mutation.mutate();
          }}
        >
          {mutation.isPending ? "Saving..." : "Add Certificate"}
        </Button>
      </main>
    </div>
  );
}
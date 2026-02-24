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
    image: null as File | null,
  });

  const isValid =
    form.certificateName.trim() &&
    form.receivedFrom.trim() &&
    form.yearReceived !== "" &&
    form.image !== null;

  const mutation = useMutation({
    mutationFn: async () => {
      const formData = new FormData();
      formData.append("certificateName", form.certificateName);
      formData.append("receivedFrom", form.receivedFrom);
      formData.append("yearReceived", form.yearReceived);
      if (form.image) formData.append("image", form.image);

      const res = await fetch("/api/vendor-certificate", {
        method: "POST",
        body: formData, // browser handles Content-Type for multipart
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Failed to create certificate");
      }

      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/vendor-certificate"] });
      toast({ title: "Certificate created successfully" });
      setLocation("/vendor-dashboard");
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

            <Input
              type="file"
              accept="image/*"
              className={!form.image ? "border-red-500" : ""}
              onChange={e => setForm({ ...form, image: e.target.files?.[0] || null })}
            />
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
                  "Certificate name, received from, year received, and image are required",
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
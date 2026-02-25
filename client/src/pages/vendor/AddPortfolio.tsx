import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Header } from "@/components/Header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

export default function CreatePortfolio() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [form, setForm] = useState({
    projectName: "",
    industry: "",
    duration: "",
    description: "",
    cost: "",
    startDate: "",
    endDate: "",
    attachment: null as File | null,
  });

  const isValid =
    form.projectName.trim() &&
    form.industry.trim() &&
    form.duration.trim() &&
    form.description.trim() &&
    form.cost !== "" &&
    form.startDate !== "" &&
    form.attachment !== null &&
    form.endDate !== "";

  const mutation = useMutation({
    mutationFn: async () => {
      const formData = new FormData();
      formData.append("projectName", form.projectName);
      formData.append("industry", form.industry);
      formData.append("duration", form.duration);
      formData.append("description", form.description);
      formData.append("cost", form.cost);
      formData.append("startDate", form.startDate);
      formData.append("endDate", form.endDate);
      if (form.attachment) formData.append("attachment", form.attachment);

      const res = await fetch("/api/vendor-portfolio", {
        method: "POST",
        body: formData, // must NOT set Content-Type; browser handles it
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Failed to create portfolio");
      }

      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey:  ["/api/vendor-portfolio"],
      });
      toast({ title: "Portfolio created successfully" });
      setLocation("/vendor-dashboard");
    },
  });

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto max-w-4xl px-4 py-10 space-y-6">
        <Card>
          <CardContent className="p-6 space-y-4">
            <h2 className="text-2xl font-bold">Create Portfolio</h2>

            <div className="grid grid-cols-2 gap-4">
              <Input
                placeholder="Project Name *"
                value={form.projectName}
                className={!form.projectName ? "border-red-500" : ""}
                onChange={e => setForm({ ...form, projectName: e.target.value })}
              />

              <Input
                placeholder="Industry *"
                value={form.industry}
                className={!form.industry ? "border-red-500" : ""}
                onChange={e => setForm({ ...form, industry: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input
                placeholder="Duration *"
                value={form.duration}
                className={!form.duration ? "border-red-500" : ""}
                onChange={e => setForm({ ...form, duration: e.target.value })}
              />


              <Input
                type="number"
                placeholder="Cost *"
                value={form.cost}
                className={!form.cost ? "border-red-500" : ""}
                onChange={e => setForm({ ...form, cost: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input
                type="date"
                placeholder="Start Date *"
                value={form.startDate}
                className={!form.startDate ? "border-red-500" : ""}
                onChange={e => setForm({ ...form, startDate: e.target.value })}
              />
              <Input
                type="date"
                placeholder="End Date *"
                value={form.endDate}
                className={!form.endDate ? "border-red-500" : ""}
                onChange={e => setForm({ ...form, endDate: e.target.value })}
              />
            </div>
            
            <Textarea
              placeholder="Description *"
              value={form.description}
              className={!form.description ? "border-red-500" : ""}
              onChange={e => setForm({ ...form, description: e.target.value })}
            />

            <Input
              type="file"
              accept="image/*"
              className={!form.attachment ? "border-red-500" : ""}
              onChange={(e) =>
                setForm({
                  ...form,
                  attachment: e.target.files?.[0] || null
                })
              }
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
                  "Project name, industry, duration, description, cost, start date, and end date are required",
                variant: "destructive",
              });
              return;
            }
            mutation.mutate();
          }}
        >
          {mutation.isPending ? "Creating..." : "Create Portfolio"}
        </Button>
      </main>
    </div>
  );
}
import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocation, useRoute } from "wouter";
import { Header } from "@/components/Header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

export default function CreateService() {
  const [match, params] = useRoute("/service/create/:id");
  const isEdit = !!params?.id;
  const serviceId = params?.id;
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [form, setForm] = useState({
    name: "",
    category: "",
    description: "",
    pricingModel: "Fixed",
    priceMin: "",
    priceMax: ""
  });

  const { data: service, isLoading } = useQuery({
    queryKey: ["service", serviceId],
    queryFn: async () => {
      const res = await fetch(`/api/services/${serviceId}`);
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
    enabled: isEdit
  });

  useEffect(() => {
    if (service) {
      setForm({
        name: service.name || "",
        category: service.category || "",
        description: service.description || "",
        pricingModel: service.pricingModel || "Fixed",
        priceMin: service.priceMin?.toString() || "",
        priceMax: service.priceMax?.toString() || ""
      });
    }
  }, [service]);

  const isValid =
    form.name.trim() &&
    form.category.trim() &&
    form.description.trim() &&
    form.priceMin !== "" &&
    form.priceMax !== "";

  const mutation = useMutation({
    mutationFn: async () => {
      const url = isEdit ? `/api/services/${serviceId}` : `/api/services`;
      const method = isEdit ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          category: form.category,
          description: form.description,
          pricingModel: form.pricingModel,
          priceMin: Number(form.priceMin),
          priceMax: Number(form.priceMax),
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Failed");
      }
      return res.json();
    },
    onSuccess: (updatedService) => {
      // Invalidate BOTH queries: list and single service
      queryClient.invalidateQueries({
        queryKey:  ["/api/services"],
      });

      if (isEdit) {
        queryClient.invalidateQueries({
          queryKey: ["service", serviceId],
        });
      }

      toast({
        title: isEdit
          ? "Service updated successfully"
          : "Service created successfully",
      });

      setLocation("/services");
    }
  });

  if (isEdit && isLoading) {
    return <div className="p-10">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto max-w-4xl px-4 py-10 space-y-6">

        <Card>
          <CardContent className="p-6 space-y-4">

            <h1 className="text-xl font-semibold">
              {isEdit ? "Edit Service" : "Create Service"}
            </h1>

            <Input
              placeholder="Service name *"
              value={form.name}
              className={!form.name ? "border-red-500" : ""}
              onChange={(e) =>
                setForm({ ...form, name: e.target.value })
              }
            />

            <Select
              value={form.category}
              onValueChange={(v) =>
                setForm({ ...form, category: v })
              }
            >
              <SelectTrigger className={!form.category ? "border-red-500" : ""}>
                <SelectValue placeholder="Select category *" />
              </SelectTrigger>

              <SelectContent>
                <SelectItem value="legal">Legal</SelectItem>
                <SelectItem value="hr">HR</SelectItem>
                <SelectItem value="finance">Finance</SelectItem>
                <SelectItem value="cybersecurity">Cybersecurity</SelectItem>
                <SelectItem value="marketing">Marketing</SelectItem>
                <SelectItem value="business_tools">Business Tools</SelectItem>
              </SelectContent>

            </Select>

            <div className="grid grid-cols-2 gap-4">

              <Input
                type="number"
                placeholder="Minimum Price *"
                value={form.priceMin}
                className={!form.priceMin ? "border-red-500" : ""}
                onChange={(e) =>
                  setForm({ ...form, priceMin: e.target.value })
                }
              />

              <Input
                type="number"
                placeholder="Maximum Price *"
                value={form.priceMax}
                className={!form.priceMax ? "border-red-500" : ""}
                onChange={(e) =>
                  setForm({ ...form, priceMax: e.target.value })
                }
              />

            </div>

            <Textarea
              placeholder="Service description *"
              value={form.description}
              className={!form.description ? "border-red-500" : ""}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
            />

            <Select
              value={form.pricingModel}
              onValueChange={(v) =>
                setForm({ ...form, pricingModel: v })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>

              <SelectContent>
                <SelectItem value="Fixed">Fixed</SelectItem>
                <SelectItem value="Hourly">Hourly</SelectItem>
              </SelectContent>

            </Select>

          </CardContent>
        </Card>

        <Button
          className="w-full"
          disabled={!isValid || mutation.isPending}
          onClick={() => mutation.mutate()}
        >
          {mutation.isPending
            ? isEdit ? "Updating..." : "Creating..."
            : isEdit ? "Update Service" : "Create Service"}
        </Button>

      </main>

    </div>
  );
}
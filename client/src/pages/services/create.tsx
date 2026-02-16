import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Header } from "@/components/Header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

export default function CreateService() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [form, setForm] = useState({
    name: "",
    category: "",
    description: "",
    pricingModel: "Fixed",
    priceMin: "",
    priceMax: "",
  });

  const isValid =
    form.name.trim() &&
    form.category.trim() &&
    form.description.trim() &&
    form.priceMin !== "" &&
    form.priceMax !== "";

  const mutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/services", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          category: form.category,
          description: form.description,
          pricingModel: form.pricingModel,
          priceMin: form.priceMin ? Number(form.priceMin) : null,
          priceMax: form.priceMax ? Number(form.priceMax) : null,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Failed to create service");
      }

      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["services"]);
      toast({ title: "Service created successfully" });
      setLocation("/services");
    },
  });

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto max-w-4xl px-4 py-10 space-y-6">
        <Card>
          <CardContent className="p-6 space-y-4">
            <h2 className="text-2xl font-bold">Create Service</h2>

            {/* Service Name */}
            <Input
              placeholder="Service name *"
              value={form.name}
              className={!form.name ? "border-red-500" : ""}
              onChange={e => setForm({ ...form, name: e.target.value })}
            />

            {/* Category */}
            <Select
              value={form.category}
              onValueChange={v => setForm(prev => ({ ...prev, category: v }))}
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
                onChange={e =>
                  setForm({ ...form, priceMin: e.target.value })
                }
              />
              <Input
                type="number"
                placeholder="Maximum Price *"
                value={form.priceMax}
                className={!form.priceMax ? "border-red-500" : ""}
                onChange={e =>
                  setForm({ ...form, priceMax: e.target.value })
                }
              />
            </div>


            {/* Description */}
            <Textarea
              placeholder="Service description *"
              value={form.description}
              className={!form.description ? "border-red-500" : ""}
              onChange={e =>
                setForm({ ...form, description: e.target.value })
              }
            />

            {/* Pricing Model */}
            <Select
              value={form.pricingModel}
              onValueChange={v =>
                setForm(prev => ({ ...prev, pricingModel: v }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select pricing model" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Fixed">Fixed</SelectItem>
                <SelectItem value="Hourly">Hourly</SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* Submit */}
        <Button
          className="w-full"
          disabled={!isValid || mutation.isPending}
          onClick={() => {
            if (!isValid) {
              toast({
                title: "Missing required fields",
                description:
                  "Service name, category, description, minimum price and maximum price are required",
                variant: "destructive",
              });
              return;
            }
            mutation.mutate();
          }}
        >
          {mutation.isPending ? "Creating..." : "Create Service"}
        </Button>
      </main>
    </div>
  );
}

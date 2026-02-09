import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Header } from "@/components/Header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type TierKey = "free" | "standard" | "premium";

export default function CreateService() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [outcomeInput, setOutcomeInput] = useState<Record<TierKey, string>>({
    free: "",
    standard: "",
    premium: "",
  });

  const [form, setForm] = useState({
    name: "",
    category: "",
    description: "",
    pricingModel: "Fixed",
    tiers: {
      free: {
        turnaround: "",
        priceMin: "",
        priceMax: "",
        outcomes: [] as string[],
      },
      standard: {
        turnaround: "",
        priceMin: "",
        priceMax: "",
        outcomes: [] as string[],
      },
      premium: {
        turnaround: "",
        priceMin: "",
        priceMax: "",
        outcomes: [] as string[],
      },
    },
  });

  // Validation for required fields
  const isValid =
    form.name.trim() &&
    form.category.trim() &&
    form.description.trim();

  const updateTier = (tier: TierKey, key: string, value: any) => {
    setForm(prev => ({
      ...prev,
      tiers: {
        ...prev.tiers,
        [tier]: {
          ...prev.tiers[tier],
          [key]: value,
        },
      },
    }));
  };

  const addOutcome = (tier: TierKey) => {
    if (!outcomeInput[tier].trim()) return;

    updateTier(tier, "outcomes", [
      ...form.tiers[tier].outcomes,
      outcomeInput[tier].trim(),
    ]);

    setOutcomeInput(prev => ({ ...prev, [tier]: "" }));
  };

  const removeOutcome = (tier: TierKey, i: number) => {
    updateTier(
      tier,
      "outcomes",
      form.tiers[tier].outcomes.filter((_, idx) => idx !== i)
    );
  };

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
          tiers: Object.fromEntries(
            Object.entries(form.tiers).map(([k, v]) => [
              k,
              {
                ...v,
                priceMin: v.priceMin ? Number(v.priceMin) : null,
                priceMax: v.priceMax ? Number(v.priceMax) : null,
              },
            ])
          ),
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
    }

  });

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto max-w-4xl px-4 py-10 space-y-6">
        {/* Service Info */}
        <Card>
          <CardContent className="p-6 space-y-4">
            <h2 className="text-2xl font-bold">Create Service</h2>

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
              <SelectTrigger
                className={!form.category ? "border-red-500" : ""}
              >
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

            <Textarea
              placeholder="Service description *"
              value={form.description}
              className={!form.description ? "border-red-500" : ""}
              onChange={e => setForm({ ...form, description: e.target.value })}
            />

            {/* Pricing Model */}
            <Select
              value={form.pricingModel}
              onValueChange={v => setForm(prev => ({ ...prev, pricingModel: v }))}
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

        {/* Tier Cards */}
        <div className="grid md:grid-cols-3 gap-6">
          {(["free", "standard", "premium"] as TierKey[]).map(tier => (
            <Card key={tier}>
              <CardContent className="p-5 space-y-4">
                <h3 className="text-lg font-bold capitalize">{tier} Tier</h3>

                {/* Turnaround */}
                <Input
                  placeholder="Turnaround time"
                  value={form.tiers[tier].turnaround}
                  onChange={e => updateTier(tier, "turnaround", e.target.value)}
                />

                {/* Prices */}
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    type="number"
                    placeholder="Min price"
                    value={form.tiers[tier].priceMin}
                    onChange={e => updateTier(tier, "priceMin", e.target.value)}
                  />
                  <Input
                    type="number"
                    placeholder="Max price"
                    value={form.tiers[tier].priceMax}
                    onChange={e => updateTier(tier, "priceMax", e.target.value)}
                  />
                </div>

                {/* Outcomes */}
                <div>
                  <div className="flex gap-2 mb-2">
                    <Input
                      placeholder="Add outcome"
                      value={outcomeInput[tier]}
                      onChange={e =>
                        setOutcomeInput(prev => ({ ...prev, [tier]: e.target.value }))
                      }
                      onKeyDown={e => e.key === "Enter" && addOutcome(tier)}
                    />
                    <Button type="button" onClick={() => addOutcome(tier)}>
                      Add
                    </Button>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {form.tiers[tier].outcomes.map((o, i) => (
                      <Badge key={i} variant="secondary">
                        {o}
                        <X
                          className="w-3 h-3 ml-2 cursor-pointer"
                          onClick={() => removeOutcome(tier, i)}
                        />
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Submit */}
        <Button
          className="w-full"
          disabled={!isValid || mutation.isPending}
          onClick={() => {
            if (!isValid) {
              toast({
                title: "Missing required fields",
                description: "Service name, category, and description are required",
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

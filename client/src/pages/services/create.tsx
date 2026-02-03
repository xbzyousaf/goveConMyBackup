import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
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
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function CreateService() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const [outcomeInput, setOutcomeInput] = useState("");

  const [form, setForm] = useState({
    name: "",
    category: "",
    description: "",
    turnaround: "",
    pricingModel: "Fixed",
    priceMin: "",
    priceMax: "",
    outcomes: [] as string[],
    tier: "free",
  });

  const mutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/services", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          priceMin: form.priceMin ? Number(form.priceMin) : null,
          priceMax: form.priceMax ? Number(form.priceMax) : null,
        }),
      });

      if (!res.ok) throw new Error("Failed");

      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Service created successfully" });
      setLocation("/vendors");
    },
  });

  const update = (k: string, v: any) =>
    setForm(prev => ({ ...prev, [k]: v }));

  const addOutcome = () => {
    if (!outcomeInput.trim()) return;
    update("outcomes", [...form.outcomes, outcomeInput.trim()]);
    setOutcomeInput("");
  };

  const removeOutcome = (i: number) => {
    update(
      "outcomes",
      form.outcomes.filter((_, idx) => idx !== i)
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto max-w-3xl px-4 py-10">
        <Card>
          <CardContent className="p-6 space-y-5">
            <h2 className="text-2xl font-bold">Create Service</h2>

            {/* Name */}
            <Input
              placeholder="Service name"
              value={form.name}
              onChange={e => update("name", e.target.value)}
            />

            {/* Category */}
            <Select value={form.category} onValueChange={v => update("category", v)}>
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
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

            {/* Description */}
            <Textarea
              placeholder="Describe your service"
              value={form.description}
              onChange={e => update("description", e.target.value)}
            />

            {/* Turnaround */}
            <Input
              placeholder="Turnaround time (eg: 15–20 business days)"
              value={form.turnaround}
              onChange={e => update("turnaround", e.target.value)}
            />

            {/* Pricing */}
            <div className="grid grid-cols-3 gap-3">
              <Select
                value={form.pricingModel}
                onValueChange={v => update("pricingModel", v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Fixed">Fixed</SelectItem>
                  <SelectItem value="Hourly">Hourly</SelectItem>
                </SelectContent>
              </Select>

              <Input
                type="number"
                placeholder="Min price"
                value={form.priceMin}
                onChange={e => update("priceMin", e.target.value)}
              />

              <Input
                type="number"
                placeholder="Max price"
                value={form.priceMax}
                onChange={e => update("priceMax", e.target.value)}
              />
            </div>

            {/* Outcomes */}
            <div>
              <div className="flex gap-2 mb-2">
                <Input
                  placeholder="Add outcome"
                  value={outcomeInput}
                  onChange={e => setOutcomeInput(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && addOutcome()}
                />
                <Button type="button" onClick={addOutcome}>
                  Add
                </Button>
              </div>

              <div className="flex flex-wrap gap-2">
                {form.outcomes.map((o, i) => (
                  <Badge key={i} variant="secondary">
                    {o}
                    <X
                      className="w-3 h-3 ml-2 cursor-pointer"
                      onClick={() => removeOutcome(i)}
                    />
                  </Badge>
                ))}
              </div>
            </div>

            {/* Tier */}
            <Select value={form.tier} onValueChange={v => update("tier", v)}>
              <SelectTrigger>
                <SelectValue placeholder="Tier" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="free">Free</SelectItem>
                <SelectItem value="standard">Standard</SelectItem>
                <SelectItem value="premium">Premium</SelectItem>
              </SelectContent>
            </Select>

            <Button
              className="w-full"
              disabled={mutation.isPending}
              onClick={() => mutation.mutate()}
            >
              {mutation.isPending ? "Creating..." : "Create Service"}
            </Button>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

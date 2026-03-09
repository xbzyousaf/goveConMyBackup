import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useLocation, useRoute } from "wouter";
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
import { ArrowLeft } from "lucide-react";

export default function CreateMilestone() {

  const [match, params] = useRoute("/admin/milestones/create/:id");
  const isEdit = !!params?.id;
  const milestoneId = params?.id;

  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [form, setForm] = useState({
    stageId: "",
    title: "",
    description: "",
    required: "false"
  });

  /* ---------------- STAGES ---------------- */

  const { data: stages = [] } = useQuery({
    queryKey: ["/api/process-stages"],
    queryFn: async () => {
      const res = await fetch("/api/process-stages");
      if (!res.ok) throw new Error("Failed to fetch stages");
      return res.json();
    }
  });

  /* ---------------- MILESTONE (EDIT) ---------------- */

  const { data: milestone, isLoading } = useQuery({
    queryKey: ["milestone", milestoneId],
    queryFn: async () => {
      const res = await fetch(`/api/milestones/${milestoneId}`);
      if (!res.ok) throw new Error("Failed to fetch milestone");
      return res.json();
    },
    enabled: isEdit
  });

  useEffect(() => {
    if (milestone) {
      setForm({
        stageId: milestone.stageId || "",
        title: milestone.title || "",
        description: milestone.description || "",
        required: milestone.required ? "true" : "false"
      });
    }
  }, [milestone]);

  const isValid =
    form.stageId &&
    form.title.trim() &&
    form.description.trim();

  /* ---------------- SAVE ---------------- */

  const mutation = useMutation({

    mutationFn: async () => {

      const url = isEdit
        ? `/api/admin/milestones/${milestoneId}`
        : `/api/admin/milestones`;

      const method = isEdit ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          stageId: form.stageId,
          title: form.title,
          description: form.description,
          required: form.required === "true"
        })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Failed");
      }

      return res.json();
    },

    onSuccess: () => {

      queryClient.invalidateQueries({
        queryKey: ["/api/process-config"]
      });

      toast({
        title: isEdit
          ? "Milestone updated successfully"
          : "Milestone created successfully"
      });

      setLocation("/admin/process");
    }
  });

  if (isEdit && isLoading) {
    return <div className="p-10">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-background">

      <Header />

      <main className="max-w-4xl mx-auto px-4 py-10 space-y-6">

        <Link href="/admin/process">
          <Button variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        </Link>

        <Card>

          <CardContent className="p-6 space-y-4">

            <h1 className="text-xl font-semibold">
              {isEdit ? "Edit Milestone" : "Create Milestone"}
            </h1>

            {/* STAGE */}

            <Select
              value={form.stageId}
              onValueChange={(v) =>
                setForm({ ...form, stageId: v })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select Stage" />
              </SelectTrigger>

              <SelectContent>
                {stages.map((stage: any) => (
                  <SelectItem key={stage.id} value={stage.id}>
                    {stage.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* TITLE */}

            <Input
              placeholder="Milestone title"
              value={form.title}
              onChange={(e) =>
                setForm({ ...form, title: e.target.value })
              }
            />

            {/* DESCRIPTION */}

            <Textarea
              placeholder="Milestone description"
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
            />

            {/* REQUIRED */}

            <Select
              value={form.required}
              onValueChange={(v) =>
                setForm({ ...form, required: v })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Required?" />
              </SelectTrigger>

              <SelectContent>
                <SelectItem value="true">Required</SelectItem>
                <SelectItem value="false">Optional</SelectItem>
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
            : isEdit ? "Update Milestone" : "Create Milestone"}
        </Button>

      </main>

    </div>
  );
}
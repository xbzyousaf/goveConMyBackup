import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useLocation, useRoute } from "wouter";
import { Header } from "@/components/Header";
import { AdminLayout } from "./AdminLayouts";
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
    key: "",
    process: "",
    stage: "",
    title: "",
    description: "",
    required: "false",
     resources: "", // <-- add this
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
      key: milestone.key || "",
      process: milestone.process || "",
      stage: milestone.stage || "",
      title: milestone.title || "",
      description: milestone.description || "",
      required: milestone.required ? "true" : "false",
      resources: (milestone.resources || [])
        .map((r: any) => `${r.title}|${r.url}`)
        .join("\n"),
    });
  }
}, [milestone]);

  const isValid =
    form.key.trim() &&
    form.process &&
    form.stage &&
    form.title.trim();

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
          key: form.key,
          process: form.process,
          stage: form.stage,
          title: form.title,
          description: form.description,
          required: form.required === "true",
          resources: form.resources
    .split("\n")
    .filter(Boolean)
    .map((line) => {
      const [title, url] = line.split("|");
      return { title: title?.trim() || "", url: url?.trim() || "", type: "external" };
    }),
        })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Failed");
      }

      return res.json();
    },

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/milestones"] });

      toast({
        title: isEdit
          ? "Milestone updated successfully"
          : "Milestone created successfully"
      });

      setLocation("/admin/guideness");
    }
  });

  if (isEdit && isLoading) {
    return <div className="p-10">Loading...</div>;
  }

  return (
    
    
    <div className="min-h-screen bg-background">
      <Header />
          <AdminLayout>

      <main className="max-w-4xl mx-auto px-4 py-10 space-y-6">
        <Link href="/admin/guideness">
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

            {/* KEY */}
            <Input
              placeholder="Unique key (e.g., ein, sam_gov)"
              value={form.key}
              onChange={(e) =>
                setForm({ ...form, key: e.target.value })
              }
            />

            {/* PROCESS */}
            <Select
              value={form.process}
              onValueChange={(v) =>
                setForm({ ...form, process: v })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select Process" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="business_structure">
                  Business Structure
                </SelectItem>
                <SelectItem value="business_strategy">
                  Business Strategy
                </SelectItem>
                <SelectItem value="execution">
                  Execution
                </SelectItem>
              </SelectContent>
            </Select>

            {/* STAGE */}
            <Select
              value={form.stage}
              onValueChange={(v) =>
                setForm({ ...form, stage: v })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select Stage" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="startup">Startup</SelectItem>
                <SelectItem value="growth">Growth</SelectItem>
                <SelectItem value="scale">Scale</SelectItem>
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
            {/* RESOURCES */}
<Textarea
  placeholder="Resources (one per line, format: title|url)"
  value={form.resources}
  onChange={(e) => setForm({ ...form, resources: e.target.value })}
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
      </AdminLayout>
    </div>
  );
}
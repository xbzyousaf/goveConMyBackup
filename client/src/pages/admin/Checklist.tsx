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
const generateKey = (title: string, categoryId: string) => {
  return `${title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "")}_${categoryId}`;
};

export default function CreateMilestone() {
  const [match, params] = useRoute("/admin/edit-milestones/:id");
  const isEdit = !!params?.id;
  const milestoneId = params?.id;

  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [form, setForm] = useState({
    process: "",
    stage: "",
    title: "",
    description: "",
    required: "false",
    //  resources: "",
     categoryId: "",
  });

  /* ---------------- MILESTONE (EDIT) ---------------- */
  const { data: milestone, isLoading } = useQuery({
    queryKey: ["milestone", milestoneId],
    queryFn: async () => {
      const res = await fetch(`/api/admin/milestones/${milestoneId}`);
      if (!res.ok) throw new Error("Failed to fetch milestone");
      return res.json();
    },
    enabled: isEdit
  });
  console.log(milestoneId, 'milestoneId')

  useEffect(() => {
  if (milestone) {
    setForm({
      key: milestone.key || "",
      process: milestone.process || "",
      stage: milestone.stage || "",
      title: milestone.title || "",
      description: milestone.description || "",
      required: milestone.required ? "true" : "false",
      categoryId:milestone.categoryId,
      // resources: (milestone.resources || [])
      //   .map((r: any) => `${r.title}|${r.url}`)
      //   .join("\n"),
    });
  }
}, [milestone]);

  const isValid =
    form.process &&
    form.stage &&
    form.title.trim() &&
    form.categoryId;

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
          key: generateKey(form.title, form.categoryId),
          process: form.process,
          stage: form.stage,
          title: form.title,
          description: form.description,
          required: form.required === "true",
          categoryId: form.categoryId,
    //       resources: form.resources
    // .split("\n")
    // .filter(Boolean)
    // .map((line) => {
    //   const [title, url] = line.split("|");
    //   return { title: title?.trim() || "", url: url?.trim() || "", type: "external" };
    // }),
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
          ? "Updated successfully"
          : "Created successfully",
        description: isEdit
          ? "Milestone updated successfully"
          : "Milestone created successfully"
      });

      setLocation("/admin/checklist");
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    },
  });

  const { data: categories = [] } = useQuery({
    queryKey: ["/api/admin/categories"],
    queryFn: async () => {
      const res = await fetch("/api/admin/categories");
      return res.json();
    },
  });
  
  if (isEdit && isLoading) {
    return <div className="p-10">Loading...</div>;
  }
  

  return (
    <div className="min-h-screen bg-background">
      <Header />
          <AdminLayout>

      <main className="max-w-5xl mx-auto space-y-4">

        <Card>
          <CardContent className="p-6 space-y-4">
            <h1 className="text-xl font-semibold">
              {isEdit ? "Edit Checklist" : "Create Checklist"}
            </h1>

            {/* KEY
            <div className="">
              <label className="text-sm font-medium">
                Milestone Title
              </label>
            <Input
              placeholder="Unique key (e.g., ein, sam_gov)"
              value={form.key}
              onChange={(e) =>
                setForm({ ...form, key: e.target.value })
              }
            />
            </div> */}
            <div className="grid grid-cols-2 gap-4">
            {/* PROCESS */}
            <div className="">
              <label className="text-sm font-medium">
                Process
              </label>
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
                  Structure
                </SelectItem>
                <SelectItem value="business_strategy">
                  Strategy
                </SelectItem>
                <SelectItem value="execution">
                  Scale
                </SelectItem>
              </SelectContent>
            </Select>
            </div>

            {/* STAGE */}
            <div className="">
              <label className="text-sm font-medium">
                Stage
              </label>
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
            </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="">
              <label className="text-sm font-medium">
                Category
              </label>
            <Select
              value={form.categoryId}
              onValueChange={(v) => setForm({ ...form, categoryId: v })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select Category" />
              </SelectTrigger>

              <SelectContent>
                {categories.map((cat: any) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            </div>
            {/* REQUIRED */}
            <div className="">
              <label className="text-sm font-medium">
                Required/Optional
              </label>
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
            </div>
            
            </div>
            {/* TITLE */}
            <div className="">
              <label className="text-sm font-medium">
                Milestone Title
              </label>
            <Input
              placeholder="Milestone title"
              value={form.title}
              onChange={(e) =>
                setForm({ ...form, title: e.target.value })
              }
            />
            </div>

            {/* DESCRIPTION */}
            <div className="">
              <label className="text-sm font-medium">
                Description
              </label>
            <Textarea
              placeholder="Milestone description"
              className="min-h-[20px]"
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
            />
            </div>

            {/* RESOURCES */}
            {/* <div className="">
              <label className="text-sm font-medium">
                Resources
              </label>
            <Textarea
              placeholder="Resources (one per line, format: title|url)"
              className="min-h-[20px]"
              value={form.resources}
              onChange={(e) => setForm({ ...form, resources: e.target.value })}
            />
            </div> */}

          </CardContent>
        </Card>
        <div className="flex justify-between items-center">
        <Link href="/admin/checklist">
          <Button size="sm" variant="outline" className="bg-white">
            Cancle
          </Button>
        </Link>
        
        <Button
          size="sm"
          disabled={!isValid || mutation.isPending}
          onClick={() => mutation.mutate()}
        >
          {mutation.isPending
            ? isEdit ? "Updating..." : "Creating..."
            : isEdit ? "Update Checklist" : "Create Checklist"}
        </Button>
        </div>
      </main>
      </AdminLayout>
    </div>
  );
}
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";

import Header from "@/components/examples/Header";
import { AdminLayout } from "./AdminLayouts";
import { ArrowLeft } from "lucide-react";

type FormData = {
  name: string;
  description: string;
  keyDeliverables: string;
};

export default function CategoryForm() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // detect edit mode

const [location] = useLocation();

const isEdit = location.startsWith("/admin/edit-categories/");
const categoryId = isEdit ? location.split("/").pop() : null;
console.log(categoryId, isEdit);
  // form
  const form = useForm<FormData>({
    defaultValues: {
      name: "",
      description: "",
      keyDeliverables: "",
    },
  });

  // 👉 fetch single category (only in edit mode)
  const { data, isLoading } = useQuery({
    queryKey: ["/api/admin/categories", categoryId],
    enabled: !!categoryId && isEdit,
    queryFn: async () => {
        const res = await fetch(`/api/admin/categories/${categoryId}`);
        return res.json();
    },
    });

  // 👉 set form values in edit mode
  useEffect(() => {
    if (data) {
      form.reset({
        name: data.name,
        description: data.description,
        keyDeliverables: data.keyDeliverables ? data.keyDeliverables.join(", ") : "",
      });
    }
  }, [data]);

  // CREATE
  const createMutation = useMutation({
  mutationFn: async (values: FormData) => {
    return apiRequest("POST", "/api/admin/categories", values);
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ["/api/admin/categories"] });

    toast({
      title: "Success",
      description: "Category created successfully",
    });

    setLocation("/admin/categories");
  },
  onError: (error: any) => {
    toast({
      title: "Error",
      description: error.message || "Failed to create category",
      variant: "destructive",
    });
  },
});

  // UPDATE
  const updateMutation = useMutation({
  mutationFn: async (values: FormData) => {
    return apiRequest(
      "PUT",
      `/api/admin/categories/${categoryId}`,
      values
    );
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ["/api/admin/categories"] });

    toast({
      title: "Success",
      description: "Category updated successfully",
    });

    setLocation("/admin/categories");
  },
  onError: (error: any) => {
    toast({
      title: "Error",
      description: error.message || "Failed to update category",
      variant: "destructive",
    });
  },
});

  // submit handler
  const onSubmit = (values: FormData) => {
    const payload = {
      ...values,
      keyDeliverables: values.keyDeliverables
        .split(",")
        .map(item => item.trim())
        .filter(Boolean),
    };
      console.log(payload);

    if (isEdit && categoryId) {
      updateMutation.mutate(payload);
    } else {
      createMutation.mutate(payload);
    }
  };

  return (
    <div>
      <Header />
      <AdminLayout>
        <div className="p-6">

          {/* BACK BUTTON */}
          <Link href="/admin/categories">
            <Button variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </Link>

          {/* CARD */}
          <Card className="mt-6">
            <CardContent className="p-6 space-y-6">

              <h1 className="text-xl font-bold">
                {isEdit ? "Edit Category" : "Create Category"}
              </h1>

              {/* LOADING (EDIT MODE) */}
              {isLoading && <div>Loading...</div>}

              {/* FORM */}
              {!isLoading && (
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

                {/* ROW 1: NAME + KEY */}
                <div className="grid grid-cols-1 gap-6">
                  <div className="flex flex-col">
                    <label className="text-sm font-medium mb-1">
                      Category Name
                    </label>
                    <Input
                      placeholder="Enter category name"
                      {...form.register("name", { required: true })}
                    />
                  </div>

                </div>

                {/* ROW 2: DESCRIPTION */}
                <div className="flex flex-col">
                  <label className="text-sm font-medium mb-1">
                    Description
                  </label>
                  <textarea className="border rounded-md p-2 min-h-[100px] resize-none"
                    placeholder="Enter description"
                    {...form.register("description")}
                  />
                </div>

                {/* ROW 3: KEY DELIVERABLES */}
                <div className="flex flex-col">
                  <label className="text-sm font-medium mb-1">
                    Key Deliverables
                  </label>
                  <Input
                    placeholder="Comma separated (e.g. Design, Strategy, Audit)"
                    {...form.register("keyDeliverables")}
                  />
                </div>

                {/* ROW 4: BUTTON RIGHT */}
                <div className="flex justify-end">
                  <Button
                    type="submit"
                    disabled={
                      createMutation.isPending ||
                      updateMutation.isPending
                    }
                  >
                    {categoryId
                      ? updateMutation.isPending
                        ? "Updating..."
                        : "Update"
                      : createMutation.isPending
                      ? "Creating..."
                      : "Create"}
                  </Button>
                </div>

              </form>
              )}

            </CardContent>
          </Card>
        </div>
      </AdminLayout>
    </div>
  );
}
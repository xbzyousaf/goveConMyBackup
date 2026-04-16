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
  key: string;
  description: string;
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
      key: "",
      description: "",
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
        key: data.key,
        description: data.description,
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
   if (isEdit && categoryId) {
      updateMutation.mutate(values);
    } else {
      createMutation.mutate(values);
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
                <form onSubmit={form.handleSubmit(onSubmit)}>

                  <div className="flex gap-3 items-center">

                    {/* NAME */}
                    <Input
                      placeholder="Category Name"
                      className="w-1/4"
                      {...form.register("name", { required: true })}
                    />
                    
                    <Input
                      placeholder="Category Key"
                      className="w-1/4"
                      {...form.register("key", { required: true })}
                    />

                    {/* DESCRIPTION */}
                    <Input
                      placeholder="Description"
                      className="w-3/4"
                      {...form.register("description")}
                    />

                    {/* SUBMIT */}
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
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
} from "@/components/ui/card";

import Header from "@/components/examples/Header";
import { AdminLayout } from "./AdminLayouts";
import { ArrowLeft } from "lucide-react";

type FormData = {
  type: "percentage" | "fixed";
  value: number;
  isActive: boolean;
};

export default function PlatformFeeForm() {
  const [, setLocation] = useLocation();

  const queryClient = useQueryClient();

  const { toast } = useToast();

  const [location] = useLocation();

  const feeId = location.split("/").pop() ?? null;

  const form = useForm<FormData>({
    defaultValues: {
      type: "percentage",
      value: 0,
      isActive: true,
    },
  });

  // FETCH SINGLE
  const { data, isLoading } = useQuery({
    queryKey: [
      "/api/admin/platform-fees",
      feeId,
    ],

    enabled: !!feeId,

    queryFn: async () => {
      const res = await fetch(
        `/api/admin/platform-fees/${feeId}`
      );

      return res.json();
    },
  });

  // SET FORM VALUES
  useEffect(() => {
    if (data) {
      form.reset({
        type: data.type,
        value: data.value,
        isActive: data.isActive,
      });
    }
  }, [data]);

  // UPDATE
  const updateMutation = useMutation({
    mutationFn: async (values: FormData) => {
      return apiRequest(
        "PUT",
        `/api/admin/platform-fees/${feeId}`,
        values
      );
    },

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/admin/platform-fees"],
      });

      toast({
        title: "Success",
        description:
          "Platform fee updated successfully",
      });

      setLocation("/admin/platform-fees");
    },

    onError: (error: any) => {
      toast({
        title: "Error",
        description:
          error.message ||
          "Failed to update platform fee",
        variant: "destructive",
      });
    },
  });
const onSubmit = (values: FormData) => {
  updateMutation.mutate({
    ...values,
    value: Number(values.value),
  });
};

  return (
    <div>
      <Header />

      <AdminLayout>
        <div className="p-6">
          {/* BACK BUTTON */}
          <Link href="/admin/platform-fees">
            <Button variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </Link>

          {/* CARD */}
          <Card className="mt-6">
            <CardContent className="p-6 space-y-6">
              <h1 className="text-xl font-bold">
                Edit Platform Fee
              </h1>

              {/* LOADING */}
              {isLoading && <div>Loading...</div>}

              {/* FORM */}
              {!isLoading && (
                <form
                  onSubmit={form.handleSubmit(
                    onSubmit
                  )}
                  className="space-y-6"
                >
                  {/* TYPE + VALUE */}
                  <div className="grid grid-cols-2 gap-6">
                    {/* TYPE */}
                    <div className="flex flex-col">
                      <label className="text-sm font-medium mb-1">
                        Fee Type
                      </label>

                      <select
                        className="border rounded-md p-2 h-10"
                        {...form.register("type")}
                      >
                        <option value="percentage">
                          Percentage
                        </option>

                        <option value="fixed">
                          Fixed
                        </option>
                      </select>
                    </div>

                    {/* VALUE */}
                    <div className="flex flex-col">
                      <label className="text-sm font-medium mb-1">
                        Value
                      </label>

                      <Input
                        type="number"
                        placeholder="Enter value"
                        {...form.register("value", {
                          required: true,
                        })}
                      />
                    </div>
                  </div>

                  {/* STATUS */}
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="isActive"
                      {...form.register("isActive")}
                    />

                    <label
                      htmlFor="isActive"
                      className="text-sm"
                    >
                      Active
                    </label>
                  </div>

                  {/* BUTTON */}
                  <div className="flex justify-end">
                    <Button
                      type="submit"
                      disabled={updateMutation.isPending}
                    >
                      {updateMutation.isPending
                        ? "Updating..."
                        : "Update"}
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
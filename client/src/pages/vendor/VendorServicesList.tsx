import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

interface Props {
  vendorId: string;
  categoryId?: string;
}

export function VendorServicesList({
  vendorId,
  categoryId,
}: Props) {
  const { data: services = [], isLoading } = useQuery({
    queryKey: [
      "vendor-services",
      vendorId,
      categoryId || "all",
    ],

    queryFn: async () => {
      const url =
        categoryId && categoryId !== "all"
          ? `/api/vendors/${vendorId}/categories/${categoryId}/services`
          : `/api/vendors/${vendorId}/services`;

      console.log("Fetching services URL:", url);

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(
          "Failed to fetch vendor services"
        );
      }

      return response.json();
    },

    enabled: !!vendorId,
  });

  if (isLoading) {
    return (
      <div className="mt-4 text-sm">
        Loading services...
      </div>
    );
  }

  if (!services.length) {
    return (
      <div className="mt-4 text-sm text-muted-foreground">
        No services found.
      </div>
    );
  }

  return (
    <div className="mt-4 space-y-4">
      {services.map((service: any) => (
        <Card
          key={service.id}
          className="p-5"
        >
          <div className="flex items-end justify-between gap-6">

            {/* LEFT */}
            <div className="flex-1 min-w-0">

              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-base">
                  {service.name || "Unnamed Service"}
                </h3>
              </div>

              <p className="text-sm text-muted-foreground mt-3 leading-relaxed">
                {service.description ||
                  "No description available."}
              </p>

            </div>

            {/* RIGHT */}
            <div className="text-right shrink-0 min-w-[140px]">
 
                <Link href={`/request?vendorId=${service.vendorId}&serviceId=${service.id}`}>
                    <Button  className="w-full mt-4" >
                    Request Consultation
                    </Button>
                </Link>

            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
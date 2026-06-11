import { useQuery } from "@tanstack/react-query";
import { useRoute, Link } from "wouter";
import { Header } from "@/components/Header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { truncateText } from "@/utility/textUtils";

export default function ServiceVendors() {
  const [match, params] = useRoute("/services/:serviceId/vendors");
  const serviceId = params?.serviceId;
  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const res = await fetch("/api/admin/categories");
      return res.json();
    },
  });
  const categoryLookup = Object.fromEntries(
    categories.map((c: any) => [c.id, c.name])
  );

  const { data: vendors = [], isLoading } = useQuery({
    queryKey: ["service-vendors", serviceId],
    queryFn: async () => {
      const res = await fetch(`/api/services/${serviceId}/vendors`);
      if (!res.ok) throw new Error("Failed to fetch vendors");
      return res.json();
    },
    enabled: !!serviceId,
  });

  if (isLoading) {
    return <div className="p-10">Loading vendors...</div>;
  }
  return (
  <div className="min-h-screen bg-background">
    <Header />

    <main className="max-w-6xl mx-auto px-4 py-4 space-y-6">

      {/* Back Button */}
      <Button
          variant="outline"
          size="sm"
          onClick={() => window.history.back()}
        >
        <ArrowLeft size="sm" className="w-4 h-4" />
        Back
      </Button>

      <h1 className="text-2xl font-semibold">
        Vendors for this Service
      </h1>

      <div className="space-y-6">
        {vendors.map((vendor: any) => {
      const displayName =
            vendor.firstName || vendor.lastName
                ? `${vendor.firstName ?? ""} ${vendor.lastName ?? ""}`.trim()
                : vendor.username;

          const rating = Number(vendor.rating || 0);

          return (
            <Card key={vendor.vendorId} className="p-6 grid grid-cols-[0.8fr_1.2fr_1.5fr_1.2fr]">

              {/* ===================== COLUMN 1 ===================== */}
              <div className="flex flex-col items-center gap-3 min-w-0 p-2">
                   <Avatar className="h-24 w-24 rounded-full">
                    <AvatarImage
                        src={vendor.avatar || ""}
                        alt={vendor.companyName}
                        className="object-cover"
                    />
                    <AvatarFallback className="bg-primary text-white text-lg font-semibold">
                        {vendor.companyName?.[0]?.toUpperCase() || "V"}
                    </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium">{vendor?.companyName}</p>
                      <p className="text-xs text-muted-foreground">{vendor?.title}</p>
                    </div>
              </div>

              {/* ===================== COLUMN 2 ===================== */}
              <div className="flex flex-col gap-3 min-w-0 p-2">
                <div>
                      <p className="text-lg font-semibold">{displayName}</p>
                </div>

                {/* Categories */}
                <div className="flex flex-wrap gap-2 mt-2">
                  {vendor.categories?.map((categoryId: string) => (
                    <span
                      key={categoryId}
                      className="px-2 py-1 text-xs rounded bg-gray-200"
                    >
                      {categoryLookup[categoryId] || categoryId}
                    </span>
                  ))}
                </div>
              </div>

              {/* ===================== COLUMN 3 ===================== */}
              <div className="flex flex-col gap-3 min-w-0 p-2">
                <p className="font-semibold">
                  SHORT BIO: 
                </p>
                <p className="text-sm">
                  {truncateText(vendor.description, 190)}
                </p>                

              </div>

              {/* ===================== COLUMN 4 ===================== */}
              <div className="flex flex-col gap-3 min-w-0 p-2 justify-center text-center">
                <Link href={`/vendor/${vendor.vendorId}`}>
                    <Button variant="outline" className="w-full h-12">
                    View Vendor Profile
                    </Button>
                </Link>
                <Link href={`/request?vendorId=${vendor.vendorId}&serviceId=${vendor.serviceId}`}>
                    <Button  className="w-full h-12">
                    Request Consultation
                    </Button>
                </Link>

              </div>

            </Card>
          );
        })}
      </div>
    </main>
  </div>
);


}
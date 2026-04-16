import { useQuery } from "@tanstack/react-query";
import { useRoute, Link } from "wouter";
import { Header } from "@/components/Header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Mail, MapPin, Phone, Star } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { truncateText } from "@/utility/textUtils";

export default function ServiceVendors() {
  const [match, params] = useRoute("/services/:serviceId/vendors");
  const serviceId = params?.serviceId;

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

    <main className="max-w-6xl mx-auto px-4 py-10 space-y-6">

      {/* Back Button */}
      <Link href="/marketplace">
        <Button variant="outline">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
      </Link>

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
                <span className="bg-green-100 text-green-700 px-2 py-1 text-xs rounded font-semibold">
                  {vendor.subscriptionTier?.toUpperCase()}
                </span>
              </div>

              {/* ===================== COLUMN 2 ===================== */}
              <div className="flex flex-col gap-3 min-w-0 p-2">
                <div>
                      <p className="text-lg font-semibold">{displayName}</p>
                      <p className="text-xs text-muted-foreground">@: {vendor?.username || "NA"}</p>
                </div>

                <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    <span>{vendor.location || "N/A"}</span>
                </div>

                <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    <span className="truncate">{vendor.email}</span>
                </div>

                <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4" />
                    <span>(coming soon)</span>
                </div>

                {/* Categories */}
                <div className="flex flex-wrap gap-2 mt-2">
                  {vendor.categories?.map((cat: string, i: number) => (
                    <span
                      key={i}
                      className={`px-2 py-1 text-xs rounded ${
                        cat === vendor.serviceName?.toLowerCase()
                          ? "bg-black text-white font-semibold"
                          : "bg-gray-200"
                      }`}
                    >
                      {cat}
                    </span>
                  ))}
                </div>
              </div>

              {/* ===================== COLUMN 3 ===================== */}
              <div className="flex flex-col gap-3 min-w-0 p-2">
                <p className="font-semibold">
                  SHORT BIO: 
                </p>
                <p>
                  {truncateText(vendor.description, 190)}
                </p>

                <p>
                    <span className="font-semibold">MATURITY STAGE: </span>
                  {vendor.maturityStage || "N/A"}
                </p>

                {/* Rating */}
                <div>
                    <p className="font-semibold mb-1">
                      CUSTOMER RATING:
                    </p>
                    <div className="flex items-center gap-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                        key={i}
                        className={`w-4 h-4 ${
                            i < Math.round(rating)
                            ? "fill-yellow-400 text-yellow-400"
                            : "text-gray-300"
                        }`}
                        />
                    ))}
                    <span className="ml-2 text-sm text-muted-foreground">
                        {vendor.rating || 0}/5.00
                    </span>

                    <span className="ml-2 text-sm text-muted-foreground">
                        ({vendor.reviewCount || 0} reviews)
                    </span>
                </div>
                </div>
                

              </div>

              {/* ===================== COLUMN 4 ===================== */}
              <div className="flex flex-col gap-3 min-w-0 p-2">

                <div>
                  <p className="font-semibold">HOURLY RATE:</p>
                  <p>${vendor.hourlyRate || "0"}</p>
                </div>

                <div>
                  <p className="font-semibold">PRICE MODEL:</p>
                  <p>{vendor.pricingModel}</p>
                </div>

                <div>
                  <p className="font-semibold">PRICE RANGE:</p>
                  <p>
                    ${vendor.priceMin} - ${vendor.priceMax}
                  </p>
                </div>
                <Link href={`/vendor/${vendor.vendorId}`}>
                    <Button className="w-full">
                    View Vendor Profile
                    </Button>
                </Link>
                <Link href={`/request?vendorId=${vendor.vendorId}&serviceId=${vendor.serviceId}`}>
                    <Button variant="outline" className="w-full">
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
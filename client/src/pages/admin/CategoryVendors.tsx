import { useQuery } from "@tanstack/react-query";
import { useRoute, Link } from "wouter";
import { Header } from "@/components/Header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Mail, MapPin, Phone, Star, MessageCircle } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { truncateText } from "@/utility/textUtils";
import { useMessages } from "../../../../client/src/components/ui/MessageContext";

export default function CategoryVendors() {
  const [match, params] = useRoute("/categories/:categoryId/vendors");
  const categoryId = params?.categoryId;
  const { openConversation } = useMessages();
  const { data: vendors = [], isLoading } = useQuery({
    queryKey: ["category-vendors", categoryId],
    queryFn: async () => {
      const res = await fetch(`/api/categories/${categoryId}/vendors`);
      if (!res.ok) throw new Error("Failed to fetch vendors");
      return res.json();
    },
    enabled: !!categoryId,
  });

  if (isLoading) {
    return <div className="p-10">Loading vendors...</div>;
  }
  return (
  <div className="min-h-screen bg-background">
    <Header />

    <main className="max-w-6xl mx-auto px-4 py-10 space-y-6">

      {/* Back Button */}
      <Button
          variant="outline"
          onClick={() => window.history.back()}
        >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back
      </Button>
      <h1 className="text-2xl font-semibold">
        {vendors.length > 0
          ? `Vendors for ${
              vendors[0].categories?.find(
                (cat: any) => cat.id === categoryId
              )?.name || "Category"
            }`
          : "No vendors available for this category"}
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
              <div className="flex flex-col items-center justify-center text-center gap-3 min-w-0 p-2">
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
                      <p className="text-sm font-medium text-center">{vendor?.companyName ? truncateText(vendor.companyName, 18) : "N/A"}</p>
                      <p className="text-xs text-muted-foreground">{vendor?.title ? truncateText(vendor.title, 24) : "N/A"}</p>
                    </div>
                {/* <span className="bg-gold text-white px-2 py-1 text-xs rounded font-semibold">
                  {vendor.subscriptionTier?.toUpperCase()}
                </span> */}
              </div>

              {/* ===================== COLUMN 2 ===================== */}
              <div className="flex flex-col gap-3 min-w-0 p-2">
                <div>
                      <p className="text-lg font-semibold">{displayName}</p>
                      {/* <p className="text-xs text-muted-foreground">@: {vendor?.username || "NA"}</p> */}
                      <Button variant="outline" className=" h-12 mt-2"
                      onClick={() => openConversation(vendor.vendorId)}
                      >
                      Start Discussion
                        <MessageCircle className="w-4 h-4" />
                    </Button>
                </div>

                {/* <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    <span>{vendor.location || "N/A"}</span>
                </div> */}

                {/* <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    <span className="truncate">{vendor.email}</span>
                </div> */}

                {/* <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4" />
                    <span>{vendor.phone ?? 'N/A'}</span>
                </div> */}

                {/* Categories */}
                <div className="flex flex-wrap gap-2 mt-2 pr-4">
                  {vendor.categories?.map((cat: any, i: number) => (
                    <span
                      key={i}
                      className={`px-2 py-1 text-xs rounded bg-gray-200`}
                    >
                      {cat.key}
                    </span>
                  ))}
                </div>
              </div>

              {/* ===================== COLUMN 3 ===================== */}
              <div className="flex flex-col gap-3 min-w-0 p-2 pr-4">
                <p className="font-semibold">
                  SHORT BIO: 
                </p>
                <p>
                  {vendor.description ? truncateText(vendor.description, 240) : "No description available."}
                </p>

                {/* <p>
                    <span className="font-semibold">MATURITY STAGE: </span>
                  {vendor.maturityStage || "N/A"}
                </p> */}

                {/* Rating */}
                {/* <div>
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
                </div> */}
                

              </div>

              {/* ===================== COLUMN 4 ===================== */}
              <div className="flex flex-col gap-3 min-w-0 p-2 justify-center text-center">

                {/* <div>
                  <p className="font-semibold">HOURLY RATE:</p>
                  <p>${vendor.hourlyRate || "0"}</p>
                </div> */}

                {/* <div>
                  <p className="font-semibold">PRICE MODEL:</p>
                  <p>{vendor.pricingModel}</p>
                </div> */}

                {/* <div>
                  <p className="font-semibold">PRICE RANGE:</p>
                  <p>
                    ${vendor.priceMin} - ${vendor.priceMax}
                  </p>
                </div> */}
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
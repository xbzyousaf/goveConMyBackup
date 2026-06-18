import { useQuery } from "@tanstack/react-query";
import { useRoute, Link } from "wouter";
import { Header } from "@/components/Header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Badge, CaptionsIcon, ChevronDown, ChevronUp, MessageCircle } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { truncateText } from "@/utility/textUtils";
import { useMessages } from "../../../../client/src/components/ui/MessageContext";
import { useState } from "react";
import { VendorServicesList } from "../vendor/VendorServicesList";

export default function CategoryVendors() {
  const [match, params] = useRoute("/categories/:categoryId/vendors");
  const categoryId = params?.categoryId;
  const { openConversation } = useMessages();
  const searchParams = new URLSearchParams(window.location.search);

  const searchQuery =
    searchParams.get("q") || "";
  const { data: vendors = [], isLoading } = useQuery({
    queryKey: [
      "category-vendors",
      categoryId,
      searchQuery,
    ],
    queryFn: async () => {
  const url =
    categoryId === "all"
      ? `/api/vendors?search=${encodeURIComponent(searchQuery)}`
      : `/api/categories/${categoryId}/vendors?search=${encodeURIComponent(searchQuery)}`;

  const res = await fetch(url);

  if (!res.ok) {
    throw new Error("Failed to fetch vendors");
  }

  return res.json();
},
    enabled: !!categoryId,
  });
  const [expandedVendor, setExpandedVendor] = useState<string | null>(null);
  

  if (isLoading) {
    return <div className="p-10">Loading vendors...</div>;
  }

  return (
  <div className="min-h-screen bg-background">
    <Header />

    <main className="max-w-6xl mx-auto px-4 py-4 space-y-4">

      {/* Back Button */}
      <Button size="sm" variant="outline" onClick={() => window.history.back()} >
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
          const vendorUserId =
            vendor.vendorId || vendor.userId || vendor.id;
      const displayName =
            vendor.firstName || vendor.lastName
                ? `${vendor.firstName ?? ""} ${vendor.lastName ?? ""}`.trim()
                : vendor.username;

          const rating = Number(vendor.rating || 0);

          return (
            <Card key={vendorUserId} className="p-4 ">

              {/* ===================== COLUMN 1 ===================== */}
            <div className="grid grid-cols-[0.8fr_1.2fr_1.5fr_1.2fr] gap-4">
              <div className="flex flex-col items-center justify-start text-center gap-3 min-w-0 p-2">
                   <Avatar className="h-24 w-24 rounded-full mt-4">
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
                      {/* <p className="text-xs text-muted-foreground">{vendor?.title ? truncateText(vendor.title, 24) : "N/A"}</p> */}
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
                      <Button variant="outline" className="mt-2"
                      onClick={() => openConversation(vendorUserId)}
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
                <p className="font-semibold">
                  Skills: 
                </p>
                <div className="flex flex-wrap gap-2">
                  {vendor.skills.slice(0, 5).map((skill, index) => (
                    <span key={index} variant="outline" className="px-2 py-1 text-xs rounded bg-gray-200">
                      {skill}
                    </span>
                  ))}
                  {vendor.skills.length > 5 && (
                    <span variant="outline" className="text-xs">
                      +{vendor.skills.length - 3} more
                    </span>
                  )}
                </div>
              </div>

              {/* ===================== COLUMN 3 ===================== */}
              <div className="flex flex-col gap-2 min-w-0 p-2 pr-4">
                <p className="font-semibold">
                  Company Description: 
                </p>
                <p className="text-sm text-muted-foreground">
                  {vendor.description ? truncateText(vendor.description, 280) : "No description available."}
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
              <div className="flex flex-col gap-3 min-w-0 p-2 h-full">

                <div className="flex items-start text-sm gap-2 justify-between">
                  <span className="whitespace-nowrap font-medium leading-none mt-0.5">Market Served:</span>
                  <p className="text-muted-foreground text-sm">
                    {vendor.businessType === "both"
                      ? "Gov & Commercial"
                      : vendor.businessType
                          ? vendor.businessType.charAt(0).toUpperCase() +
                            vendor.businessType.slice(1)
                          : "N/A"}
                  </p>
                </div>
                <div className="flex items-start text-sm gap-2 justify-between">
                  <span className="block leading-none mt-0.5 font-medium">Years of Experience:</span>
                  <p className="text-muted-foreground text-sm">
                    {vendor.yearsOfExperience
                        ? `${vendor.yearsOfExperience} years`
                        : "N/A"}
                  </p>
                </div>
                {/* <div className="flex items-start text-sm gap-2">
                  <span className="whitespace-nowrap leading-none mt-0.5">Agencies Served:</span>
                  <p className="font-medium text-foreground">{vendor.agenciesServed || "N/A"}</p>
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
                <div className="space-y-3 mt-auto pt-4">
                  <Link href={`/vendor/${vendorUserId}`}>
                    <Button
                      variant="outline"
                      className="w-full"
                    >
                      View Vendor Profile
                    </Button>
                  </Link>

                  <Button
                    variant="outline"
                    className="w-full flex bg-primary text-primary-foreground items-center gap-2"
                    onClick={() =>
                      setExpandedVendor(
                        expandedVendor === vendorUserId
                          ? null
                          : vendorUserId
                      )
                    }
                  >
                    {expandedVendor === vendorUserId ? (
                      <>
                        <ChevronUp className="w-4 h-4" />
                        <span>Hide Services</span>
                      </>
                    ) : (
                      <>
                        <ChevronDown className="w-4 h-4" />
                        <span>Show Services</span>
                      </>
                    )}
                  </Button>

                  
                </div>

              </div>
            </div>
              {expandedVendor === vendorUserId && (
                    <div className="mt-4 border-t pt-4">
                      <div className="flex gap-2 ">
                        <CaptionsIcon className="w-6 h-6 text-primary shrink-0" />
                        <h3 className="font-bold w-full text-base">
                          Services
                        </h3>
                      </div>
                      

                      <VendorServicesList
                        vendorId={vendorUserId}
                        categoryId={categoryId}
                      />
                    </div>
                  )}
            </Card>
          );
        })}
      </div>
    </main>
  </div>
);


}
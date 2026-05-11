import { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation, Link } from "wouter";
import { Header } from "@/components/Header";
import { VendorCard } from "@/components/VendorCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Search, X } from "lucide-react";
import { GAP_CATEGORY_MAP } from "../../../constants/gapCategoryMap";
import type { GapType } from "@shared/types/gaps";
import type { ServiceCategory } from "@shared/types/service";

export default function Vendors() {
  const [location] = useLocation();
  const searchParams = new URLSearchParams(location.split("?")[1]);
  const categoryParam = searchParams.get("category");
  const categoryIdParam = searchParams.get("categoryId");
  // const categoryParam = searchParams.get("categoryId");
  const [hasUserInteracted, setHasUserInteracted] = useState(false);
  

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>(
    categoryParam || "all",
  );
  const [selectedLocation, setSelectedLocation] = useState<string>("all");
  const [verifiedOnly, setVerifiedOnly] = useState(false);

  useEffect(() => {
    if (categoryParam) {
      setSelectedCategory(categoryParam);
    }
  }, [categoryParam]);
  const { data: recommended = [] } = useQuery({
    queryKey: ["/api/recommended-services"],
    queryFn: async () => {
      const res = await fetch("/api/recommended-services");
      return res.json();
    },
  });

  const gapCategories: ServiceCategory[] = Array.from(
    new Set(
      recommended
        .map((item: any) => {
          const key = item.recommendedFor as GapType;
          return GAP_CATEGORY_MAP[key];
        })
        .filter(Boolean),
    ),
  );


  const { data: categoriesData = [], isLoading: categoriesLoading } = useQuery<any[]>({
    queryKey: ['/api/admin/categories'], // or /api/categories
    queryFn: async () => {
      const res = await fetch('/api/admin/categories');

      if (!res.ok) {
        throw new Error('Failed to fetch categories');
      }

      const json = await res.json();
      return Array.isArray(json) ? json : json.data || [];
    },
  });
  const mappedCategories = categoriesData.map((cat: any) => ({
    id: cat.id,
    label: cat.name,
  }));
  const keyToIdMap = useMemo(() => {
    return Object.fromEntries(
      categoriesData.map((cat: any) => [cat.key, cat.id])
    );
  }, [categoriesData]);

  const categoryId = useMemo(() => {
    return new URLSearchParams(window.location.search).get("categoryId");
  }, [location]);
  const finalCategories = useMemo(() => {
    // ✅ 1. If URL has categoryId → ALWAYS use it
    if (categoryId) {
      return [categoryId];
    }

    // ✅ 2. Otherwise fallback to your existing logic
    return hasUserInteracted
      ? selectedCategory === "all"
        ? []
        : [keyToIdMap[selectedCategory] || selectedCategory]
      : gapCategories.length > 0
      ? gapCategories.map((key) => keyToIdMap[key] || key)
      : [];
  }, [
    categoryId,
    hasUserInteracted,
    selectedCategory,
    gapCategories,
    keyToIdMap,
  ]);
    console.log("urlCategoryId1234:", categoryId);
  const idToKeyMap = useMemo(() => {
    return Object.fromEntries(
      categoriesData.map((cat: any) => [cat.id, cat.key])
    );
  }, [categoriesData]);
  useEffect(() => {
    if (categoryId) {
      setSelectedCategory(categoryId);
    }
  }, [categoryId]);
  const { data: vendors = [], isLoading } = useQuery({
    queryKey: [
      "vendors",
      finalCategories.join(","),
      selectedLocation,
      verifiedOnly,
      searchQuery,
    ],

    enabled: true, // ✅ important

    queryFn: async () => {
      const params = new URLSearchParams();

      if (searchQuery) {
        params.append("search", searchQuery);
      }

      if (finalCategories.length > 0) {
        params.append("categories", finalCategories.join(","));
      }

      if (selectedLocation !== "all") {
        params.append("location", selectedLocation);
      }

      if (verifiedOnly) {
        params.append("verified", "true");
      }
      const url = `/api/vendors?${params.toString()}`;
      const res = await fetch(url);
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Failed");
      }
      return res.json();
    },
  });
  

  const categories = [
    { id: "all", label: "All Categories" },
    ...mappedCategories,
  ];
  const safeVendors = Array.isArray(vendors) ? vendors : [];

  // const locations = [
  //   { id: "all", label: "All Locations" },
  //   ...Array.from(
  //     new Set(safeVendors.map((v) => v.location).filter(Boolean)),
  //   ).map((loc) => ({ id: loc!, label: loc! })),
  // ];

  const filteredVendors = safeVendors
    .filter((vendor) => {
      // Location filter
      if (selectedLocation !== "all" && vendor.location !== selectedLocation) {
        return false;
      }
      // Verified filter
      // if (verifiedOnly && !vendor.isApproved) {
      //   return false;
      // }
      // Search query
      // if (searchQuery) {
      //   const query = searchQuery.toLowerCase();
      //   const matchesTitle = vendor.title?.toLowerCase().includes(query);
      //   const matchesCompany = vendor.companyName
      //     ?.toLowerCase()
      //     .includes(query);
      //   const matchesSkills = vendor.skills?.some((skill) =>
      //     skill.toLowerCase().includes(query),
      //   );
      //   const matchesDescription = vendor.description
      //     ?.toLowerCase()
      //     .includes(query);

      //   return (
      //     matchesTitle || matchesCompany || matchesSkills || matchesDescription
      //   );
      // }

      return true;
    })
    .sort((a, b) => {
      // Featured vendors first
      if (a.isFeatured && !b.isFeatured) return -1;
      if (!a.isFeatured && b.isFeatured) return 1;
      // Then by rating
      return Number(b.rating) - Number(a.rating);
    });

  const clearFilters = () => {
    setSelectedCategory("all");
    setSelectedLocation("all");
    setVerifiedOnly(false);
    setSearchQuery("");
    setHasUserInteracted(true); 
  };

  const activeFiltersCount =
  (selectedCategory !== "all" ? 1 : 0) +
  (selectedLocation !== "all" ? 1 : 0) +
  (verifiedOnly ? 1 : 0) +
  (searchQuery.trim() !== "" ? 1 : 0) +   // ✅ FIX
  (selectedCategory === "all" && gapCategories.length > 0 ? 1 : 0);

    if (categoriesLoading) {
      return <div className="p-10">Loading categories...</div>;
    }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2" data-testid="text-page-title">
            Browse Vendors
          </h1>
          <p className="text-lg text-muted-foreground">
            Discover vetted service providers for your government contracting
            needs
          </p>
        </div>

        {/* Filters */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="space-y-4">
              {/* Search Bar */}
              <div className="relative">
  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />

  <Input
    placeholder="Search by name, skills, or expertise..."
    className="pl-10 pr-10"
    value={searchQuery}
    onChange={(e) => setSearchQuery(e.target.value)}
    data-testid="input-search-vendors"
  />

  {searchQuery && (
    <button
      onClick={() => setSearchQuery("")}
      className="absolute right-3 top-1/2 transform -translate-y-1/2"
      data-testid="button-clear-search"
    >
      <X className="w-4 h-4 text-muted-foreground hover:text-black" />
    </button>
  )}
</div>

              {/* Filter Row */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Select
                    value={selectedCategory}
                    onValueChange={(value) => {
                      if (categoryId) return; // 🚫 prevent change
                      setSelectedCategory(value);
                      setHasUserInteracted(true);
                    }}
                    disabled={!!categoryId} // 👈 THIS disables UI
                  >
                  <SelectTrigger data-testid="select-category">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* <Select
                  value={selectedLocation}
                  onValueChange={setSelectedLocation}
                >
                  <SelectTrigger data-testid="select-location">
                    <SelectValue placeholder="Location" />
                  </SelectTrigger>
                  <SelectContent>
                    {locations.map((loc) => (
                      <SelectItem key={loc.id} value={loc.id}>
                        {loc.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select> */}

                <div className="flex items-center gap-4">
                  {/* <Button
                    variant={verifiedOnly ? "default" : "outline"}
                    onClick={() => setVerifiedOnly(!verifiedOnly)}
                    className="flex-1"
                    data-testid="button-verified-only"
                  >
                    <Filter className="w-4 h-4 mr-2" />
                    Verified Only
                  </Button> */}

                  {activeFiltersCount > 0 && (
                    <Button
                      variant="ghost"
                      onClick={clearFilters}
                      data-testid="button-clear-filters"
                    >
                      <X className="w-4 h-4 mr-2" />
                      Clear
                    </Button>
                  )}
                </div>
              </div>

              {/* Active Filters */}
              {activeFiltersCount > 0 && (
                <div className="flex flex-wrap gap-2">
                  <span className="text-sm text-muted-foreground">
                    Active filters:
                  </span>
                  {/* Selected Category */}
                  {selectedCategory !== "all" && (
                    <Badge>
                      {categories.find((c) => c.id === selectedCategory)?.label}
                    </Badge>
                  )}

                  {/* Recommended Categories */}
                  {selectedCategory === "all" && gapCategories.length > 0 &&
                    gapCategories.map((cat: ServiceCategory) => (
                      <Badge key={cat}>
                        {categories.find((c) => c.id === cat)?.label || cat}
                      </Badge>
                    ))}
                  {selectedLocation !== "all" && (
                    <Badge
                      variant="secondary"
                      data-testid="badge-filter-location"
                    >
                      {selectedLocation}
                    </Badge>
                  )}
                  {verifiedOnly && (
                    <Badge
                      variant="secondary"
                      data-testid="badge-filter-verified"
                    >
                      Verified Only
                    </Badge>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <>
            <div className="mb-6 flex items-center justify-between">
              <p
                className="text-sm text-muted-foreground"
                data-testid="text-results-count"
              >
                Showing {filteredVendors.length}{" "}
                {filteredVendors.length === 1 ? "vendor" : "vendors"}
              </p>
            </div>

            {filteredVendors.length > 0 ? (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {filteredVendors.map((vendor) => (
                  <Link key={vendor.userId} href={`/vendor/${vendor.userId}`}>
                    <div className="cursor-pointer">
                      <VendorCard
                        name={`${vendor.firstName || ""} ${vendor.lastName || ""}`.trim() ||
                                vendor.username ||
                                "Vendor" }
                        username={vendor.username}
                        companyName={vendor.companyName || vendor.title}
                        category={vendor.categories?.[0] || "General"}
                        rating={Number(vendor.rating).toFixed(2) || 0}
                        reviewCount={vendor.reviewCount || 0}
                        location={vendor.location || "Remote"}
                        responseTime={vendor.responseTime || "N/A"}
                        hourlyRate={Number(vendor.hourlyRate) || 0}
                        isVerified={vendor.isApproved || false}
                        isFeatured={vendor.isFeatured || false}
                        certifications={vendor.certifications || []}
                        availability={vendor.availability || "Available"}
                        skills={vendor.skills || []}
                        avatar={vendor.avatar || undefined}
                      />
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-lg text-muted-foreground mb-4">
                  No vendors found matching your criteria
                </p>
                <Button onClick={clearFilters} variant="outline">
                  Clear Filters
                </Button>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}

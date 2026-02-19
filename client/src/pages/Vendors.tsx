import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation, Link } from "wouter";
import { Header } from "@/components/Header";
import { VendorCard } from "@/components/VendorCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Search, Filter, X } from "lucide-react";
import type { VendorProfile } from "@shared/schema";
import { useNavigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast";

export default function Vendors() {
  const [location] = useLocation();
  const searchParams = new URLSearchParams(location.split('?')[1]);
  const categoryParam = searchParams.get('category');
  
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>(categoryParam || "all");
  const [selectedLocation, setSelectedLocation] = useState<string>("all");
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (categoryParam) {
      setSelectedCategory(categoryParam);
    }
  }, [categoryParam]);

  const {
  data: vendors = [],
  isLoading,
  error,
} = useQuery<VendorProfile[]>({
  queryKey: ["/api/vendors"],
  queryFn: async () => {
    const res = await fetch("/api/vendors");
    const data = await res.json();
      debugger

    if (data?.message === "Access denied") {
      throw new Error("ACCESS_DENIED");
    }

    return data;
  },
});

if (error instanceof Error && error.message === "ACCESS_DENIED") {
  toast({ title: "Access denied" });
  navigate("/vendor-dashboard");
}

  const categories = [
    { id: "all", label: "All Categories" },
    { id: "legal", label: "Legal & Compliance" },
    { id: "hr", label: "HR & Talent" },
    { id: "finance", label: "Finance & Accounting" },
    { id: "cybersecurity", label: "IT & Cybersecurity" },
    { id: "marketing", label: "Marketing & Branding" },
    { id: "business_tools", label: "Business Tools" },
  ];

  const locations = [
    { id: "all", label: "All Locations" },
    ...Array.from(new Set(vendors.map(v => v.location).filter(Boolean)))
      .map(loc => ({ id: loc!, label: loc! }))
  ];

  const filteredVendors = vendors.filter(vendor => {
    // Category filter
    if (selectedCategory !== "all" && !vendor.categories?.includes(selectedCategory as any)) {
      return false;
    }

    // Location filter
    if (selectedLocation !== "all" && vendor.location !== selectedLocation) {
      return false;
    }

    // Verified filter
    if (verifiedOnly && !vendor.isApproved) {
      return false;
    }

    // Search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesTitle = vendor.title?.toLowerCase().includes(query);
      const matchesCompany = vendor.companyName?.toLowerCase().includes(query);
      const matchesSkills = vendor.skills?.some(skill => 
        skill.toLowerCase().includes(query)
      );
      const matchesDescription = vendor.description?.toLowerCase().includes(query);
      
      return matchesTitle || matchesCompany || matchesSkills || matchesDescription;
    }

    return true;
  }).sort((a, b) => {
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
  };

  const activeFiltersCount = 
    (selectedCategory !== "all" ? 1 : 0) +
    (selectedLocation !== "all" ? 1 : 0) +
    (verifiedOnly ? 1 : 0);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2" data-testid="text-page-title">
            Browse Vendors
          </h1>
          <p className="text-lg text-muted-foreground">
            Discover vetted service providers for your government contracting needs
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
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  data-testid="input-search-vendors"
                />
              </div>

              {/* Filter Row */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger data-testid="select-category">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(cat => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={selectedLocation} onValueChange={setSelectedLocation}>
                  <SelectTrigger data-testid="select-location">
                    <SelectValue placeholder="Location" />
                  </SelectTrigger>
                  <SelectContent>
                    {locations.map(loc => (
                      <SelectItem key={loc.id} value={loc.id}>
                        {loc.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <div className="flex items-center gap-4">
                  <Button
                    variant={verifiedOnly ? "default" : "outline"}
                    onClick={() => setVerifiedOnly(!verifiedOnly)}
                    className="flex-1"
                    data-testid="button-verified-only"
                  >
                    <Filter className="w-4 h-4 mr-2" />
                    Verified Only
                  </Button>
                  
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
                  <span className="text-sm text-muted-foreground">Active filters:</span>
                  {selectedCategory !== "all" && (
                    <Badge variant="secondary" data-testid="badge-filter-category">
                      {categories.find(c => c.id === selectedCategory)?.label}
                    </Badge>
                  )}
                  {selectedLocation !== "all" && (
                    <Badge variant="secondary" data-testid="badge-filter-location">
                      {selectedLocation}
                    </Badge>
                  )}
                  {verifiedOnly && (
                    <Badge variant="secondary" data-testid="badge-filter-verified">
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
              <p className="text-sm text-muted-foreground" data-testid="text-results-count">
                Showing {filteredVendors.length} {filteredVendors.length === 1 ? 'vendor' : 'vendors'}
              </p>
            </div>

            {filteredVendors.length > 0 ? (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {filteredVendors.map((vendor) => (
                  <Link key={vendor.userId} href={`/vendor/${vendor.userId}`}>
                    <div className="cursor-pointer">
                      <VendorCard
                        name={vendor.title}
                        title={vendor.companyName || vendor.title}
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
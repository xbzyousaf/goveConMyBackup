import { useLocation, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { VendorCard } from "@/components/VendorCard";
import { Search as SearchIcon, MapPin, DollarSign, Star, Clock, CheckCircle, ArrowRight } from "lucide-react";
import type { VendorProfile } from "@shared/schema";

export default function Search() {
  const [location] = useLocation();
  const searchParams = new URLSearchParams(location.split('?')[1]);
  const query = searchParams.get('q') || '';

  const { data: vendors = [], isLoading: vendorsLoading } = useQuery<VendorProfile[]>({
    queryKey: ['/api/vendors'],
    enabled: !!query
  });

  const services = [
    {
      id: "sam-registration",
      category: "legal",
      name: "SAM.gov Registration",
      description: "Complete entity registration in the System for Award Management with expert guidance",
      turnaround: "5-7 business days",
      pricingModel: "Fixed: $1,500",
    },
    {
      id: "contract-review",
      category: "legal",
      name: "Federal Contract Review",
      description: "Expert legal review of federal contracts and agreements for compliance and risk",
      turnaround: "3-5 business days",
      pricingModel: "Hourly: $150-250/hr",
    },
    {
      id: "gsa-schedule",
      category: "legal",
      name: "GSA Schedule Application",
      description: "Full support for GSA Schedule application and contract award process",
      turnaround: "60-90 days",
      pricingModel: "Fixed: $15,000-25,000",
    },
    {
      id: "cmmc-assessment",
      category: "cybersecurity",
      name: "CMMC Compliance Assessment",
      description: "Comprehensive Cybersecurity Maturity Model Certification readiness evaluation",
      turnaround: "10-15 business days",
      pricingModel: "Fixed: $3,500-7,500",
    },
    {
      id: "proposal-writing",
      category: "marketing",
      name: "Federal Proposal Writing",
      description: "Professional proposal writing services for RFPs, RFQs, and solicitations",
      turnaround: "7-14 business days",
      pricingModel: "Hourly: $75-125/hr",
    },
    {
      id: "hr-compliance",
      category: "hr",
      name: "HR Compliance Package",
      description: "Complete HR compliance setup for federal contractor requirements",
      turnaround: "5-7 business days",
      pricingModel: "Fixed: $2,000",
    },
    {
      id: "cost-accounting",
      category: "finance",
      name: "Cost Accounting Setup",
      description: "Job costing and project accounting system setup for federal contracts",
      turnaround: "10-12 business days",
      pricingModel: "Fixed: $3,000",
    },
  ];

  const filteredVendors = vendors.filter(vendor => 
    query && (
      vendor.companyName?.toLowerCase().includes(query.toLowerCase()) ||
      vendor.title?.toLowerCase().includes(query.toLowerCase()) ||
      vendor.description?.toLowerCase().includes(query.toLowerCase()) ||
      vendor.skills?.some((skill: string) => skill.toLowerCase().includes(query.toLowerCase()))
    )
  );

  const filteredServices = services.filter(service =>
    query && (
      service.name.toLowerCase().includes(query.toLowerCase()) ||
      service.description.toLowerCase().includes(query.toLowerCase()) ||
      service.category.toLowerCase().includes(query.toLowerCase())
    )
  );

  const totalResults = filteredVendors.length + filteredServices.length;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="mb-8">
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <SearchIcon className="w-4 h-4" />
            <span className="text-sm">Search results for</span>
          </div>
          <h1 className="text-3xl font-bold mb-2" data-testid="text-search-query">
            "{query}"
          </h1>
          <p className="text-muted-foreground" data-testid="text-results-count">
            {totalResults} {totalResults === 1 ? 'result' : 'results'} found
          </p>
        </div>

        {totalResults === 0 && !vendorsLoading && (
          <Card className="p-12 text-center">
            <SearchIcon className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No results found</h3>
            <p className="text-muted-foreground mb-6">
              Try adjusting your search terms or browse our categories
            </p>
            <div className="flex gap-3 justify-center">
              <Link href="/vendors">
                <Button variant="outline">Browse Vendors</Button>
              </Link>
              <Link href="/services">
                <Button variant="outline">Browse Services</Button>
              </Link>
            </div>
          </Card>
        )}

        {totalResults > 0 && (
          <Tabs defaultValue="all" className="w-full">
            <TabsList>
              <TabsTrigger value="all" data-testid="tab-all">
                All Results ({totalResults})
              </TabsTrigger>
              <TabsTrigger value="vendors" data-testid="tab-vendors">
                Vendors ({filteredVendors.length})
              </TabsTrigger>
              <TabsTrigger value="services" data-testid="tab-services">
                Services ({filteredServices.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="mt-6 space-y-8">
              {filteredVendors.length > 0 && (
                <div>
                  <h2 className="text-2xl font-bold mb-4">Vendors</h2>
                  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {filteredVendors.map((vendor) => (
                      <Link key={vendor.id} href={`/vendor/${vendor.id}`}>
                        <div className="cursor-pointer">
                          <VendorCard
                            name={vendor.title}
                            title={vendor.companyName || vendor.title}
                            category={vendor.categories?.[0] || "General"}
                            rating={Number(vendor.rating) || 0}
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
                </div>
              )}

              {filteredServices.length > 0 && (
                <div>
                  <h2 className="text-2xl font-bold mb-4">Services</h2>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {filteredServices.map((service) => (
                      <Card key={service.id} className="hover-elevate active-elevate-2 transition-all" data-testid={`card-service-${service.id}`}>
                        <CardHeader>
                          <CardTitle className="text-lg">{service.name}</CardTitle>
                          <CardDescription>{service.description}</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2 mb-4">
                            <div className="flex items-center gap-2 text-sm">
                              <Clock className="w-4 h-4 text-muted-foreground" />
                              <span className="text-muted-foreground">Turnaround:</span>
                              <span className="font-medium">{service.turnaround}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                              <DollarSign className="w-4 h-4 text-muted-foreground" />
                              <span className="text-muted-foreground">Pricing:</span>
                              <span className="font-medium">{service.pricingModel}</span>
                            </div>
                          </div>
                          <Link href="/services">
                            <Button variant="outline" size="sm" className="w-full">
                              View Details
                              <ArrowRight className="w-4 h-4 ml-2" />
                            </Button>
                          </Link>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="vendors" className="mt-6">
              {filteredVendors.length > 0 ? (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {filteredVendors.map((vendor) => (
                    <Link key={vendor.id} href={`/vendor/${vendor.id}`}>
                      <div className="cursor-pointer">
                        <VendorCard
                          name={vendor.title}
                          title={vendor.companyName || vendor.title}
                          category={vendor.categories?.[0] || "General"}
                          rating={Number(vendor.rating) || 0}
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
                <Card className="p-12 text-center">
                  <p className="text-muted-foreground">No vendors found matching your search</p>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="services" className="mt-6">
              {filteredServices.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {filteredServices.map((service) => (
                    <Card key={service.id} className="hover-elevate active-elevate-2 transition-all" data-testid={`card-service-${service.id}`}>
                      <CardHeader>
                        <CardTitle className="text-lg">{service.name}</CardTitle>
                        <CardDescription>{service.description}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2 mb-4">
                          <div className="flex items-center gap-2 text-sm">
                            <Clock className="w-4 h-4 text-muted-foreground" />
                            <span className="text-muted-foreground">Turnaround:</span>
                            <span className="font-medium">{service.turnaround}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <DollarSign className="w-4 h-4 text-muted-foreground" />
                            <span className="text-muted-foreground">Pricing:</span>
                            <span className="font-medium">{service.pricingModel}</span>
                          </div>
                        </div>
                        <Link href="/services">
                          <Button variant="outline" size="sm" className="w-full">
                            View Details
                            <ArrowRight className="w-4 h-4 ml-2" />
                          </Button>
                        </Link>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card className="p-12 text-center">
                  <p className="text-muted-foreground">No services found matching your search</p>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        )}
      </main>
    </div>
  );
}

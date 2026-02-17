import { useQuery } from "@tanstack/react-query";
import { useRoute, Link } from "wouter";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MapPin, DollarSign, Clock, Star, CheckCircle, ArrowLeft, ArrowRight,MessageSquare, Award, Shield, TrendingUp, Calendar, FileText } from "lucide-react";
import type { VendorProfile, Review } from "@shared/schema";
import { useLocation } from "wouter";
import type { Service } from "@shared/schema";
import { useState } from "react";

export default function VendorDetail() {
  const [, params] = useRoute("/vendor/:id");
  const vendorId = params?.id;
  const [, setLocation] = useLocation();
  const { data: vendor, isLoading } = useQuery<VendorProfile>({
    queryKey: vendorId ? [`/api/vendors/${vendorId}`] : ["disabled"],
    enabled: !!vendorId,
  });
  const [activeTab, setActiveTab] = useState("about");

  const { data: reviews = [] } = useQuery<Review[]>({
    queryKey: vendorId ? [`/api/vendors/${vendorId}/reviews`] : ["disabled"],
    enabled: !!vendorId,
  });

  const { data: services = [], isLoading: servicesLoading } = useQuery<Service[]>({
    queryKey: vendorId ? [`/api/vendors/${vendorId}/services`] : ["disabled"],
    enabled: !!vendorId,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex justify-center items-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (!vendor) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-16 text-center">
          <h2 className="text-2xl font-bold mb-4">Vendor Not Found</h2>
          <p className="text-muted-foreground mb-8">
            The vendor you're looking for doesn't exist or has been removed.
          </p>
          <Link href="/vendors">
            <Button>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Vendors
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const isTopRated = Number(vendor.rating) >= 4.5 && (vendor.reviewCount ?? 0) >= 10;
  const pastPerformance = Array.isArray(vendor.pastPerformance)
  ? vendor.pastPerformance
  : typeof vendor.pastPerformance === "string"
    ? JSON.parse(vendor.pastPerformance)
    : [];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        {/* Back Button */}
        <Link href="/vendors">
          <Button variant="ghost" className="mb-6" data-testid="button-back">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Vendors
          </Button>
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Profile Header */}
            <Card className={vendor.isFeatured ? 'border-primary shadow-md' : ''}>
              <CardContent className="p-8">
                <div className="flex items-start gap-6">
                  <Avatar className="w-24 h-24">
                    <AvatarImage src={vendor.avatar || ""} />
                    <AvatarFallback className="text-2xl">
                      {vendor.title?.[0] || "V"}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1">
                    <div className="flex flex-wrap items-start gap-2 mb-2">
                      <h1 className="text-3xl font-bold" data-testid="text-vendor-title">
                        {vendor.title}
                      </h1>
                      {vendor.isApproved && (
                        <Badge variant="default" className="flex items-center gap-1" data-testid="badge-verified">
                          <CheckCircle className="w-3 h-3" />
                          Verified
                        </Badge>
                      )}
                      {vendor.isFeatured && (
                        <Badge variant="default" className="flex items-center gap-1" data-testid="badge-featured">
                          <TrendingUp className="w-3 h-3" />
                          Featured
                        </Badge>
                      )}
                      {isTopRated && (
                        <Badge variant="secondary" className="flex items-center gap-1 bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100" data-testid="badge-top-rated">
                          <Star className="w-3 h-3 fill-current" />
                          Top Rated
                        </Badge>
                      )}
                    </div>

                    {vendor.companyName && (
                      <p className="text-lg text-muted-foreground mb-3" data-testid="text-company-name">
                        {vendor.companyName}
                      </p>
                    )}

                    <div className="flex flex-wrap items-center gap-4 text-sm">
                      {vendor.location && (
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <MapPin className="w-4 h-4" />
                          <span data-testid="text-location">{vendor.location}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 text-yellow-400 fill-current" />
                        <span className="font-medium" data-testid="text-rating">
                          {vendor.rating ? Number(vendor.rating).toFixed(2) : "N/A"}
                        </span>
                        {(vendor.reviewCount ?? 0) > 0 && (
                          <span className="text-muted-foreground">
                            ({vendor.reviewCount} reviews)
                          </span>
                        )}
                      </div>
                      {vendor.availability && (
                        <Badge variant={vendor.availability === "Available" ? "secondary" : "outline"} data-testid="badge-availability">
                          {vendor.availability}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Certifications */}
            {vendor.certifications && vendor.certifications.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Award className="w-5 h-5" />
                    Certifications & Qualifications
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {vendor.certifications.map((cert, index) => (
                      <Badge key={index} variant="outline" className="text-sm" data-testid={`badge-cert-${index}`}>
                        {cert === 'MBE Certified' && <Award className="w-4 h-4 mr-1" />}
                        {cert === 'GovCon Experienced' && <Shield className="w-4 h-4 mr-1" />}
                        {cert}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Tabs for About, Past Performance, Reviews */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="about" data-testid="tab-about">About</TabsTrigger>
                <TabsTrigger value="services">Services</TabsTrigger>
                <TabsTrigger value="performance" data-testid="tab-performance">Past Performance</TabsTrigger>
                <TabsTrigger value="reviews" data-testid="tab-reviews">Reviews ({reviews.length})</TabsTrigger>
              </TabsList>

              <TabsContent value="about" className="mt-6">
                {/* About */}
                {vendor.description && (
                  <Card>
                    <CardHeader>
                      <CardTitle>About</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground leading-relaxed" data-testid="text-description">
                        {vendor.description}
                      </p>
                    </CardContent>
                  </Card>
                )}

                {/* Skills & Expertise */}
                {vendor.skills && vendor.skills.length > 0 && (
                  <Card className="mt-6">
                    <CardHeader>
                      <CardTitle>Skills & Expertise</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2">
                        {vendor.skills.map((skill, index) => (
                          <Badge key={index} variant="secondary" data-testid={`badge-skill-${index}`}>
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Service Categories */}
                {vendor.categories && vendor.categories.length > 0 && (
                  <Card className="mt-6">
                    <CardHeader>
                      <CardTitle>Service Categories</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2">
                        {vendor.categories.map((category, index) => (
                          <Badge key={index} variant="outline" data-testid={`badge-category-${index}`}>
                            {category.replace('_', ' ').toUpperCase()}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
              <TabsContent value="services" className="mt-6">
                  {servicesLoading ? (
                    <div className="text-center py-6">Loading services...</div>
                  ) : services.length > 0 ? (
                    <div className="grid gap-6 md:grid-cols-2">
                      {services.map((service) => (
                        <Card
                          key={service.id}
                          className="hover-elevate transition-all flex flex-col"
                        >
                          <CardHeader>
                            <div className="flex items-start justify-between">
                              <CardTitle className="text-lg">
                                {service.name ?? "Untitled Service"}
                              </CardTitle>

                              {service.category && (
                                <Badge variant="secondary">
                                  {service.category}
                                </Badge>
                              )}
                            </div>

                            <CardDescription>
                              {service.description ?? "No description available"}
                            </CardDescription>
                          </CardHeader>

                          <CardContent className="flex-1 flex flex-col">
                            {/* Meta Info */}
                            <div className="space-y-3 mb-4">
                              {service.turnaround && (
                                <div className="flex items-center gap-2 text-sm">
                                  <Clock className="w-4 h-4 text-muted-foreground" />
                                  <span className="text-muted-foreground">Turnaround:</span>
                                  <span className="font-medium">
                                    {service.turnaround}
                                  </span>
                                </div>
                              )}

                              {(service.priceMin || service.priceMax) && (
                                <div className="flex items-center gap-2 text-sm">
                                  <DollarSign className="w-4 h-4 text-muted-foreground" />
                                  <span className="text-muted-foreground">Pricing:</span>
                                  <span className="font-medium">
                                    {service.priceMin && service.priceMax
                                      ? `$${service.priceMin} – $${service.priceMax}`
                                      : "Contact vendor"}
                                  </span>
                                </div>
                              )}
                            </div>

                            {/* Outcomes */}
                            {Array.isArray(service.outcomes) && service.outcomes.length > 0 && (
                              <div className="mb-4">
                                <p className="text-sm font-medium mb-2">Outcomes:</p>
                                <ul className="space-y-1">
                                  {service.outcomes.map((outcome: string, idx: number) => (
                                    <li key={idx} className="flex items-start gap-2 text-sm">
                                      <CheckCircle className="w-4 h-4 text-primary mt-0.5" />
                                      <span className="text-muted-foreground">
                                        {outcome}
                                      </span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            {/* CTA */}
                            <div className="mt-auto pt-4 border-t">
                              <Button
                                className="w-full"
                                onClick={() =>
                                  setLocation(
                                    `/request?vendorId=${vendor.userId}&serviceId=${service.id}`
                                  )
                                }
                              >
                                Request This Service
                                <ArrowRight className="ml-2 w-4 h-4" />
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <Card>
                      <CardContent className="p-8 text-center text-muted-foreground">
                        This vendor has not added any services yet.
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>


              <TabsContent value="performance" className="mt-6">
                {pastPerformance.length > 0 ? (
                  <div className="space-y-4">
                    {pastPerformance.map((project: any, index: number) => (
                      <Card key={index} data-testid={`card-past-performance-${index}`}>
                        <CardHeader>
                          <div className="flex items-start justify-between">
                            <div>
                              <CardTitle className="text-lg">{project.projectName}</CardTitle>
                              <CardDescription>{project.clientName}</CardDescription>
                            </div>
                            {project.contractValue && (
                              <Badge variant="secondary">${project.contractValue}</Badge>
                            )}
                          </div>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-muted-foreground mb-3">{project.description}</p>
                          <div className="flex items-center gap-4 text-sm">
                            {project.completionDate && (
                              <div className="flex items-center gap-1 text-muted-foreground">
                                <Calendar className="w-4 h-4" />
                                Completed: {project.completionDate}
                              </div>
                            )}
                            {project.outcome && (
                              <div className="flex items-center gap-1 text-muted-foreground">
                                <FileText className="w-4 h-4" />
                                {project.outcome}
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <Card>
                    <CardContent className="p-8 text-center text-muted-foreground">
                      No past performance data available yet.
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="reviews" className="mt-6">
                {reviews.length > 0 ? (
                <div className="space-y-4">
                  {reviews.map((review, index) => {
                    const fullName =
                      review.contractorName?.trim() || "Contractor";

                    const firstLetter = fullName.charAt(0).toUpperCase();

                    return (
                      <Card
                        key={review.id}
                        data-testid={`card-review-${index}`}
                      >
                        <CardContent className="p-6">
                          <div className="flex gap-4">

                            {/* Avatar */}
                            <Avatar className="w-10 h-10">
                              <AvatarFallback>
                                {review.contractorName
                                  ? review.contractorName.charAt(0).toUpperCase()
                                  : "C"}
                              </AvatarFallback>
                            </Avatar>

                            {/* Right Side Content */}
                            <div className="flex-1 space-y-2">

                              {/* Row 1: Name (left) + Date (right) */}
                              <div className="flex justify-between items-center">
                                <p className="font-medium">
                                  {review.contractorName ?? "Contractor"}
                                </p>

                                <span className="text-xs text-muted-foreground">
                                  {review.createdAt
                                    ? new Date(review.createdAt).toLocaleDateString()
                                    : ""}
                                </span>
                              </div>

                              {/* Row 2: Rating */}
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium">
                                  {review.rating}/5
                                </span>

                                <div className="flex items-center gap-1">
                                  {Array.from({ length: 5 }).map((_, i) => (
                                    <Star
                                      key={i}
                                      className={`w-4 h-4 ${
                                        i < review.rating
                                          ? "text-yellow-400 fill-yellow-400"
                                          : "text-muted-foreground"
                                      }`}
                                    />
                                  ))}
                                </div>
                              </div>

                              {/* Row 3: Comment */}
                              {review.comment && (
                                <p className="text-sm text-muted-foreground">
                                  {review.comment}
                                </p>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              ) : (
                <Card>
                  <CardContent className="p-8 text-center text-muted-foreground">
                    No reviews yet. Be the first to work with this vendor!
                  </CardContent>
                </Card>
              )}

              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Info */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Info</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {vendor.hourlyRate && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <DollarSign className="w-4 h-4" />
                      <span>Hourly Rate</span>
                    </div>
                    <span className="font-semibold" data-testid="text-hourly-rate">
                      ${vendor.hourlyRate}/hr
                    </span>
                  </div>
                )}
                
                {vendor.responseTime && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Clock className="w-4 h-4" />
                      <span>Response Time</span>
                    </div>
                    <span className="font-semibold" data-testid="text-response-time">
                      {vendor.responseTime}
                    </span>
                  </div>
                )}

                <Separator />

                <Button className="w-full" size="lg"
                  onClick={() =>
                    setLocation(`/?section=request&vendorId=${vendor.id}`)
                  }
                >
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Contact Vendor
                </Button>
                
                  <Button
                    variant="outline"
                    className="w-full"
                    size="lg"
                    data-testid="button-request-service"
                    onClick={() => setActiveTab("services")}
                  >
                    Request Service
                  </Button>
              </CardContent>
            </Card>

            {/* Stats */}
            <Card>
              <CardHeader>
                <CardTitle>Performance</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground">Rating</span>
                    <span className="font-semibold">{vendor.rating ? Number(vendor.rating).toFixed(2) : "N/A"}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star 
                        key={i} 
                        className={`w-4 h-4 ${
                          i < Math.floor(Number(vendor.rating || 0))
                            ? 'text-yellow-400 fill-current' 
                            : 'text-muted-foreground'
                        }`}
                      />
                    ))}
                  </div>
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Total Reviews</span>
                  <span className="font-semibold">{vendor.reviewCount || 0}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Past Projects</span>
                  <span className="font-semibold">{pastPerformance.length}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Availability</span>
                  <Badge variant={vendor.availability === "Available" ? "default" : "secondary"}>
                    {vendor.availability || "Available"}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}

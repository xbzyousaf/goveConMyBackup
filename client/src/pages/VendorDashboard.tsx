import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Header } from "@/components/Header";
import { VendorProfileForm } from "@/components/VendorProfileForm";
import { Card, CardContent, CardDescription, CardHeader, CardFooter, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { Building, MapPin, DollarSign, Clock, Star, Edit, Plus, CheckCircle, AlertCircle, Users, TrendingUp, User, CalendarDays, ArrowRight, MessageCircle, MessageSquare, Check, X, FileText } from "lucide-react";
import { useLocation } from "wouter";
import { calculateMonthlyMetric } from "@/services/servicesStats.service";
import { cn } from "@/lib/utils";
import { isCurrentMonth } from "@/helpers/dateHelper";
import { useMessages } from "@/components/ui/MessageContext";

export default function VendorDashboard() {
  const { openConversation } = useMessages();
  const queryClient = useQueryClient();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  // Fetch vendor profile
  const { data: vendorProfile, isLoading: profileLoading } = useQuery({
    queryKey: ["/api/vendor-profile"],
    retry: false,
  });
  const { data: reviews = [] } = useQuery<{
    rating: number;
  }[]>({
    queryKey: ["/api/vendors", user?.id, "reviews"],
    enabled: !!user?.id,
    queryFn: async () => {
      const res = await fetch(`/api/vendors/${user!.id}/reviews`);
      if (!res.ok) throw new Error("Failed to fetch reviews");
      return res.json();
    },
  });
  const [confirmAction, setConfirmAction] = useState<{
    id: string;
    status: "in_progress" | "cancelled" | "completed";
  } | null>(null);

  const averageRating =
  reviews.length === 0
    ? 0
    : Number(
        (
          reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
        ).toFixed(1)
      );

    // AUTH + ONBOARDING GUARD
  if (!user) {
    setLocation("/login");
    return null;
  }

  const updateStatus = useMutation({
    mutationFn: async ({
      id,
      status,
    }: {
      id: string;
      status: string;
    }) => {
      const res = await fetch(`/api/service-requests/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });

      if (!res.ok) throw new Error("Failed to update status");

      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/service-requests"] });
      setConfirmAction(null);
    },
  });

  // vendor must complete onboarding
  if (user.userType === "vendor" && !user.hasCompletedOnboarding) {
    setLocation("/vendor-onboarding");
    return null;
  }
  const { data: serviceRequests = [] } = useQuery<ServiceRequest[]>({
    queryKey: ["/api/service-requests"],
  });
  const earningsChange = calculateMonthlyMetric(serviceRequests, {
    dateKey: "createdAt",
    valueFn: r =>
      r.status === "completed" ? Number(r.actualCost ?? 0) : 0,
  });
  const totalRequestsChange = calculateMonthlyMetric(serviceRequests, {
    dateKey: "createdAt",
    valueFn: () => 1, // 👈 count each request as 1
  });
  const recentRequests = serviceRequests.filter(
    r => r.createdAt && isCurrentMonth(r.createdAt)
  ).sort(
    (a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  ).slice(0, 5);


  // Mock data for service requests and stats
  type ServiceRequest = {
    id: string;
    createdAt: string;
    status?: string;
    vendorId?: string;
    contractorId?: string;
    budget?: string;
    description?: string;
    actualCost?: number | null;

    contractor?: {
      firstName?: string | null;
      lastName?: string | null;
    };

    service?: {
      name?: string | null;
    };

    title?: string; // request title
  };


  const mockStats = {
    totalRequests: serviceRequests.filter(r => r.createdAt && isCurrentMonth(r.createdAt)).length,
    completedRequests: serviceRequests.filter(r => r.status === 'completed' && r.createdAt && isCurrentMonth(r.createdAt)).length,
    averageRating: averageRating,
    monthlyEarnings: serviceRequests.filter(r =>r.status === "completed" && r.createdAt && isCurrentMonth(r.createdAt))
    .reduce((sum, r) => sum + Number(r.actualCost ?? 0), 0),
  };

  if (showCreateForm) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <VendorProfileForm 
            onSuccess={() => setShowCreateForm(false)}
            onCancel={() => setShowCreateForm(false)}
          />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8 space-y-8">
        {/* Welcome Section */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold" data-testid="text-welcome-title">
              Welcome, {user?.firstName || "Vendor"}!
            </h1>
            <p className="text-muted-foreground" data-testid="text-welcome-description">
              Manage your vendor profile and service requests
            </p>
          </div>
          
          {!vendorProfile && !profileLoading && (
            <Button 
              onClick={() => setShowCreateForm(true)}
              data-testid="button-create-profile"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Vendor Profile
            </Button>
          )}
        </div>

        {profileLoading && (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        )}

        {!vendorProfile && !profileLoading ? (
          // No Profile Created Yet
          <Card className="text-center py-12" data-testid="card-no-profile">
            <CardContent className="space-y-4">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto">
                <Building className="w-8 h-8 text-muted-foreground" />
              </div>
              <CardTitle>Create Your Vendor Profile</CardTitle>
              <CardDescription>
                Set up your professional profile to start receiving service requests from government contractors.
              </CardDescription>
              <Button 
                size="lg" 
                onClick={() => setShowCreateForm(true)}
                data-testid="button-setup-profile"
              >
                <Plus className="w-4 h-4 mr-2" />
                Get Started
              </Button>
            </CardContent>
          </Card>
        ) : vendorProfile && (
          // Profile Exists - Show Dashboard
          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList data-testid="tabs-dashboard">
              <TabsTrigger value="overview" data-testid="tab-overview">Overview</TabsTrigger>
              <TabsTrigger value="profile" data-testid="tab-profile">Profile</TabsTrigger>
              <TabsTrigger value="requests" data-testid="tab-requests">Service Requests</TabsTrigger>
              <TabsTrigger value="reviews" data-testid="tab-reviews">Reviews</TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6">
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card data-testid="card-stat-requests">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold" data-testid="stat-total-requests">
                      {mockStats.totalRequests}
                    </div>
                    <p className={cn(
                      "text-xs",
                      totalRequestsChange.percentChange > 0 && "text-green-600",
                      totalRequestsChange.percentChange < 0 && "text-red-600",
                      totalRequestsChange.percentChange === 0 && "text-muted-foreground"
                    )}>
                      {totalRequestsChange.label === "new this month"
                        ? "New this month"
                        : `${totalRequestsChange.percentChange >= 0 ? "+" : ""}${totalRequestsChange.percentChange}% from last month`}
                    </p>
                  </CardContent>
                </Card>
                
                <Card data-testid="card-stat-completed">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Completed</CardTitle>
                    <CheckCircle className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold" data-testid="stat-completed-requests">
                      {mockStats.completedRequests}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {Math.round(((mockStats?.completedRequests || 0) / (mockStats?.totalRequests || 1)) * 100)}% completion rate
                    </p>
                  </CardContent>
                </Card>
                
                <Card data-testid="card-stat-rating">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Avg. Rating</CardTitle>
                    <Star className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold" data-testid="stat-average-rating">
                      {mockStats.averageRating}
                    </div>
                    <div className="flex items-center text-xs text-muted-foreground">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star 
                          key={i} 
                          className={`w-3 h-3 ${i < Math.floor(mockStats.averageRating) ? 'text-yellow-400 fill-current' : 'text-muted-foreground'}`}
                        />
                      ))}
                    </div>
                  </CardContent>
                </Card>
                
                <Card data-testid="card-stat-earnings">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Monthly Earnings</CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold" data-testid="stat-monthly-earnings">
                      ${mockStats.monthlyEarnings.toLocaleString()}
                    </div>
                    <p className={cn(
                      "text-xs",
                      earningsChange.percentChange > 0 && "text-green-600",
                      earningsChange.percentChange < 0 && "text-red-600",
                      earningsChange.percentChange === 0 && "text-muted-foreground"
                    )}>
                      {earningsChange.label === "new this month"
                        ? "New this month"
                        : `${earningsChange.percentChange >= 0 ? "+" : ""}${earningsChange.percentChange}% from last month`}
                    </p>


                  </CardContent>
                </Card>
              </div>

              {/* Recent Requests */}
              <Card data-testid="card-recent-requests">
                <CardHeader>
                  <CardTitle>Recent Service Requests</CardTitle>
                  <CardDescription>Latest requests from contractors</CardDescription>
                </CardHeader>
                <CardContent>
                  {recentRequests.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center">
                      No recent service requests
                    </p>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {recentRequests.map((request) => (
                      <Card
                        key={request.id}
                        className="flex flex-col h-full transition-all hover:shadow-xl hover:-translate-y-1 rounded-2xl"
                      >
                        {/* Header */}
                        <CardHeader>
                          <div className="flex items-start justify-between gap-3">
                            <CardTitle className="text-lg">
                              {request.service?.name ?? "Service"}
                            </CardTitle>

                            <Badge
                              className={cn(
                                "capitalize text-xs font-medium",
                                request.status === "completed" &&
                                  "bg-green-100 text-green-700 border-green-200",
                                request.status === "in_progress" &&
                                  "bg-blue-100 text-blue-700 border-blue-200",
                                request.status === "pending" &&
                                  "bg-amber-100 text-amber-700 border-amber-200"
                              )}
                            >
                              {request.status?.replace("_", " ") ?? "Unknown"}
                            </Badge>
                          </div>
                        </CardHeader>

                        {/* Content */}
                        <CardContent className="flex-1 flex flex-col">
                          <div className="space-y-3 mb-4">
                            <div className="space-y-2 mb-6">
                              {/* Title Row */}
                              <div className="flex items-start gap-2">
                                <FileText className="w-4 h-4 mt-1 text-muted-foreground flex-shrink-0" />
                                <h4 className="font-semibold text-foreground leading-snug">
                                  {request.title ?? "Untitled Request"}
                                </h4>
                              </div>

                              {/* Description */}
                              <p className="text-sm text-muted-foreground pl-6">
                                {request.description ?? "No description provided"}
                              </p>
                            </div>

                            {/* Contractor */}
                            <div className="flex justify-between text-sm">
                              <div className="flex gap-2">
                                <User className="w-4 h-4 text-muted-foreground" />
                                <span className="text-muted-foreground">Contractor:</span>
                              </div>
                              <div>
                                <span className="font-medium">
                                {request.contractor?.firstName
                                  ? `${request.contractor.firstName} ${request.contractor.lastName ?? ""}`
                                  : "Not assigned"}

                              </span>
                              </div>
                              
                            </div>

                            {/* Budget */}
                            <div className="flex justify-between text-sm">
                              <div className="flex gap-2">
                                <DollarSign className="w-4 h-4 text-muted-foreground" />
                                <span className="text-muted-foreground">Budget:</span>
                              </div>
                              <div>
                                <span className="font-medium">
                                  {request?.budget
                                    ? `${(request.budget ?? 0).toLocaleString()}`
                                    : "Not specified"}
                                </span>
                              </div>
                              
                            </div>

                            {/* Created Date */}
                            <div className="flex justify-between text-sm">
                              <div className="flex gap-2">
                                <CalendarDays className="w-4 h-4 text-muted-foreground" />
                                <span className="text-muted-foreground">Created:</span>
                              </div>
                              <div>
                                <span className="font-medium">
                                  {request.createdAt
                                    ? new Date(request.createdAt).toLocaleDateString()
                                    : "N/A"}
                                </span>
                              </div>
                            </div>

                          </div>

                          {/* Footer Button */}
                          <div className="mt-auto pt-4 border-t flex items-center justify-between">

                          {/* Left Icons */}
                          <div className="flex items-center gap-3">

                            {/* Approve */}
                            <button
                              className="p-2 rounded-lg bg-primary/10 hover:bg-primary/20 transition-colors"
                              onClick={() =>
                                setConfirmAction({
                                  id: request.id,
                                  status: "in_progress",
                                })
                              }
                            >
                              <Check className="w-4 h-4 text-primary" />
                            </button>

                            {/* Cancel */}
                            <button
                              className="p-2 rounded-lg bg-red-100 hover:bg-red-200 transition-colors"
                              onClick={() =>
                                setConfirmAction({
                                  id: request.id,
                                  status: "cancelled",
                                })
                              }
                            >
                              <X className="w-4 h-4 text-red-600" />
                            </button>

                            {/* Complete */}
                            <button
                              className="p-2 rounded-lg bg-green-100 hover:bg-green-200 transition-colors"
                              onClick={() =>
                                setConfirmAction({
                                  id: request.id,
                                  status: "completed",
                                })
                              }
                            >
                              <CheckCircle className="w-4 h-4 text-green-600" />
                            </button>

                          </div>

                          {/* Message Button */}
                          <Button
                            className="rounded-lg bg-primary hover:bg-primary/90"
                            onClick={() => openConversation(request.id)}
                          >
                            <MessageSquare className="w-4 h-4 mr-2" />
                            Message
                          </Button>
                        </div>

                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>

            </TabsContent>

            {/* Profile Tab */}
            <TabsContent value="profile" className="space-y-6">
              <Card data-testid="card-vendor-profile">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <Avatar className="w-16 h-16">
                        <AvatarImage src={vendorProfile?.avatar || user?.profileImageUrl || ""} />
                        <AvatarFallback className="text-lg">
                          {vendorProfile?.title?.[0] || user?.firstName?.[0] || "V"}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <CardTitle className="flex items-center gap-2" data-testid="text-profile-title">
                          {vendorProfile?.title}
                          {vendorProfile?.isApproved && (
                            <CheckCircle className="w-5 h-5 text-green-500" />
                          )}
                        </CardTitle>
                        {vendorProfile?.companyName && (
                          <p className="text-muted-foreground" data-testid="text-company-name">
                            {vendorProfile.companyName}
                          </p>
                        )}
                      </div>
                    </div>
                    <Button
  variant="outline"
  data-testid="button-edit-profile"
  onClick={() => setLocation("/vendor-profile/edit")}
>
                      <Edit className="w-4 h-4 mr-2" />
                      Edit Profile
                    </Button>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-6">
                  {/* Status */}
                  <div className="flex items-center gap-4">
                    <Badge 
                      variant={vendorProfile?.isApproved ? "default" : "secondary"}
                      className="flex items-center gap-2"
                      data-testid="badge-approval-status"
                    >
                      {vendorProfile?.isApproved ? (
                        <CheckCircle className="w-3 h-3" />
                      ) : (
                        <AlertCircle className="w-3 h-3" />
                      )}
                      {vendorProfile?.isApproved ? "Verified" : "Pending Review"}
                    </Badge>
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Star className="w-4 h-4 mr-1 text-yellow-400 fill-current" />
                      <span data-testid="text-rating">
                        {vendorProfile?.rating || "No ratings yet"}
                        {vendorProfile?.reviewCount > 0 && ` (${vendorProfile.reviewCount} reviews)`}
                      </span>
                    </div>
                  </div>

                  {/* Description */}
                  {vendorProfile?.description && (
                    <div>
                      <h4 className="font-medium mb-2">Professional Description</h4>
                      <p className="text-muted-foreground" data-testid="text-description">
                        {vendorProfile.description}
                      </p>
                    </div>
                  )}

                  {/* Details Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {vendorProfile?.location && (
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm" data-testid="text-location">{vendorProfile.location}</span>
                      </div>
                    )}
                    
                    {vendorProfile?.hourlyRate && (
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm" data-testid="text-hourly-rate">
                          ${vendorProfile.hourlyRate}/hr
                        </span>
                      </div>
                    )}
                    
                    {vendorProfile?.responseTime && (
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm" data-testid="text-response-time">{vendorProfile.responseTime}</span>
                      </div>
                    )}
                  </div>

                  {/* Categories */}
                  {vendorProfile?.categories && vendorProfile.categories.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-2">Service Categories</h4>
                      <div className="flex flex-wrap gap-2">
                        {vendorProfile.categories.map((category, index) => (
                          <Badge key={index} variant="outline" data-testid={`badge-category-${index}`}>
                            {category.replace('_', ' ').toUpperCase()}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Skills */}
                  {vendorProfile?.skills && vendorProfile.skills.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-2">Skills & Expertise</h4>
                      <div className="flex flex-wrap gap-2">
                        {vendorProfile.skills.map((skill, index) => (
                          <Badge key={index} variant="secondary" data-testid={`badge-skill-${index}`}>
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Requests Tab */}
            <TabsContent value="requests" className="space-y-6">
              <Card data-testid="card-service-requests">
                {/* Requests Tab */}
                <TabsContent value="requests" className="space-y-6">
                  <Card data-testid="card-service-requests">
                    <CardHeader>
                      <CardTitle>Service Requests</CardTitle>
                      <CardDescription>
                        Manage your active and completed service requests
                      </CardDescription>
                    </CardHeader>

                    <CardContent>
                      <div className="space-y-4">
                        {serviceRequests.length === 0 && (
                          <p className="text-sm text-muted-foreground text-center">
                            No service requests found
                          </p>
                        )}

                        {serviceRequests.map(request => (
                          <div
                            key={request.id}
                            className="flex items-center justify-between p-4 border rounded-lg"
                          >
                            <div className="space-y-1">
                              <h4 className="font-medium">
                                {request.title ?? "Service Request"}
                              </h4>
                              <p className="text-sm text-muted-foreground">
                               Contractor: {request.contractorName ?? "Contractor"}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                Budget: $
                                {(request.budget ?? 0).toLocaleString()}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                Estimated Cost: $
                                {Number(request.estimated_cost ?? 0).toLocaleString()}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                Cost: $
                                {Number(request.actualCost ?? 0).toLocaleString()}
                              </p>
                            </div>

                            <div className="text-right space-y-1">
                              <Badge
                                className={cn(
                                  "capitalize",
                                  request.status === "completed" &&
                                    "bg-green-100 text-green-700 border-green-200",
                                  request.status === "in_progress" &&
                                    "bg-primary text-primary-foreground",
                                  request.status === "pending" &&
                                    "bg-red-100 text-red-700 border-red-200"
                                )}
                              >
                                {request.status?.replace("_", " ") ?? "unknown"}
                              </Badge>

                              {request.createdAt && (
                                <p className="text-sm text-muted-foreground">
                                  Created:{" "}
                                  {new Date(request.createdAt).toLocaleDateString()}
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

              </Card>
            </TabsContent>

            {/* Reviews Tab */}
            <TabsContent value="reviews" className="space-y-6">
              <Card data-testid="card-reviews">
                <CardHeader>
                  <CardTitle>Reviews & Ratings</CardTitle>
                  <CardDescription>Feedback from your clients</CardDescription>
                </CardHeader>

                <CardContent>
                  <div className="space-y-4">
                    {reviews.length === 0 && (
                      <p className="text-sm text-muted-foreground text-center">
                        No reviews yet
                      </p>
                    )}

                    {reviews.map((review, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="space-y-1">
                        <p className="font-medium">
                          {review.contractorName ?? "Contractor"}
                        </p>

                        <p className="text-xs text-muted-foreground capitalize">
                          {review.contractorUserType}
                        </p>

                        <div className="flex items-center gap-1">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star
                              key={i}
                              className={cn(
                                "w-4 h-4",
                                i < review.rating
                                  ? "text-yellow-400 fill-current"
                                  : "text-muted-foreground"
                              )}
                            />
                          ))}
                        </div>
                      </div>

                      <Badge variant="outline">
                        {review.rating} / 5
                      </Badge>
                    </div>
                  ))}

                  </div>
                </CardContent>
              </Card>
            </TabsContent>

          </Tabs>
        )}
      </main>
      {confirmAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          
          {/* backdrop */}
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setConfirmAction(null)}
          />

          {/* dialog */}
          <div className="relative bg-white rounded-xl shadow-xl p-6 w-full max-w-sm">
            
            <h3 className="text-lg font-semibold mb-2">
              Confirm Action
            </h3>

            <p className="text-sm text-muted-foreground mb-6">
              Are you sure you want to mark this request as{" "}
              <span className="font-medium capitalize">
                {confirmAction.status.replace("_", " ")}
              </span>
              ?
            </p>

            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setConfirmAction(null)}
              >
                Cancel
              </Button>

              <Button
                disabled={updateStatus.isPending}
                onClick={() =>
                  updateStatus.mutate({
                    id: confirmAction.id,
                    status: confirmAction.status,
                  })
                }
              >
                Confirm
              </Button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
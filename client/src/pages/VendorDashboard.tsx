import { useEffect, useState } from "react";
import { useQuery, } from "@tanstack/react-query";
import { Header } from "@/components/Header";
import { VendorProfileForm } from "@/components/VendorProfileForm";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { Building, Star, Plus, CheckCircle, Users, TrendingUp, } from "lucide-react";
import { useLocation } from "wouter";
import { calculateMonthlyMetric } from "@/services/servicesStats.service";
import { cn } from "@/lib/utils";
import { isCurrentMonth } from "@/helpers/dateHelper";
import { useToast } from "@/hooks/use-toast";
import VendorPerformanceTab from "@/components/VendorPerformanceTab";
import { REQUEST_STATUSES_LABELS, ServiceRequestStatus } from "../../../constants/serviceRequest";
import { ServiceRequestCardCompact } from "@/components/service-requests/ServiceRequestCardCompact";
import { getFirstLetter } from "@/utility/textUtils";
import StripePayoutTab from "./vendor/WalletPage";
import ProfileTab from "../components/ProfileTab";

export default function VendorDashboard() {
  
  const [showCreateForm, setShowCreateForm] = useState(false);
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("profile");
  const PAGE_SIZE = 5;
type StatusFilter = "priority" | "all" | ServiceRequestStatus;
const [page, setPage] = useState(1);
const [statusFilter, setStatusFilter] = useState<StatusFilter>("priority");

const [search, setSearch] = useState("");
useEffect(() => {
  setPage(1);
}, [statusFilter, search]);
const { data } = useQuery<{
  page: number;
  limit: number;
  total: number;
  data: ServiceRequest[];
}>({
  queryKey: ["/api/service-requests", page, statusFilter, search],
  queryFn: async () => {
    const res = await fetch(
      `/api/service-requests?page=${page}&limit=${PAGE_SIZE}&status=${statusFilter}&search=${search}`
    );
    return res.json();
  }
});
const serviceRequests = data?.data ?? [];

const totalPages = Math.ceil(
  Number(data?.total || 0) / PAGE_SIZE
);
const { data: categories = [] } = useQuery<any[]>({
  queryKey: ["/api/admin/categories"],
  queryFn: async () => {
    const res = await fetch("/api/admin/categories");
    const json = await res.json();

    return Array.isArray(json) ? json : json.data || [];
  },
});
  // Fetch vendor profile
  const { data: vendorProfile, isLoading: profileLoading } = useQuery({
    queryKey: ["/api/vendor-profile"],
    retry: false,
  });
  const { data: vendorPortfolios, isLoading: portfoliosLoading } = useQuery({
    queryKey: ["/api/portfolio"],
    retry: false,
  });
  const { data: vendorCertificates, isLoading: certificatesLoading } = useQuery({
    queryKey: ["/api/certificate"],
    retry: false,
  });
  const { data: reviews = [] } = useQuery<{
    rating: number;
    comment: string;
    contractorName: string;
    contractorUserType: string;
    createdAt: string;
  }[]>({
    queryKey: ["/api/vendors", user?.id, "reviews"],
    enabled: !!user?.id,
    queryFn: async () => {
      const res = await fetch(`/api/vendors/${user!.id}/reviews`);
      if (!res.ok) throw new Error("Failed to fetch reviews");
      return res.json();
    },
  });

  const averageRating =
  reviews.length === 0
    ? 0
    : Number(
        (
          reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
        ).toFixed(1)
      );

    // AUTH + ONBOARDING GUARD
    useEffect(() => {
    if (!user) {
      setLocation("/login");
    }
  }, [user]);

  useEffect(() => {
    if (
      vendorProfile &&
      vendorProfile.user.userType === "vendor" &&
      !vendorProfile.user.hasCompletedOnboarding
    ) {
      setLocation("/vendor-onboarding");
    }
  }, [vendorProfile]);
  
  const earningsChange = calculateMonthlyMetric(serviceRequests, {
    dateKey: "createdAt",
    valueFn: r =>
      r.status === "completed" ? Number(r.actualCost ?? 0) : 0,
  });
  const totalRequestsChange = calculateMonthlyMetric(serviceRequests, {
    dateKey: "createdAt",
    valueFn: () => 1, // 👈 count each request as 1
  });
    

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
 const allRequests = data?.data ?? [];
  const mockStats = {
    totalRequests: allRequests.length,
    completedRequests: allRequests.filter(r => r.status === 'completed').length,
    averageRating: averageRating,
    monthlyEarnings: allRequests.filter(r =>r.status === "completed" && r.createdAt && isCurrentMonth(r.createdAt))
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
      
      <main className="max-w-6xl mx-auto p-6 space-y-6">
        {/* Welcome Section */}
        <div className="">
          <div>
            <h1 className="text-3xl font-bold" data-testid="text-welcome-title">
              Welcome, {user?.firstName || "Vendor"}!
            </h1>
            <p className="text-muted-foreground" data-testid="text-welcome-description">
              Manage your profile and service requests
            </p>
          </div>
          
          {!vendorProfile && !profileLoading && (
            <Button 
              onClick={() => setShowCreateForm(true)}
              data-testid="button-create-profile"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Profile
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
              <CardTitle>Create Your Profile</CardTitle>
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
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <div className="flex items-center justify-between gap-4 mb-4 flex-wrap">

            {/* LEFT SIDE → Search + Status */}
            {activeTab === "requests" && (
            <div className="flex items-center gap-4">

              <input
                placeholder="Search requests..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="border rounded-md px-3 py-2 text-sm"
              />

              <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="border rounded-md px-3 py-2 text-sm"
                >
                  {REQUEST_STATUSES_LABELS.map((status) => (
                    <option key={status.value} value={status.value}>
                      {status.label}
                    </option>
                  ))}
                </select>

            </div>
            )}
            {/* RIGHT SIDE → Tabs */}
            <TabsList data-testid="tabs-dashboard" className="ml-auto">
              {/* <TabsTrigger value="overview" data-testid="tab-overview">Overview</TabsTrigger> */}
              <TabsTrigger value="profile" data-testid="tab-profile">Profile</TabsTrigger>
              <TabsTrigger value="requests" data-testid="tab-requests">Service Requests</TabsTrigger>
              <TabsTrigger value="reviews" data-testid="tab-reviews">Reviews</TabsTrigger>
              <TabsTrigger value="performance" data-testid="tab-performance">Performance</TabsTrigger>
              <TabsTrigger value="payouts">Payouts</TabsTrigger>
            </TabsList>


          </div>
            
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
                
                <Card data-testid="card-stat-earnings" onClick={() => setLocation('/vendors/payment')} className="cursor-pointer">
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

            </TabsContent>
            <TabsContent value="performance" className="space-y-6">
              <VendorPerformanceTab vendorId={vendorProfile?.user.id} />
            </TabsContent>
            <TabsContent value="payouts" className="space-y-6">
              <StripePayoutTab />
            </TabsContent>

            {/* Profile Tab */}
            <TabsContent value="profile">

              <ProfileTab
                profile={vendorProfile}
                categories={categories}
                certificates={vendorCertificates}
                showCertificates={true}
                editUrl="/vendor/profile/edit"
                onNavigate={setLocation}
              />

            </TabsContent>
            {/* Requests Tab */}
              <Card data-testid="card-service-requests">
                {/* Requests Tab */}
                <TabsContent value="requests" className="space-y-6">
                    <CardHeader>
                      <CardTitle>Service Requests</CardTitle>
                      <CardDescription>
                        Manage your active and completed service requests
                      </CardDescription>
                    </CardHeader>

                    <CardContent>
                      <div className="space-y-4">
                        {allRequests.map((request, index) => (
                            <ServiceRequestCardCompact
                              key={index}
                              request={request}
                              userType="vendor"
                              detailsUrl={`/vendor/requests`}
                            />
                          ))}
                      </div>
                      {totalPages> 1 && <div className="flex justify-center gap-4 mt-4">
                        <Button
                          disabled={page === 1}
                          onClick={() => setPage(page - 1)}
                        >
                          Previous
                        </Button>
  
                        <span className="text-sm">
                          Page {page} of {totalPages}
                        </span>
  
                        <Button
                          disabled={page === totalPages}
                          onClick={() => setPage(page + 1)}
                        >
                          Next
                        </Button>
                      </div>}
                    </CardContent>
                </TabsContent>

              </Card>

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

                    {reviews.map((review, index) => {

                      return (
                        <div
                          key={index}
                          className="flex gap-4 p-4 border rounded-lg"
                        >
                          {/* Avatar */}
                          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gray-200 text-gray-700 font-semibold">
                            {getFirstLetter(review.contractorName, "C")}
                          </div>

                          <div className="flex-1 space-y-2">
                            {/* Name + Date */}
                            <div className="flex justify-between items-center">
                              <p className="font-medium">
                                {review.contractorName ?? "Contractor"}
                              </p>

                              <span className="text-xs text-muted-foreground">
                                {new Date(review.createdAt).toLocaleDateString()}
                              </span>
                            </div>

                            {/* Rating + Stars */}
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium">
                                {review.rating}/5
                              </span>

                              <div className="flex items-center gap-1">
                                {Array.from({ length: 5 }).map((_, i) => (
                                  <Star
                                    key={i}
                                    className={cn(
                                      "w-4 h-4",
                                      i < review.rating
                                        ? "text-yellow-400 fill-yellow-400"
                                        : "text-muted-foreground"
                                    )}
                                  />
                                ))}
                              </div>
                            </div>

                            {/* Comment */}
                            {review.comment && (
                              <p className="text-sm text-muted-foreground">
                                {review.comment}
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}

                  </div>
                </CardContent>
              </Card>
            </TabsContent>

          </Tabs>
        )}
      </main>

    </div>
  );
}
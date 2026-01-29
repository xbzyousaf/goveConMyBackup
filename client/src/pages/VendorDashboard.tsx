import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/Header";
import { VendorProfileForm } from "@/components/VendorProfileForm";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { Building, MapPin, DollarSign, Clock, Star, Edit, Plus, CheckCircle, AlertCircle, Users, TrendingUp } from "lucide-react";
import { useLocation } from "wouter";

export default function VendorDashboard() {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  // Fetch vendor profile
  const { data: vendorProfile, isLoading: profileLoading } = useQuery({
    queryKey: ["/api/vendor-profile"],
    retry: false,
  });

  // Mock data for service requests and stats
  const mockStats = {
    totalRequests: 24,
    completedRequests: 18,
    averageRating: 4.8,
    monthlyEarnings: 8500,
  };

  const mockRequests = [
    {
      id: "1",
      title: "Federal Contract Compliance Review",
      status: "in_progress",
      contractor: "DefenseTech Solutions",
      budget: "$2,500",
      deadline: "2024-01-15",
    },
    {
      id: "2", 
      title: "FISMA Security Assessment",
      status: "pending",
      contractor: "GovTech Innovations",
      budget: "$3,200",
      deadline: "2024-01-20",
    },
  ];

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
                    <p className="text-xs text-muted-foreground">+12% from last month</p>
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
                      {Math.round((mockStats.completedRequests / mockStats.totalRequests) * 100)}% completion rate
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
                    <p className="text-xs text-muted-foreground">+8% from last month</p>
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
                  <div className="space-y-4">
                    {mockRequests.map((request, index) => (
                      <div key={request.id} className="flex items-center justify-between p-4 border rounded-lg" data-testid={`request-item-${index}`}>
                        <div className="space-y-1">
                          <h4 className="font-medium" data-testid={`request-title-${index}`}>{request.title}</h4>
                          <p className="text-sm text-muted-foreground" data-testid={`request-contractor-${index}`}>
                            {request.contractor} • Budget: {request.budget}
                          </p>
                        </div>
                        <div className="text-right space-y-1">
                          <Badge 
                            variant={request.status === 'in_progress' ? 'default' : 'secondary'}
                            data-testid={`request-status-${index}`}
                          >
                            {request.status.replace('_', ' ')}
                          </Badge>
                          <p className="text-sm text-muted-foreground" data-testid={`request-deadline-${index}`}>
                            Due: {request.deadline}
                          </p>
                        </div>
                      </div>
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
                <CardHeader>
                  <CardTitle>Service Requests</CardTitle>
                  <CardDescription>Manage your active and completed service requests</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-12 text-muted-foreground">
                    <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>Service request management coming soon...</p>
                  </div>
                </CardContent>
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
                  <div className="text-center py-12 text-muted-foreground">
                    <Star className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>Reviews and ratings system coming soon...</p>
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
import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Link, useLocation } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Header } from "@/components/Header";
import {
  Target,
  TrendingUp,
  Briefcase,
  Lightbulb,
  Rocket,
  BookOpen,
  Users,
  Award,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  FileText,
  User,
  DollarSign,
  CalendarDays,
  Check,
  X,
  CheckCircle,
  MessageSquare,
  Star,
} from "lucide-react";
import { ServiceRequest } from "@shared/schema";
import { cn } from "@/lib/utils";
import { useMessages } from "@/components/ui/MessageContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@radix-ui/react-tabs";

interface UserMaturityProfile {
  id: string;
  userId: string;
  maturityStage: 'startup' | 'growth' | 'scale';
  readinessScore: number;
  currentFocus: 'business_structure' | 'business_strategy' | 'execution';
  businessStructureProgress: number | null;
  businessStrategyProgress: number | null;
  executionProgress: number | null;
  subscriptionTier: 'freemium' | 'startup' | 'growth' | 'scale';
  assessmentData: any;
  createdAt: string;
  updatedAt: string;
}

const STAGE_INFO = {
  startup: {
    label: "Startup",
    description: "Building foundation and establishing compliance",
    color: "bg-primary",
    icon: Lightbulb,
  },
  growth: {
    label: "Growth",
    description: "Expanding capabilities and winning contracts",
    color: "bg-accent",
    icon: TrendingUp,
  },
  scale: {
    label: "Scale",
    description: "Optimizing operations and strategic positioning",
    color: "bg-primary",
    icon: Rocket,
  },
};

const PROCESS_INFO = {
  business_structure: {
    label: "Business Structure",
    description: "Foundation, compliance, and certifications",
    icon: Briefcase,
  },
  business_strategy: {
    label: "Business Strategy",
    description: "Market positioning and growth planning",
    icon: Target,
  },
  execution: {
    label: "Execution",
    description: "Capture, proposal, and delivery excellence",
    icon: CheckCircle2,
  },
};

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isResetting, setIsResetting] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{
    id: string;
    status: "in_progress" | "cancelled" | "completed";
  } | null>(null);
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
    onSuccess: (updatedRequest, variables) => {
      setConfirmAction(null);
      toast({
        title: "Service Request Update",
        description: "Service Request Updated Sucessfuly",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/service-requests"] });
        if (variables.status === "completed") {
      setReviewModal({
        serviceRequestId: updatedRequest.id,
        revieweeId: updatedRequest.vendorId,
      });
    }
    },
  });
  const [reviewModal, setReviewModal] = useState<{
    serviceRequestId: string;
    revieweeId: string;
  } | null>(null);
  const hasReviewed = (
    serviceRequestId: string,
    userId: string
  ): boolean => {
    return reviews.some(
      (review) =>
        review.serviceRequestId === serviceRequestId &&
        review.reviewerId === userId
    );
  };

  
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const { data: profile, isLoading, isError, error } = useQuery<UserMaturityProfile>({
    queryKey: ['/api/maturity-profile'],
    retry: false,
  });
  const { openConversation } = useMessages();
  
  const { data: serviceRequests = [] } = useQuery<ServiceRequest[]>({
    queryKey: ["/api/service-requests"],
  });
  const submitReview = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          serviceRequestId: reviewModal?.serviceRequestId,
          rating,
          comment,
        }),
      });
  
      if (!res.ok) throw new Error("Failed to submit review");
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Review Submitted",
        description: "Thank you for your feedback.",
      });
  
      setReviewModal(null);
      setRating(0);
      setComment("");
      queryClient.invalidateQueries();
    },
  });
  const {
  data: user,
  isLoading: isUserLoading,
} = useQuery<any>({
  queryKey: ['/api/auth/current-user'],
});

    // AUTH + ONBOARDING GUARD
  if (!user) {
    setLocation("/login");
    return null;
  }

  // contractors must complete onboarding
  if (user.userType === "contractor" && !user.hasCompletedOnboarding) {
    setLocation("/onboarding");
    return null;
  }
  const currentUserId = user.id;

  const { data: reviews = [] } = useQuery<{
    rating: number;
  }[]>({
    queryKey: ["/api/contractor", user?.id, "reviews"],
    enabled: !!user?.id,
    queryFn: async () => {
      const res = await fetch(`/api/contractor/${user!.id}/reviews`);
      if (!res.ok) throw new Error("Failed to fetch reviews");
      return res.json();
    },
  });
  const handleResetAssessment = async () => {
    setIsResetting(true);
    try {
      await apiRequest("DELETE", "/api/reset-assessment", {});
      
      // Clear all cached data
      queryClient.clear();
      
      toast({
        title: "Assessment Reset",
        description: "Your assessment data has been cleared. Starting fresh!",
      });
      
      // Redirect to assessment page
      setLocation("/assessment");
    } catch (error: any) {
      console.error("Reset error:", error);
      toast({
        title: "Reset Failed",
        description: error.message || "Failed to reset assessment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsResetting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" data-testid="spinner-loading"></div>
          <p className="text-muted-foreground">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  // Check if error is a 404 (no profile) vs actual error
  const is404 = isError && error && (error as any).message?.includes("404");

  // Show error state for non-404 errors
  if (isError && !is404) {
    return (
      <div>
        <Header />
      <div className="flex flex-col items-center justify-center h-full p-8">
        <div className="max-w-md text-center space-y-4">
          <AlertTriangle className="w-16 h-16 mx-auto text-destructive" data-testid="icon-error" />
          <h2 className="text-2xl font-bold">Unable to Load Dashboard</h2>
          <p className="text-muted-foreground">
            We encountered an error loading your profile. Please try refreshing the page.
          </p>
          <Button onClick={() => window.location.reload()} data-testid="button-reload">
            Reload Page
          </Button>
        </div>
      </div>
      </div>
    );
  }
  
  // Show empty state only if no profile exists AND it's a 404
  if (profile?.assessmentData?.status === "not_started") {
    return (
      <div>
        <Header />
      <div className="flex flex-col items-center justify-center h-full p-8">
        <div className="max-w-md text-center space-y-4">
          <Award className="w-16 h-16 mx-auto text-muted-foreground" data-testid="icon-welcome" />
          <h2 className="text-2xl font-bold">Welcome to <span className="gradient-text">GovScale Alliance</span></h2>
          <p className="text-muted-foreground">
            Take our proven assessment to receive a data-driven maturity analysis and customized growth roadmap with measurable milestones.
          </p>
          <div className="flex items-center justify-center gap-4">
          <Link href="/assessment" data-testid="link-start-assessment">
            <Button size="lg" data-testid="button-start-assessment">
              Start Your Assessment <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
          <Link href="/skip-assessment">
            <Button variant="outline" size="lg">
              Skip Your Assessment
            </Button>
          </Link>

          </div>
        </div>
      </div>
      </div>
    );
  }

  // Type guard: At this point profile must exist
  if (!profile) {
    return null;
  }

  const stageInfo = STAGE_INFO[profile.maturityStage];
  const StageIcon = stageInfo.icon;

  return (
    <div className="h-screen flex flex-col">
      <Header />
      <div className="flex-1 overflow-auto">
        <div className="max-w-6xl mx-auto p-6 space-y-6">
          {/* Welcome Section */}
          <div className="space-y-2">
            <h1 className="text-3xl font-bold" data-testid="text-dashboard-title">
              Welcome back, {user?.firstName || 'Contractor'}!
            </h1>
            <p className="text-muted-foreground">
              Here's your personalized GovCon growth roadmap
            </p>
          </div>

        {/* Maturity Stage Card */}
        <Card className="border-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <CardTitle className="text-2xl flex items-center gap-2">
                  <StageIcon className="h-6 w-6" />
                  Your Maturity Stage
                </CardTitle>
                <CardDescription>
                  Based on your AI assessment
                </CardDescription>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-2">
                  <Badge className={`${stageInfo.color} text-white`} data-testid="badge-maturity-stage">
                    {stageInfo.label}
                  </Badge>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">{stageInfo.description}</p>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="font-medium">Readiness Score</span>
                <span data-testid="text-readiness-score">{profile.readinessScore}/100</span>
              </div>
              <Progress value={profile.readinessScore} className="h-3" data-testid="progress-readiness" />
            </div>
            
            {/* Retake Assessment Button */}
            <div className="pt-2 border-t flex items-center justify-between">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" size="sm" disabled={isResetting} data-testid="button-retake-assessment">
                    <RotateCcw className="mr-2 h-4 w-4" />
                    {isResetting ? "Resetting..." : "Retake Assessment"}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Reset Your Assessment?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will clear your current maturity profile, assessment history, and all journey progress. 
                      You'll be able to take the assessment again with different answers to see how your maturity stage changes.
                      This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel data-testid="button-cancel-reset">Cancel</AlertDialogCancel>
                    <AlertDialogAction 
                      onClick={handleResetAssessment}
                      data-testid="button-confirm-reset"
                    >
                      Reset Assessment
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
              {profile.assessmentData?.status !== "completed" && (
                <Button size="sm" onClick={() => setLocation("/assessment")}>
                  Resume Assessment
                </Button>
              )}

            </div>
          </CardContent>
        </Card>

        {/* Three Core Processes */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Your Growth Framework</h2>
          <div className="grid gap-4 md:grid-cols-3">
            {(Object.entries(PROCESS_INFO) as [keyof typeof PROCESS_INFO, typeof PROCESS_INFO[keyof typeof PROCESS_INFO]][]).map(([key, info]) => {
              const Icon = info.icon;
              const progress = key === 'business_structure' 
                ? profile.businessStructureProgress 
                : key === 'business_strategy'
                ? profile.businessStrategyProgress
                : profile.executionProgress;
              
              const isCurrent = profile.currentFocus === key;

              return (
                <Card key={key} className={isCurrent ? "border-2 border-primary" : ""}>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Icon className="h-5 w-5" />
                      {info.label}
                      {isCurrent && (
                        <Badge variant="default" className="ml-auto" data-testid={`badge-current-${key}`}>
                          Current Focus
                        </Badge>
                      )}
                    </CardTitle>
                    <CardDescription className="text-sm">
                      {info.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2 mb-4">
                      <div className="flex justify-between text-sm">
                        <span>Progress</span>
                        <span data-testid={`text-progress-${key}`}>{progress || 0}%</span>
                      </div>
                      <Progress value={progress || 0} data-testid={`progress-${key}`} />
                    </div>
                    <Link href={`/process/${key}`} data-testid={`link-view-${key}`}>
                      <Button variant="outline" className="w-full" data-testid={`button-view-${key}`}>
                        View Guidance <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Quick Actions */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card className="hover-elevate cursor-pointer opacity-50" data-testid="card-knowledge-base">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <BookOpen className="h-4 w-4" />
                  Knowledge Base
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Coming soon
                </p>
              </CardContent>
            </Card>

            <Link href="/vendors" data-testid="link-find-vendors">
              <Card className="hover-elevate cursor-pointer" data-testid="card-find-vendors">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Find Vendors
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Connect with vetted service providers
                  </p>
                </CardContent>
              </Card>
            </Link>

            <Link href="/assessment" data-testid="link-retake-assessment">
              <Card className="hover-elevate cursor-pointer" data-testid="card-retake-assessment">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Award className="h-4 w-4" />
                    Retake Assessment
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Update your maturity profile
                  </p><br />
                </CardContent>
              </Card>
            </Link>

            <Card className="hover-elevate cursor-pointer opacity-50" data-testid="card-upgrade-plan">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Rocket className="h-4 w-4" />
                  Upgrade Plan
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Coming soon
                </p>
              </CardContent>
            </Card>
            <Tabs defaultValue="recent" className="space-y-6 col-span-full w-full">

              {/* Full Width Tabs */}
              <TabsList
                  className="w-full grid grid-cols-4"
                  data-testid="tabs-dashboard"
                >
                <TabsTrigger value="recent">
                  Recent Services
                </TabsTrigger>

                <TabsTrigger value="reviews">
                  Reviews
                </TabsTrigger>
              </TabsList>


              {/* ✅ Recent Services FULL ROW */}
              <TabsContent value="recent" className="space-y-6 w-full">

                <Card data-testid="card-recent-requests"
                          className="col-span-full">
                          <CardHeader>
                            <CardTitle>Recent Service Requests</CardTitle>
                            <CardDescription>Latest requests to vendors</CardDescription>
                          </CardHeader>
                          <CardContent className="w-full">
                            {serviceRequests.length === 0 && (
                              <p className="text-sm text-muted-foreground text-center">
                                No recent service requests
                              </p>
                            )}

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
                              {serviceRequests.map((request) => (
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
                                          <span className="text-muted-foreground">Vendor:</span>
                                        </div>
                                        <div>
                                          <span className="font-medium">
                                          {request.vendor?.firstName
                                            ? `${request.vendor.firstName} ${request.vendor.lastName ?? ""}`
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

                                        

                                        {/* Cancel */}
                                        <button
                                          disabled={request.status === "cancelled" || request.status === "completed"}
                                          className={cn(
                                            "p-2 rounded-lg transition-colors",
                                            request.status === "cancelled" || request.status === "completed"
                                              ? "bg-gray-100 cursor-not-allowed opacity-50"
                                              : "bg-red-100 hover:bg-red-200"
                                          )}
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
                                          disabled={request.status !== "in_progress"}
                                          className={cn(
                                            "p-2 rounded-lg transition-colors",
                                            request.status !== "in_progress"
                                              ? "bg-gray-100 cursor-not-allowed opacity-50"
                                              : "bg-green-100 hover:bg-green-200"
                                          )}
                                          onClick={() => {
                                            if (request.status !== "in_progress") return;
                                            setConfirmAction({
                                              id: request.id,
                                              status: "completed",
                                            });
                                          }}

                                        >
                                          <CheckCircle className="w-4 h-4 text-green-600" />
                                        </button>
                                        <button
                                          disabled={
                                            request.status !== "completed" ||
                                            hasReviewed(request.id, currentUserId)
                                          }
                                          className={cn(
                                            "p-2 rounded-lg transition-colors",
                                            request.status !== "completed" ||
                                              hasReviewed(request.id, currentUserId)
                                              ? "bg-gray-100 cursor-not-allowed opacity-50"
                                              : "bg-yellow-100 hover:bg-yellow-200"
                                          )}
                                          onClick={() => {

                                            if (hasReviewed(request.id, currentUserId)) return;

                                            setReviewModal({
                                              serviceRequestId: request.id,

                                              // FIX reviewee logic also (important)
                                              revieweeId:
                                                request.vendorId === currentUserId
                                                  ? request.contractorId
                                                  : request.vendorId,
                                            });

                                            setRating(0);
                                            setComment("");

                                          }}
                                        >
                                          <Star className="w-4 h-4 text-yellow-600" />
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



              {/* ✅ Reviews FULL ROW */}
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
                      const firstLetter = review.vendorName
                        ? review.vendorName.charAt(0).toUpperCase()
                        : "C";

                      return (
                        <div
                          key={index}
                          className="flex gap-4 p-4 border rounded-lg"
                        >
                          {/* Avatar */}
                          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gray-200 text-gray-700 font-semibold">
                            {firstLetter}
                          </div>

                          <div className="flex-1 space-y-2">
                            {/* Name + Date */}
                            <div className="flex justify-between items-center">
                              <p className="font-medium">
                                {review.vendorName ?? "Contractor"}
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

            
          </div>
        </div>

          {/* Recommended Next Steps (from AI assessment) */}
          {profile.assessmentData?.recommendations && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lightbulb className="h-5 w-5" />
                  Your Personalized Recommendations
                </CardTitle>
                <CardDescription>
                  Based on your assessment results
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {Array.isArray(profile.assessmentData.recommendations) 
                    ? profile.assessmentData.recommendations.map((rec: string, i: number) => (
                        <li key={i} className="flex gap-3">
                          <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                          <span className="text-sm">{rec}</span>
                        </li>
                      ))
                    : <p className="text-sm text-muted-foreground">No recommendations available</p>
                  }
                </ul>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
      
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
                onClick={async () => {
                  updateStatus.mutate(
                    {
                      id: confirmAction.id,
                      status: confirmAction.status,
                    }
                  );
                }}
              >
                Confirm
              </Button>
            </div>
          </div>
        </div>
      )}
      {reviewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setReviewModal(null)}
          />

          <div className="relative bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">
              Leave Feedback
            </h3>

            {/* Star Rating */}
            <div className="flex items-center gap-2 mb-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  onClick={() => setRating(i + 1)}
                  className={`w-6 h-6 cursor-pointer ${
                    i < rating
                      ? "text-yellow-400 fill-current"
                      : "text-muted-foreground"
                  }`}
                />
              ))}
            </div>

            {/* Comment */}
            <textarea
              className="w-full border rounded-lg p-2 text-sm mb-4"
              rows={4}
              placeholder="Write your feedback..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />

            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setReviewModal(null)}
              >
                Cancel
              </Button>

              <Button
                disabled={rating === 0 || submitReview.isPending}
                onClick={() => submitReview.mutate()}
              >
                Submit Review
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
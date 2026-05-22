import { useEffect, useState } from "react";
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
import { Briefcase, Lightbulb, Rocket, BookOpen, Users, Award, ArrowRight, CheckCircle2, AlertTriangle, RotateCcw, Star, ChevronDown, Loader2} from "lucide-react";
import { Service, ServiceRequest } from "@shared/schema";
import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import WalletPage from "./vendor/WalletPage";
import { PRIORITY_STATUSES, REQUEST_STATUSES_LABELS, ServiceRequestStatus } from "../../../constants/serviceRequest";
import { ServiceRequestCardCompact } from "@/components/service-requests/ServiceRequestCardCompact";
import { ServiceCardCompact } from "@/components/Services/ServiceCardCompact";
import { getFirstLetter } from "@/utility/textUtils";
import { BlurGate } from "../components/gates/BlurGate";
import { UserMaturityProfile } from "@shared/types/maturity-profile"; 
import { STAGE_INFO, PROCESS_INFO } from "../../../constants/maturity"
import { useGateStatus } from "../hooks/useGateStatus";

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isResetting, setIsResetting] = useState(false);
  const { gateClosed } = useGateStatus();
  const [confirmAction, setConfirmAction] = useState<{
    id: string;
    status: "in_progress" | "cancelled" | "completed";
  } | null>(null);
  const [loadingProcess, setLoadingProcess] = useState<string | null>(null);
  const [activeDashboardTab, setActiveDashboardTab] = useState<"maturity" | "actions">("actions");
  const [isMaturityCollapsed, setIsMaturityCollapsed] = useState(false);
  const [isStarting, setIsStarting] = useState(false);

  const handleStartAssessment = async () => {
    setIsStarting(true);

    // allow loader to render
    await new Promise((r) => setTimeout(r, 300));

    setLocation('/assessment');
  };
  const [isNavigating, setIsNavigating] = useState<null | "vendors" | "billing">(null);
  const [isTabLoading, setIsTabLoading] = useState(false);
  const [isRetaking, setIsRetaking] = useState(false);
  const [rating, setRating] = useState(0);
  const { data: profile, isLoading, isError, error } = useQuery<UserMaturityProfile>({
    queryKey: ['/api/maturity-profile'],
    retry: false,
  });
  // const isFreeUser = profile?.subscriptionTier !== "pilot";
  const isPaidUser = profile?.subscriptionTier === "pilot";
  const isFreeUser = !isPaidUser;


  console.log("Maturity Profile:", isFreeUser);
  const handleNavigate = (type: "vendors" | "billing") => {
  if (isNavigating) return;

  // 🔴 BLOCK vendors for free users
  if (type === "vendors" && isFreeUser) {
    toast({
      title: "Upgrade Required",
      description: "Unlock vendor access with PROOF Pilot ($49.95)",
      variant: "destructive",
    });
    return;
  }

  setIsNavigating(type);

  setTimeout(() => {
    setLocation(type === "vendors" ? "/vendors" : "/billing");
  }, 400);
};
  const handleClick = () => {
    if (isRetaking) return;

    setIsRetaking(true);

    // small delay so loader is visible before navigation
    setTimeout(() => {
      setLocation("/assessment");
    }, 300);
  };
 
    type StatusFilter = "priority" | "all" | ServiceRequestStatus;
  const [statusFilter, setStatusFilter] =
  useState<StatusFilter>("priority");
    const [search, setSearch] = useState("");
useEffect(() => {
  setPage(1);
}, [statusFilter, search]);
    const applyFilter = (requests: ServiceRequest[]) => {
      return requests.filter((request) => {
        const statusMatch =
          statusFilter === "all" ||
          (statusFilter === "priority" && PRIORITY_STATUSES.includes(request.status)) ||
          request.status === statusFilter;
        const searchMatch =
          search === "" ||
          request.title?.toLowerCase().includes(search.toLowerCase()) ||
          request.description?.toLowerCase().includes(search.toLowerCase()) ||
          request.service?.name?.toLowerCase().includes(search.toLowerCase()) ||
          request.service?.category?.toLowerCase().includes(search.toLowerCase());

        return statusMatch && searchMatch;
      });
    };
     const [page, setPage] = useState(1);
    const PAGE_SIZE = 5;
    
     const { data } = useQuery<{
      page: number;
      limit: number;
      data: ServiceRequest[];
    }>({
      queryKey: [`/api/service-requests?page=${page}&limit=${PAGE_SIZE}&status=${statusFilter}`],
    });
    const { data: services = [] } = useQuery<Service[]>({
      queryKey: ['/api/recommended-services'],
    });
    console.log("Recommended services:", services);
    const serviceRequests = data?.data ?? [];
    const servicesData = services;
    const filteredRequests = applyFilter(serviceRequests);
    const paginatedRequests = filteredRequests;
    const [activeTab, setActiveTab] = useState("recent");
    const totalPages = Math.ceil(data?.total / PAGE_SIZE);
  
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
useEffect(() => {
  if (!user || user.userType !== "contractor") return;

  const tier = profile?.subscriptionTier;

  // allowed users
  if ( tier === "pilot") {
    return;
  }

  // no subscription selected
  if (gateClosed && tier === "beta") {
    setLocation("/billing");
  }

}, [user, profile]);

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
    if (gateClosed && profile?.subscriptionTier === "beta") {
      setLocation("/billing");
    }
    return (
      <div>
        <Header />
      <div className="flex flex-col items-center justify-center h-full p-8">
        <div className="max-w-md text-center space-y-4">
          <Award className="w-16 h-16 mx-auto text-muted-foreground" data-testid="icon-welcome" />
          <h2 className="text-2xl font-bold">Welcome to <span className="gradient-text">PROOF</span></h2>
          <p className="text-muted-foreground">
            Take our proven assessment to receive a data-driven maturity analysis and customized growth roadmap with measurable milestones.
          </p>
          <div className="flex items-center justify-center gap-4">
          <Button
            size="lg"
            onClick={handleStartAssessment}
            disabled={isStarting}
            data-testid="button-start-assessment"
          >
            {isStarting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Starting...
              </>
            ) : (
              <>
                Start Your Assessment
                <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
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
              Here's your personalized PROOF growth roadmap
            </p>
          </div>

        {/* Three Core Processes */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Your Growth Framework</h2>
          <BlurGate isLocked={isFreeUser } onUnlock={() => setLocation("/billing")} >
          <div className="grid gap-4 md:grid-cols-3">
            {(Object.entries(PROCESS_INFO) as [keyof typeof PROCESS_INFO, typeof PROCESS_INFO[keyof typeof PROCESS_INFO]][]).map(([key, info]) => {
              const Icon = info.icon;
              const progress = key === 'business_structure' 
                ? profile.businessStructureProgress 
                : key === 'business_strategy'
                ? profile.businessStrategyProgress
                : profile.executionProgress;
              
              const isCurrent = profile.currentFocus === key;
              const colorStyles =
                key === "business_strategy"
                  ? {
                      border: "border-accent",
                      iconBg: "bg-accent text-white",
                      button: "bg-accent hover:opacity-90 text-white",
                      progress: "[&>div]:bg-accent"
                    }
                  : key === "business_structure"
                  ? {
                      border: "border-primary",
                      iconBg: "bg-primary text-white",
                      button: "bg-primary hover:opacity-90 text-white",
                      progress: "[&>div]:bg-primary"
                    }
                  : {
                      border: "border-gold",
                      iconBg: "bg-gold text-white",
                      button: "bg-gold hover:opacity-90 text-white",
                      progress: "[&>div]:bg-gold"
                    };
              return (
                 <Card key={key} className={`border-2 ${colorStyles.border}`}>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <div className={`p-2 rounded-lg ${colorStyles.iconBg}`}>
                        <Icon className="h-5 w-5" />
                      </div>
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
                      <Progress
                        value={progress || 0}
                        className={`h-3 ${colorStyles.progress}`}
                        data-testid={`progress-${key}`}
                      />
                    </div>
                    
                      <Button
                        className={`w-full ${colorStyles.button} border-none`}
                        data-testid={`button-view-${key}`}
                        disabled={loadingProcess === key}
                        onClick={() => {
                          setLoadingProcess(key);

                          // 👇 allow React to render loader first
                          setTimeout(() => {
                            setLocation(`/process/${key}`);
                          }, 800); // 500–1000ms is enough
                        }}
                      >
                      {loadingProcess === key ? (
                        <span className="flex items-center justify-center gap-2">
                          <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>
                          Loading...
                        </span>
                      ) : (
                        <>
                          View / Update Checklist<ArrowRight className="ml-2 h-4 w-4" />
                        </>
                      )}
                      </Button>

                  </CardContent>
                </Card>
              );
            })}
          </div>
          </BlurGate>
        </div>

        {/* Maturity Stage Card */}
          <Card className="border-2 border-primary rounded-xl">

            {/* TAB BUTTONS */}
            <CardHeader className="pb-4">

              <div className="flex gap-4">
                <Button
                  variant={activeDashboardTab === "actions" ? "default" : "outline"}
                  className="flex-1 text-base"
                  onClick={() => {
                    setIsTabLoading(true);

                    setTimeout(() => {
                      setActiveDashboardTab("actions");
                      setIsMaturityCollapsed(false);
                      setIsTabLoading(false);
                    }, 400);
                  }}
                >
                  Quick Actions
                </Button>
                <Button
                  variant={activeDashboardTab === "maturity" ? "default" : "outline"}
                  className="flex-1 text-base"
                  onClick={() => {
                    setIsTabLoading(true);

                    setTimeout(() => {
                      setActiveDashboardTab("maturity");
                      setIsMaturityCollapsed(false);
                      setIsTabLoading(false);
                    }, 400);
                  }}
                >
                  Your Maturity Stage
                </Button>
              </div>

            </CardHeader>

            <div className="border-t border-primary/40 relative">
              {/* Collapse Arrow */}
              <button
                className="absolute right-4 -top-3 bg-white px-1"
                onClick={() => setIsMaturityCollapsed(!isMaturityCollapsed)}
              >
                <ChevronDown
                  className={cn(
                    "h-6 w-6 text-primary transition-transform",
                    isMaturityCollapsed && "rotate-180"
                  )}
                />
              </button>

            </div>

          {!isMaturityCollapsed && (
  <CardContent className="pt-6">

    {isTabLoading ? (
      <div className="flex justify-center items-center py-10">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    ) : (
      <>
        {/* ================= MATURITY TAB ================= */}
        {activeDashboardTab === "maturity" && (
          <div className="space-y-4">

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-primary text-white">
                    <StageIcon className="h-5 w-5" />
                  </div>
                  <span className="text-primary">Your Maturity Stage</span>
                </h2>
                <p className="text-sm text-primary font-semibold">
                  Based on your AI assessment
                </p>
              </div>

              <Badge className={`bg-primary text-white`}>
                {stageInfo.label}
              </Badge>
            </div>

            <p className="text-muted-foreground">
              {stageInfo.description}
            </p>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="font-medium">Readiness Score</span>
                <span>{profile.readinessScore}/100</span>
              </div>

              <Progress value={profile.readinessScore} className="h-3" />
            </div>

            <div className="pt-3 border-t flex items-center justify-between">

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={isResetting}
                  >
                    {isResetting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Resetting...
                      </>
                    ) : (
                      <>
                        <RotateCcw className="mr-2 h-4 w-4" />
                        Retake Assessment
                      </>
                    )}
                  </Button>
                </AlertDialogTrigger>

                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>
                      Reset Your Assessment?
                    </AlertDialogTitle>

                    <AlertDialogDescription>
                      This will clear your current maturity profile.
                    </AlertDialogDescription>
                  </AlertDialogHeader>

                  <AlertDialogFooter>
                    <AlertDialogCancel>
                      Cancel
                    </AlertDialogCancel>

                    <AlertDialogAction
                      onClick={handleResetAssessment}
                      disabled={isResetting}
                    >
                      {isResetting ? "Resetting..." : "Reset Assessment"}
                    </AlertDialogAction>

                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>

              {profile.assessmentData?.status !== "completed" && (
                <Button
                  size="sm"
                  onClick={() => setLocation("/assessment")}
                >
                  Resume Assessment
                </Button>
              )}

            </div>

          </div>
        )}

        {/* ================= QUICK ACTIONS TAB ================= */}
        {activeDashboardTab === "actions" && (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">

            {/* Knowledge Base */}
            <Card className="opacity-50 border-2 border-blue-500">
              <CardHeader>
                <CardTitle className="text-base flex gap-2">
                  <div className="p-2 rounded-lg bg-primary text-white">
                    <BookOpen className="h-4 w-4" />
                  </div>
                  <div className="mt-1">Knowledge Base</div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">Coming soon</p>
              </CardContent>
            </Card>

            {/* Find Vendors */}
            <Card data-testid="card-find-vendors"
              onClick={() => handleNavigate("vendors")}
              className={`cursor-pointer border-2 border-accent transition-all duration-200
                ${isNavigating === "vendors"
                  ? "opacity-70 pointer-events-none"
                  : "hover:bg-accent hover:text-white hover-elevate"}
                  `}
            >
                  <BlurGate isLocked={isFreeUser} onUnlock={() => setLocation("/billing")} >
              <CardHeader>
                <CardTitle className="text-base flex gap-2 items-center">
                  <div className="p-2 rounded-lg bg-accent text-white outline">
                    {isNavigating === "vendors" ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Users className="h-4 w-4" />
                    )}
                  </div>
                  <div className="mt-1">
                    {isNavigating === "vendors" ? "Opening..." : "Find Vendors"}
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">
                  {isNavigating === "vendors"
                    ? "Redirecting..."
                    : "Connect with vetted providers"}
                </p>
              </CardContent>
              </BlurGate>
            </Card>
            

            {/* Retake Card */}
            <Card
              data-testid="card-retake-assessment"
              onClick={handleClick}
              className={`cursor-pointer border-2 border-gold transition-all duration-200
                ${isRetaking
                  ? "opacity-70 pointer-events-none"
                  : "hover:bg-gold hover:text-white hover-elevate"}
              `}
            >
              <CardHeader>
                <CardTitle className="text-base flex gap-2 items-center">
                  <div className="p-2 rounded-lg bg-gold text-white outline">
                    {isRetaking ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Award className="h-4 w-4" />
                    )}
                  </div>
                  <div className="mt-1">
                    {isRetaking ? "Loading..." : "Retake Assessment"}
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">
                  {isRetaking
                    ? "Redirecting to assessment..."
                    : "Update your maturity profile by re-taking assessment"}
                </p>
              </CardContent>
            </Card>

            {/* Upgrade Plan */}
            <Card
              data-testid="card-upgrade-plan"
              onClick={() => handleNavigate("billing")}
              className={`cursor-pointer border-2 border-primary transition-all duration-200
                ${isNavigating === "billing"
                  ? "opacity-70 pointer-events-none"
                  : "hover:bg-primary hover:text-white"}
              `}
            >
              <CardHeader>
                <CardTitle className="text-base flex gap-2 items-center">
                  <div className="p-2 rounded-lg bg-primary text-white outline">
                    {isNavigating === "billing" ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Rocket className="h-4 w-4" />
                    )}
                  </div>
                  <div className="mt-1">
                    {isNavigating === "billing" ? "Opening..." : "Upgrade Plan"}
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm mb-3">
                  {isNavigating === "billing"
                    ? "Redirecting to billing..."
                    : "Unlock full marketplace access & priority support"}
                </p>
              </CardContent>
            </Card>

          </div>
        )}
      </>
    )}
  </CardContent>
)}
          </Card>
        <div>
        {/* // Recmonded Services card */}
      <BlurGate isLocked={isFreeUser} onUnlock={() => setLocation("/billing")} >
          <Card data-testid="card-recent-requests"
            className="col-span-full border-2 border-accent">
            <CardHeader >
                <CardTitle className="text-base flex gap-2">
                  <div className="p-2 rounded-lg bg-accent text-white outline">
                        <Briefcase className="h-6 w-6" />
                  </div>
                  <CardTitle className="text-accent mt-1">Recommended Services</CardTitle>
                </CardTitle>
              <CardDescription className="font-semibold text-accent">Explore below these services are matched with your profile and interests</CardDescription>
                {servicesData.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center mt-2">
                    No recommended services yet. Complete your assessment or reload.
                  </p>
                )}
            </CardHeader>
            <CardContent className="w-full">


              <div className="grid grid-cols-1 md:grid-cols-1 gap-6 w-full">
                {/* <div className="grid grid-cols-1 gap-6 w-full">
                  {servicesData.map((service, index) => (
                    <ServiceCardCompact
                      key={index}
                      service={service}
                      detailsUrl={`/services/${service.id}/vendors`}
                    />
                  ))}
                </div> */}
                
                    <div className="grid grid-cols-1 gap-6 w-full">
                      {servicesData.map((service, index) => (
                        <ServiceCardCompact
                          key={index}
                          service={service}
                          detailsUrl={`/services/${service.id}/vendors`}
                        />
                      ))}
                    </div>

              </div>
            </CardContent>
          </Card>
                  </BlurGate>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">

            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6 col-span-full mt-4">
              <div className="flex items-center justify-between gap-4 mb-4 flex-wrap">

              {/* LEFT SIDE → Search + Status */}
              <div className="flex items-center gap-4 min-h-[40px]">
            {activeTab === "recent" && (
              <>
                <input
                  placeholder="Search requests..."
                  value={search}
                  onChange={(e) => {setSearch(e.target.value)}}
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
              </>
            )}
          </div>


              {/* RIGHT SIDE → Tabs */}
              <TabsList className="bg-muted py-1 px-1 rounded-sm inline-flex gap-4 justify-end">

                <TabsTrigger
                  value="recent"
                  className="px-3 py-1 rounded-sm data-[state=active]:bg-white data-[state=active]:text-black"
                >
                  Services Requests
                </TabsTrigger>

                <TabsTrigger
                  value="reviews"
                  className="px-3 py-1 rounded-sm data-[state=active]:bg-white data-[state=active]:text-black"
                >
                  Reviews
                </TabsTrigger>

                {/* <TabsTrigger
                  value="wallet"
                  className="px-3 py-1 rounded-sm data-[state=active]:bg-white data-[state=active]:text-black"
                >
                  Wallet
                </TabsTrigger> */}

              </TabsList>
            </div>
            
              {/* ✅ Recent all Services FULL ROW */}
              <TabsContent value="recent" className="">
<BlurGate isLocked={isFreeUser} onUnlock={() => setLocation("/billing")}>

                <Card data-testid="card-recent-requests"
                  className="col-span-full border-2 border-gold">
                  <CardHeader >
                     <CardTitle className="text-base color-orange flex gap-2">
                        <div className="p-2 rounded-lg bg-gold text-white outline">
                              <Briefcase className="h-6 w-6" />
                        </div>
                        <CardTitle className="text-gold mt-1">Service Requests</CardTitle>
                      </CardTitle>
                    <CardDescription className="font-semibold text-gold">All service requests to vendors</CardDescription>
                  </CardHeader>
                  <CardContent className="w-full">


                    <div className="grid grid-cols-1 md:grid-cols-1 gap-6 w-full">
                      <div className="grid grid-cols-1 gap-6 w-full">
                        {paginatedRequests.map((request, index) => (
                          <ServiceRequestCardCompact
                            key={index}
                            request={request}
                            userType="contractor"
                            detailsUrl={`/vendor/requests`}
                          />
                        ))}
                      </div>

                    </div>
                  {totalPages> 1 && 
                    <div className="flex justify-center gap-4 mt-4">

                      <Button className="bg-gold"
                        disabled={page === 1}
                        onClick={() => setPage(page - 1)}
                      >
                        Previous
                      </Button>

                      <span className="text-sm mt-2">
                        Page {page} of {totalPages}
                      </span>

                      <Button className="bg-gold"
                        disabled={page === totalPages}
                        onClick={() => setPage(page + 1)}
                      >
                        Next
                      </Button>

                    </div>
                  }
                  </CardContent>
                </Card>
                </BlurGate>

              </TabsContent>



              {/* ✅ Reviews FULL ROW */}
              <TabsContent value="reviews" className="col-span-12 space-y-6">
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
                      const firstLetter = getFirstLetter(review?.vendorName , "V");

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
                          </div>
                        </div>
                      );
                    })}

                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="wallet" className="space-y-6">
              <WalletPage/>
            </TabsContent>


            </Tabs>

            
          </div>
        </div>

          {/* Recommended Next Steps (from AI assessment) */}
          {/* {profile.assessmentData?.recommendations && (
            <Card className="border-2 border-accent">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-accent text-white outline">
                    <Lightbulb className="h-5 w-5" />
                  </div>
                  <div className="text-orange-500">
                    Your Personalized Recommendations
                  </div>
                </CardTitle>
                <CardDescription className="text-sm text-orange-500 font-semibold">
                  Based on your assessment results
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {Array.isArray(profile.assessmentData.recommendations) 
                    ? profile.assessmentData.recommendations.map((rec: string, i: number) => (
                        <li key={i} className="flex gap-3">
                          <CheckCircle2 className="h-5 w-5 text-orange-500 flex-shrink-0 mt-0.5" />
                          <span className="text-sm">{rec}</span>
                        </li>
                      ))
                    : <p className="text-sm text-muted-foreground">No recommendations available</p>
                  }
                </ul>
              </CardContent>
            </Card>
          )} */}
          {/* Gap Next Steps (from AI assessment) */}
          {profile.assessmentData?.gaps && (
  <Card className="border-2 border-primary">
    <CardHeader>
      <CardTitle className="flex items-center gap-2">
        <div className="p-2 rounded-lg bg-primary text-white outline">
          <Lightbulb className="h-5 w-5" />
        </div>
        <div className="text-primary">Your Identified Gaps</div>
      </CardTitle>

      <CardDescription className="text-sm text-primary font-semibold">
        Areas you need to improve
      </CardDescription>
    </CardHeader>

    <CardContent>
      <BlurGate
        isLocked={isFreeUser}
        onUnlock={() => setLocation("/billing")}
      >
        <ul className="space-y-4">
          {profile.assessmentData.gaps.map((gap: any, i: number) => (
            <li key={i} className="flex gap-3">
              <CheckCircle2 className="h-5 w-5 text-primary mt-1" />

              <div className="text-sm">
                <p className="font-semibold capitalize">
                  {gap.type.replace("_", " ")}
                </p>
                <p className="text-muted-foreground">
                  {gap.problem}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </BlurGate>
    </CardContent>
  </Card>
)}
        </div>
      </div>
      
    </div>
  );
}
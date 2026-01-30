import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
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
} from "lucide-react";

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

  const { data: profile, isLoading, isError, error } = useQuery<UserMaturityProfile>({
    queryKey: ['/api/maturity-profile'],
    retry: false,
  });

  const { data: user } = useQuery<any>({
    queryKey: ['/api/auth/current-user'],
  });
    // ⛔ AUTH + ONBOARDING GUARD
  if (!user) {
    setLocation("/login");
    return null;
  }

  // Only contractors must complete onboarding
  if (user.userType === "contractor" && !user.hasCompletedOnboarding) {
    setLocation("/onboarding");
    return null;
  }


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
  if (!profile && is404) {
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
            <div className="pt-2 border-t">
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
                    <div className="space-y-2 mb-2">
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
    </div>
  );
}
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useLocation } from "wouter";
import { queryClient } from "@/lib/queryClient";
import headerImg from "@/assets/onboarding/header.png";
import vendorProfileImg from "@/assets/onboarding/vendorProfile.png";
import vendorOverviewImg from "@/assets/onboarding/vendorOverview.png";
import vendorProfilesImg from "@/assets/onboarding/vendorProfiles.png";
import servicesRequestsImg from "@/assets/onboarding/servicesRequests.png";
import vendorReviewsImg from "@/assets/onboarding/vendorReviews.png";


export default function VendorOnboarding() {
  const [, setLocation] = useLocation();
  const [step, setStep] = useState(0);

  const steps = [
    {
      title: "Navigate Your Vendor Workspace",
      description:
        "Access key areas of the platform from the header—Marketplace, Services, Vendor Listings, Search, Profile Settings, and Secure Logout. This is your command center for daily activity.",
      image: headerImg,
    },
    {
      title: "Complete Your Profile",
      description:
        "Complete your personalized profile to showcase your profession, skills, about and services to potential clients.",
      image: vendorProfileImg,
    },
    {
      title: "Your Overview Stats",
      description:
        "View your overview stats, requests, completion rate, avg. rating, monthly earnings, track your services requests & status.",
      image: vendorOverviewImg,
    },
    {
      title: "View and edit your Vendor Profiles",
      description:
        "View and update your vendor profiles to keep your information current.",
      image: vendorProfilesImg,
    },
    {
      title: "View Your Services Requests",
      description:
        "View and manage your services requests and their status.",
      image: servicesRequestsImg,
    },
    {
      title: "View Vendor Reviews & Ratings",
      description:
        "View feedback from clients to improve your services and build credibility.",
      image: vendorReviewsImg,
    },
  ];

  const completeOnboarding = async () => {
    await fetch("/api/onboarding/complete", {
      method: "POST",
      credentials: "include",
    });

    await queryClient.invalidateQueries({
      queryKey: ["/api/auth/current-user"],
    });

    setLocation("/vendor-dashboard");
  };

  const current = steps[step];

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <Card className="max-w-2xl w-full">
        <CardHeader className="space-y-2">
          <Progress value={((step + 1) / steps.length) * 100} />
          <CardTitle className="text-2xl">{current.title}</CardTitle>
        </CardHeader>

        <CardContent className="space-y-6">
          <img
            src={current.image}
            alt={current.title}
            className="rounded-lg border"
          />

          <p className="text-sm text-muted-foreground">
            {current.description}
          </p>

          {/* NAVIGATION */}
          {step >= 0 && (
            <div className="flex justify-between">
              <Button
                variant="outline"
                disabled={step === 0}
                onClick={() => setStep(step - 1)}
              >
                Back
              </Button>

              {step === steps.length - 1 ? (
                <Button onClick={completeOnboarding}>
                  Go to Dashboard
                </Button>
              ) : (
                <Button onClick={() => setStep(step + 1)}>
                  Next
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

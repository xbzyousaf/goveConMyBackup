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
import vendorHeaderImg from "@/assets/onboarding/vendorHeader.png";
import vendorProfileImg from "@/assets/onboarding/vendorProfile.png";
import vendorPerformanceImg from "@/assets/onboarding/vendorPerformance.png";
// import vendorProfilesImg from "@/assets/onboarding/vendorProfiles.png";
import vendorServiceRequestsImg from "@/assets/onboarding/vendorServiceRequests.png";
import vendorReviewsImg from "@/assets/onboarding/vendorReviews.png";
import vendorPayoutsImg from "@/assets/onboarding/vendorPayouts.png";


export default function VendorOnboarding() {
  const [, setLocation] = useLocation();
  const [step, setStep] = useState(0);

  const steps = [
    {
      title: "Navigate Your Vendor Workspace",
      description:
        "Access key areas of the platform from the header—Marketplace, Services, Notification, Messages, Profile Settings, and Secure Logout.",
      image: vendorHeaderImg,
    },
    {
      title: "View & Edit Your Profile",
      description:
        "Complete your personalized profile to showcase your profession, skills, about and services to potential clients.",
      image: vendorProfileImg,
    },
    {
      title: "View Your Services Requests",
      description:
        "View and manage your services requests and their status.",
      image: vendorServiceRequestsImg,
    },
    {
      title: "View Vendor Reviews & Ratings",
      description:
        "View feedback from clients to improve your services and build credibility.",
      image: vendorReviewsImg,
    },
    {
      title: "View Vendor Performance",
      description:
        "View Vendor Performance, Score, Completion Rate, On-Time Delivery, Total Requests, Completed Jobs.",
      image: vendorPerformanceImg,
    },
    {
      title: "View Earnings & Connect Payout Methods",
      description:
        "View connected payout methods and earnings",
      image: vendorPayoutsImg,
    },
  ];

  const completeOnboarding = async () => {
    await fetch("/api/onboarding/complete", {
      method: "POST",
      credentials: "include",
    });

    queryClient.removeQueries({
      queryKey: ["/api/vendor-profile"],
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
        {/* NAVIGATION */}
          {step >= 0 && (
            <div className="flex justify-between ml-6 mr-6 mb-2">
              <Button
                variant="outline"
                disabled={step === 0}
                size="sm"
                onClick={() => setStep(step - 1)}
              >
                Back
              </Button>

              {step === steps.length - 1 ? (
                <Button onClick={completeOnboarding} size="sm">
                  Go to Dashboard
                </Button>
              ) : (
                <Button onClick={() => setStep(step + 1)} size="sm">
                  Next
                </Button>
              )}
            </div>
          )}

        <CardContent className="space-y-2">
          <img
            src={current.image}
            alt={current.title}
            className="rounded-lg border"
          />

          <p className="text-sm text-muted-foreground">
            {current.description}
          </p>

        </CardContent>
      </Card>
    </div>
  );
}

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
import assessmentImg from "@/assets/onboarding/assessment.png";
import assessmentChatImg from "@/assets/onboarding/assessmentChat.png";
import stageImg from "@/assets/onboarding/stage.png";
import QuickActionsImg from "@/assets/onboarding/QuickActions.png";
import recomendedServicesImage from "@/assets/onboarding/recomendedServices.png";
import servicesRequestsImage from "@/assets/onboarding/servicesRequests.png";
import headerAndGrowthframeworkImage from "@/assets/onboarding/headerAndGrowthframework.png";
import contractorProfileImage from "@/assets/onboarding/contractorProfile.png";
import supportRequestsImage from "@/assets/onboarding/supportRequests.png";
import subscriptionsImage from "@/assets/onboarding/subscriptions.png";


export default function Onboarding() {
  const [, setLocation] = useLocation();
  const [step, setStep] = useState(0);

  const steps = [
    {
      title: "Take or Skip Assessment",
      description:
        "You can take the assessment now or skip it and explore the platform.",
      image: assessmentImg,
    },
    {
      title: "Take Assessment",
      description:
        "Your responses are analyzed by AI to provide personalized recommendations. This typically takes 5-10 minutes. You can retake and skip assessment anytime",
      image: assessmentChatImg,
    },
    {
      title: "Explore the Header & Your Growth Framework",
      description:
        "Top header has, marketplace, support requests, profile settings, and logout." +
         "Follow structured guidance across strategy, structure, and scale.",
      image: headerAndGrowthframeworkImage,
    },
    {
      title: "Quick actions",
      description:
        "View vendors, see assessment chat, and upgrade subscription paln from here",
      image: QuickActionsImg,
    },
    {
      title: "Your Matirity Stage",
      description:
        "View your maturity stage, readiness score, and Retake Assessment button and this can be used to update profile.",
      image: stageImg,
    },
    {
      title: "Billing & Subscription",
      description:
        "View and subscribe Pilot or Beta plan to remove blur logic and access more features",
      image: subscriptionsImage,
    },
    
    {
      title: "Your Recomended Services",
      description:
        "View your recomended services based on assessment gaps.",
      image: recomendedServicesImage,
    },
    {
      title: "Your Service Requests",
      description:
        "View & manage your service request assigned by vendors.",
      image: servicesRequestsImage,
    },
    {
      title: "View & Edit Your Profile",
      description:
        "View and update your profile to keep your information current.",
      image: contractorProfileImage,
    },
    {
      title: "Support Requests & Tickets",
      description:
        "View and manage your Support Requests, replies & Tickets assigned by you",
      image: supportRequestsImage,
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

    setLocation("/dashboard");
  };

  const current = steps[step];

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <Card className="max-w-2xl w-full">
        <CardHeader className="pb-2">
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

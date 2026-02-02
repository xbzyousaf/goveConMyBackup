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
import stageImg from "@/assets/onboarding/stage.png";
import GrowthFrameworkImg from "@/assets/onboarding/GrowthFramework.png";
import QuickActionsImg from "@/assets/onboarding/QuickActions.png";
import headerImg from "@/assets/onboarding/header.png";


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
      title: "Explore the Header",
      description:
        "Top header has, marketplace, services, vendors, search, profile settings, and logout.",
      image: headerImg,
    },
    {
      title: "Your Personalized Dashboard",
      description:
        "View your maturity stage, readiness score, and Retake Assessment button and this can be used to profile.",
      image: stageImg,
    },
    {
      title: "Your Growth Framework",
      description:
        "Follow structured guidance across strategy, structure, and execution.",
      image: GrowthFrameworkImg,
    },
    {
      title: "Find Vendors & Take Action",
      description:
        "Connect with vetted vendors when you need expert support.",
      image: QuickActionsImg,
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

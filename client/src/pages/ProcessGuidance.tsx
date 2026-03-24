import { useQuery, useMutation } from "@tanstack/react-query";
import { useRoute, Link, useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { queryClient, apiRequest } from "@/lib/queryClient";
import {
  Briefcase,
  Target,
  CheckCircle2,
  Circle,
  ArrowLeft,
  FileText,
  ExternalLink,
  Award,
} from "lucide-react";
import { useState } from "react";
import { getFirstLetter } from "@/utility/textUtils";
import { useMemo } from "react";

interface Milestone {
  id: string;
  title: string;
  description: string;
  required: boolean;
  process: 'business_structure' | 'business_strategy' | 'execution';
  stage: 'startup' | 'growth' | 'scale';
  resources?: Array<{
    title: string;
    url: string;
    type: 'guide' | 'template' | 'external';
  }>;
}

interface UserJourney {
  id: string;
  userId: string;
  coreProcess: 'business_structure' | 'business_strategy' | 'execution';
  currentStage: string;
  completedMilestones: string[];
  progressPercentage: number;
  createdAt: string;
  updatedAt: string;
}

const PROCESS_CONFIG = {
  business_structure: {
    label: "Business Structure",
    description: "Establish your foundation, compliance, and certifications",
    icon: Briefcase,
    color: "bg-blue-500",
  },
  business_strategy: {
    label: "Business Strategy",
    description: "Define your market position and growth strategy",
    icon: Target,
    color: "bg-purple-500",
  },
  execution: {
    label: "Execution",
    description: "Win contracts and deliver excellence",
    icon: CheckCircle2,
    color: "bg-green-500",
  },
};

export default function ProcessGuidance() {
  const { data: milestones = [] } = useQuery<Milestone[]>({
  queryKey: ['/api/milestones'],
});
const [, params] = useRoute("/process/:processId");
  const processId = params?.processId as keyof typeof PROCESS_CONFIG | undefined;
 const { data: profile } = useQuery<any>({
    queryKey: ['/api/maturity-profile'],
  });
  
  const userStage = profile?.maturityStage || 'startup';
const stageMilestones = useMemo(() => {
  if (!processId) return [];
  return milestones.filter(
    (m) => m.process === processId && m.stage === userStage
  );
}, [milestones, processId, userStage]);

  const { data: bsJourney } = useQuery<UserJourney>({
    queryKey: ['/api/journeys', 'business_structure'],
  });

  const { data: stratJourney } = useQuery<UserJourney>({
    queryKey: ['/api/journeys', 'business_strategy'],
  });

  const { data: execJourney } = useQuery<UserJourney>({
    queryKey: ['/api/journeys', 'execution'],
  });

  
 
  const [, setLocation] = useLocation();

  const { data: journey, isLoading } = useQuery<UserJourney>({
    queryKey: ['/api/journeys', processId],
    enabled: !!processId,
  });

    const isStageCompleteGlobally = () => {
      if (!profile || !milestones.length) return false;
      const userStage = profile.maturityStage as "startup" | "growth" | "scale";
      // Get all required milestones for this stage
      const requiredMilestones = milestones
        .filter(m => m.stage === userStage && m.required)
        .map(m => m.id);
      const completed = new Set<string>([
        ...(bsJourney?.completedMilestones ?? []),
        ...(stratJourney?.completedMilestones ?? []),
        ...(execJourney?.completedMilestones ?? []),
      ]);
      return requiredMilestones.every(id => completed.has(id));
    };



  const updateMilestoneMutation = useMutation({
    mutationFn: async ({ milestoneId, completed }: { milestoneId: string; completed: boolean }) => {
      if (!processId) throw new Error("Missing processId");
      return apiRequest('POST', '/api/journeys/milestone', {
        coreProcess: processId,
        milestoneId,
        completed,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/journeys', processId] });
      queryClient.invalidateQueries({ queryKey: ['/api/maturity-profile'] });
    },
  });
  type AdvanceStagePayload = {
    currentStage: "startup" | "growth" | "scale";
    nextStage: "startup" | "growth" | "scale";
  };
  const advanceStageMutation = useMutation({
    mutationFn: async (payload: AdvanceStagePayload) => {
      return apiRequest("POST", "/api/maturity/advance", payload);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["/api/maturity-profile"],
      });
      await queryClient.invalidateQueries({
        queryKey: ["/api/journeys", processId],
      });
      window.location.href = "/dashboard";
    },
  });


  if (!processId || !PROCESS_CONFIG[processId]) {
    return (
      <div className="flex items-center justify-center h-full p-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Process Not Found</h2>
          <Link href="/">
            <Button data-testid="button-back-dashboard">
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
            </Button>
          </Link>
        </div>
      </div>
    );
  }
if (!profile || isLoading) {
  return (
    <div className="flex items-center justify-center h-full">
      <p>Loading...</p>
    </div>
  );
}
  const config = PROCESS_CONFIG[processId];
  const Icon = config.icon;

  const getNextStage = (
  stage: "startup" | "growth" | "scale"
  ) => {
    if (stage === "startup") return "growth";
    if (stage === "growth") return "scale";
    return null;
  };

  const nextStage = userStage
    ? getNextStage(userStage)
    : null;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading guidance...</p>
        </div>
      </div>
    );
  }

  const completedMilestones = journey?.completedMilestones || [];
  const totalMilestones = stageMilestones.length;
  const completedCount = stageMilestones.filter(m =>
    completedMilestones.includes(m.id)
  ).length;
  const progressPercentage = totalMilestones > 0 
    ? Math.round((completedCount / totalMilestones) * 100) 
    : 0;
    // const isFinalProcess = processId === "execution";
    const canAdvance =
      isStageCompleteGlobally() &&
      nextStage !== null;
    const stageLabelMap = {
      startup: "Startup",
      growth: "Growth",
      scale: "Scale",
    };

  const handleMilestoneToggle = (milestoneId: string, currentlyCompleted: boolean) => {
    updateMilestoneMutation.mutate({
      milestoneId,
      completed: !currentlyCompleted,
    });
  };
  return (
    <div className="h-full overflow-auto">
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div>
          <Link href="/">
            <Button variant="ghost" size="sm" className="mb-4" data-testid="button-back-dashboard">
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
            </Button>
          </Link>
          
          <div className="flex items-center gap-4 mb-2">
            <div className={`${config.color} p-3 rounded-lg`}>
              <Icon className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold" data-testid="text-process-title">{config.label}</h1>
              <p className="text-muted-foreground">{config.description}</p>
            </div>
          </div>
        </div>

        {/* Progress Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Your Progress</CardTitle>
                <CardDescription>
                  {stageLabelMap[userStage]} - {completedCount} of {totalMilestones} milestones complete
                </CardDescription>
              </div>
              <Badge variant="outline" className="text-lg px-4 py-2" data-testid="badge-progress-percentage">
                {progressPercentage}%
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <Progress value={progressPercentage} className="h-3" data-testid="progress-bar" />
          </CardContent>
        </Card>

        {/* Milestones */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Milestones & Checklist</h2>
          
         {stageMilestones.map((milestone) => {
            const isCompleted = completedMilestones.includes(milestone.id);
            
            return (
              <Card 
                key={milestone.id} 
                className={isCompleted ? "border-primary bg-primary/5" : ""}
                data-testid={`card-milestone-${milestone.id}`}
              >
                <CardHeader>
                  <div className="flex items-start gap-4">
                    <Checkbox
                      checked={isCompleted}
                      onCheckedChange={() => handleMilestoneToggle(milestone.id, isCompleted)}
                      className="mt-1"
                      data-testid={`checkbox-milestone-${milestone.id}`}
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <CardTitle className={`text-lg ${isCompleted ? 'line-through text-muted-foreground' : ''}`}>
                          {milestone.title}
                        </CardTitle>
                        {milestone.required && (
                          <Badge variant="secondary" data-testid={`badge-required-${milestone.id}`}>Required</Badge>
                        )}
                        {isCompleted && (
                          <CheckCircle2 className="h-5 w-5 text-primary" data-testid={`icon-completed-${milestone.id}`} />
                        )}
                      </div>
                      <CardDescription>{milestone.description}</CardDescription>
                      
                      {milestone.resources && milestone.resources.length > 0 && (
                        <div className="mt-4 space-y-2">
                          <p className="text-sm font-medium">Resources:</p>
                          {milestone.resources.map((resource, idx) => (
                            <a
                              key={idx}
                              href={resource.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 text-sm text-primary hover:underline"
                              data-testid={`link-resource-${milestone.id}-${idx}`}
                            >
                              {resource.type === 'external' && <ExternalLink className="h-4 w-4" />}
                              {resource.type !== 'external' && <FileText className="h-4 w-4" />}
                              {resource.title}
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </CardHeader>
              </Card>
            );
          })}
        </div>

        {/* Completion Message */}
        {canAdvance && (
          <Card className="border-2 border-primary bg-primary/5">
            <CardHeader>
              <div className="flex items-center gap-3">
                <Award className="h-8 w-8 text-primary" />
                <div>
                  <CardTitle className="text-primary">
                    🎉 {stageLabelMap[userStage]} Complete
                  </CardTitle>
                  <CardDescription>
                    You’re ready to move to the next stage.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>

            <CardContent className="flex gap-3">
              <Button variant="outline" onClick={() => setLocation("/assessment")}>
                Reassess Readiness
              </Button>

              {nextStage && (
                <Button
                  onClick={() =>
                    advanceStageMutation.mutate({
                      currentStage: userStage,
                      nextStage,
                    })
                  }

                >
                  Advance to {getFirstLetter(nextStage, "S") + nextStage.slice(1)}
                </Button>
              )}

              <Button variant="ghost">
                Stay in {userStage}
              </Button>
            </CardContent>
          </Card>
        )}

      </div>
    </div>
  );
}

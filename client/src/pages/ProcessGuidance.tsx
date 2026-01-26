import { useQuery, useMutation } from "@tanstack/react-query";
import { useRoute, Link } from "wouter";
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

interface Milestone {
  id: string;
  title: string;
  description: string;
  required: boolean;
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
    stages: {
      startup: {
        label: "Startup Foundation",
        milestones: [
          {
            id: "ein",
            title: "Obtain Employer Identification Number (EIN)",
            description: "Get your EIN from the IRS for tax purposes and business identity",
            required: true,
            resources: [
              { title: "IRS EIN Application", url: "https://www.irs.gov/businesses/small-businesses-self-employed/apply-for-an-employer-identification-number-ein-online", type: 'external' as const },
            ],
          },
          {
            id: "business_bank",
            title: "Open Business Bank Account",
            description: "Separate business and personal finances with a dedicated account",
            required: true,
            resources: [],
          },
          {
            id: "sam_gov",
            title: "Register in SAM.gov",
            description: "Required for all federal government contractors to receive awards",
            required: true,
            resources: [
              { title: "SAM.gov Registration Guide", url: "https://sam.gov", type: 'external' as const },
            ],
          },
          {
            id: "cage_code",
            title: "Obtain CAGE Code",
            description: "Commercial and Government Entity code for identification",
            required: true,
            resources: [],
          },
          {
            id: "business_structure",
            title: "Formalize Legal Business Structure",
            description: "LLC, S-Corp, or C-Corp - choose the right entity type",
            required: true,
            resources: [],
          },
          {
            id: "insurance",
            title: "Get General Liability Insurance",
            description: "Protect your business with appropriate coverage",
            required: false,
            resources: [],
          },
          {
            id: "accounting",
            title: "Set Up Accounting System",
            description: "QuickBooks or similar for tracking revenue and expenses",
            required: true,
            resources: [],
          },
        ],
      },
      growth: {
        label: "Growth Compliance",
        milestones: [
          {
            id: "small_business_cert",
            title: "Small Business Certification",
            description: "Get certified as a small business through SBA",
            required: true,
            resources: [],
          },
          {
            id: "set_aside_certs",
            title: "Explore Set-Aside Certifications",
            description: "8(a), HUBZone, WOSB, VOSB, SDVOSB certifications",
            required: false,
            resources: [],
          },
          {
            id: "accounting_system",
            title: "Implement Job Cost Accounting",
            description: "Track costs by project for accurate pricing and compliance",
            required: true,
            resources: [],
          },
          {
            id: "quality_system",
            title: "Develop Quality Management System",
            description: "Document processes and quality controls",
            required: false,
            resources: [],
          },
          {
            id: "cybersecurity",
            title: "Implement Basic Cybersecurity Controls",
            description: "NIST 800-171 basics for handling CUI",
            required: true,
            resources: [],
          },
        ],
      },
      scale: {
        label: "Scale Optimization",
        milestones: [
          {
            id: "iso_cert",
            title: "Pursue ISO Certifications",
            description: "ISO 9001, 27001, or industry-specific certifications",
            required: false,
            resources: [],
          },
          {
            id: "cmmc",
            title: "Achieve CMMC Certification",
            description: "Cybersecurity Maturity Model Certification for DoD work",
            required: false,
            resources: [],
          },
          {
            id: "erp_system",
            title: "Implement Enterprise Resource Planning (ERP)",
            description: "Integrated system for finance, HR, and operations",
            required: false,
            resources: [],
          },
          {
            id: "compliance_team",
            title: "Build Compliance Team",
            description: "Dedicated staff for regulatory and contract compliance",
            required: true,
            resources: [],
          },
        ],
      },
    },
  },
  business_strategy: {
    label: "Business Strategy",
    description: "Define your market position and growth strategy",
    icon: Target,
    color: "bg-purple-500",
    stages: {
      startup: {
        label: "Strategy Foundation",
        milestones: [
          {
            id: "solution_definition",
            title: "Define Your Solution/Service",
            description: "Clearly articulate what you offer and its value proposition",
            required: true,
            resources: [],
          },
          {
            id: "target_market",
            title: "Identify Target Agencies",
            description: "Research which agencies need your solution",
            required: true,
            resources: [],
          },
          {
            id: "capability_statement",
            title: "Create Capability Statement",
            description: "One-page overview of your business capabilities",
            required: true,
            resources: [],
          },
          {
            id: "pricing_strategy",
            title: "Develop Pricing Strategy",
            description: "Research rates and establish competitive pricing",
            required: true,
            resources: [],
          },
        ],
      },
      growth: {
        label: "Strategic Positioning",
        milestones: [
          {
            id: "naics_analysis",
            title: "Analyze NAICS Code Opportunities",
            description: "Understand spending patterns in your codes",
            required: true,
            resources: [],
          },
          {
            id: "partnership_strategy",
            title: "Develop Teaming Strategy",
            description: "Build relationships with complementary firms",
            required: true,
            resources: [],
          },
          {
            id: "past_performance",
            title: "Document Past Performance",
            description: "Compile case studies and references",
            required: true,
            resources: [],
          },
          {
            id: "marketing_plan",
            title: "Create GovCon Marketing Plan",
            description: "Outreach strategy for agencies and primes",
            required: true,
            resources: [],
          },
        ],
      },
      scale: {
        label: "Strategic Excellence",
        milestones: [
          {
            id: "competitive_intel",
            title: "Build Competitive Intelligence System",
            description: "Track competitors and market dynamics",
            required: true,
            resources: [],
          },
          {
            id: "advisory_board",
            title: "Establish Advisory Board",
            description: "Industry experts to guide strategic decisions",
            required: false,
            resources: [],
          },
          {
            id: "multi_year_strategy",
            title: "Develop 3-5 Year Strategic Plan",
            description: "Long-term vision with measurable goals",
            required: true,
            resources: [],
          },
        ],
      },
    },
  },
  execution: {
    label: "Execution",
    description: "Win contracts and deliver excellence",
    icon: CheckCircle2,
    color: "bg-green-500",
    stages: {
      startup: {
        label: "First Wins",
        milestones: [
          {
            id: "sam_search",
            title: "Learn to Search SAM.gov",
            description: "Master finding opportunities on SAM.gov",
            required: true,
            resources: [],
          },
          {
            id: "rfi_response",
            title: "Respond to First RFI",
            description: "Request for Information - low-risk practice",
            required: true,
            resources: [],
          },
          {
            id: "quote_submission",
            title: "Submit Micro-Purchase Quote",
            description: "Sub-$10k opportunities for practice",
            required: true,
            resources: [],
          },
          {
            id: "proposal_basics",
            title: "Learn Proposal Basics",
            description: "Understanding RFP structure and compliance matrix",
            required: true,
            resources: [],
          },
        ],
      },
      growth: {
        label: "Winning Consistently",
        milestones: [
          {
            id: "proposal_process",
            title: "Establish Proposal Process",
            description: "Repeatable system for responding to RFPs",
            required: true,
            resources: [],
          },
          {
            id: "price_to_win",
            title: "Master Price-to-Win Analysis",
            description: "Competitive pricing strategies",
            required: true,
            resources: [],
          },
          {
            id: "subcontractor_mgmt",
            title: "Build Subcontractor Network",
            description: "Reliable partners for teaming and fulfillment",
            required: true,
            resources: [],
          },
          {
            id: "contract_delivery",
            title: "Deliver First Major Contract",
            description: "Successfully execute >$100k contract",
            required: true,
            resources: [],
          },
        ],
      },
      scale: {
        label: "Strategic Capture",
        milestones: [
          {
            id: "capture_process",
            title: "Implement Capture Management",
            description: "Strategic pursuit of large opportunities",
            required: true,
            resources: [],
          },
          {
            id: "color_teams",
            title: "Run Color Team Reviews",
            description: "Pink, Red, Gold team proposal reviews",
            required: true,
            resources: [],
          },
          {
            id: "idiq_contract",
            title: "Win IDIQ Contract",
            description: "Indefinite Delivery, Indefinite Quantity vehicle",
            required: false,
            resources: [],
          },
          {
            id: "program_management",
            title: "Establish PMO",
            description: "Project Management Office for delivery excellence",
            required: true,
            resources: [],
          },
        ],
      },
    },
  },
};

export default function ProcessGuidance() {
  const [, params] = useRoute("/process/:processId");
  const processId = params?.processId as keyof typeof PROCESS_CONFIG;
  
  const { data: profile } = useQuery<any>({
    queryKey: ['/api/maturity-profile'],
  });

  const { data: journey, isLoading } = useQuery<UserJourney>({
    queryKey: ['/api/journeys', processId],
  });

  const updateMilestoneMutation = useMutation({
    mutationFn: async ({ milestoneId, completed }: { milestoneId: string; completed: boolean }) => {
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

  const config = PROCESS_CONFIG[processId];
  const Icon = config.icon;
  const userStage = profile?.maturityStage || 'startup';
  const stageConfig = config.stages[userStage as keyof typeof config.stages];

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
  const totalMilestones = stageConfig.milestones.length;
  const completedCount = stageConfig.milestones.filter(m => 
    completedMilestones.includes(m.id)
  ).length;
  const progressPercentage = totalMilestones > 0 
    ? Math.round((completedCount / totalMilestones) * 100) 
    : 0;

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
                  {stageConfig.label} - {completedCount} of {totalMilestones} milestones complete
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
          
          {stageConfig.milestones.map((milestone) => {
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
        {progressPercentage === 100 && (
          <Card className="border-2 border-primary bg-primary/5">
            <CardHeader>
              <div className="flex items-center gap-3">
                <Award className="h-8 w-8 text-primary" />
                <div>
                  <CardTitle className="text-primary">Congratulations!</CardTitle>
                  <CardDescription>
                    You've completed all milestones for {config.label} at the {stageConfig.label} level.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
          </Card>
        )}
      </div>
    </div>
  );
}

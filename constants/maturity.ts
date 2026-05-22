import {
  Lightbulb,
  TrendingUp,
  Rocket,
  Briefcase,
  Target,
  CheckCircle2,
} from "lucide-react";

export const STAGE_INFO = {
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

export const PROCESS_INFO = {
  business_structure: {
    label: "Structure",
    description: "Foundation, compliance, and certifications",
    icon: Briefcase,
  },
  business_strategy: {
    label: "Strategy",
    description: "Market positioning and growth planning",
    icon: Target,
  },
  execution: {
    label: "Scale",
    description: "Capture, proposal, and delivery excellence",
    icon: CheckCircle2,
  },
};
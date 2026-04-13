import { GapType } from './../shared/types/gaps';
import { ServiceCategory } from "./../shared/types/service";

export const GAP_CATEGORY_MAP: Record<GapType, ServiceCategory> = {
  cyber_security: "cybersecurity",
  legal: "legal",
  finance: "finance",
  hr: "hr",
  marketing: "marketing",
  business_tools: "business_tools",
  insurance: "insurance",
  certifications: "business_tools", // intentional mapping
};
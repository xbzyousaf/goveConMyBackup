import { GapType } from './../shared/types/gaps';
import { ServiceCategory } from "./../shared/types/service";

export const GAP_CATEGORY_MAP: Record<GapType, ServiceCategory> = {
  cybersecurity: "cybersecurity",
  legal: "legal",
  finance: "finance",
  hr: "hr",
  marketing: "marketing",
  business_tools: "business_tools",
  insurance: "insurance",
  certifications: "business_tools", // intentional mapping
};
export const CATEGORY_NAME_MAP: Record<ServiceCategory, string> = {
  legal: "Legal & Compliance",
  hr: "HR & Talent",
  finance: "Finance & Accounting",
  cybersecurity: "IT & Cybersecurity",
  marketing: "Marketing & Branding",
  business_tools: "Business Tools",
  insurance: "Insurance",
};
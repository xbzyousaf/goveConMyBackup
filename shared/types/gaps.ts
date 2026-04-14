export type GapType =
  | "legal"
  | "cybersecurity"
  | "finance"
  | "hr"
  | "marketing"
  | "business_tools"
  | "certifications"
  | "insurance";

export interface Gap {
  type: GapType;
  problem: string;
}
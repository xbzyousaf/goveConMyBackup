export type GapType =
  | "legal"
  | "cyber_security"
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
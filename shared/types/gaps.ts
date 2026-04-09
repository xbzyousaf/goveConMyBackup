export type GapType =
  | "legal"
  | "cyber_security"
  | "finance"
  | "hr"
  | "marketing"
  | "business_tools"
  | "certifications";

export interface Gap {
  type: GapType;
  problem: string;
}
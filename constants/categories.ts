export type ServiceCategory =
  | "legal"
  | "hr"
  | "finance"
  | "cybersecurity"
  | "marketing"
  | "business_tools"
  | "insurance";

export const SERVICE_CATEGORIES = [
  {
    id: "legal",
    label: "Legal & Compliance",
    description: "Contract review, regulatory compliance",
  },
  {
    id: "hr",
    label: "HR & Talent",
    description: "Recruitment, payroll, benefits",
  },
  {
    id: "finance",
    label: "Finance & Accounting",
    description: "Bookkeeping, tax, financial planning",
  },
  {
    id: "cybersecurity",
    label: "IT & Cybersecurity",
    description: "Security audits, system administration",
  },
  {
    id: "marketing",
    label: "Marketing & Branding",
    description: "Digital marketing, proposal writing",
  },
  {
    id: "business_tools",
    label: "Business Tools",
    description: "CRM, ERP, operational software",
  },
  {
    id: "insurance",
    label: "Insurance",
    description: "Business and compliance insurance",
  },
] as const;
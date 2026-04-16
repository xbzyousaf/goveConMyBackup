export const SERVICE_CATEGORIES = [
  "legal",
  "hr",
  "finance",
  "cybersecurity",
  "marketing",
  "business_tools",
  "insurance",
] as const;

export type ServiceCategory = typeof SERVICE_CATEGORIES[number];
export const SERVICE_REQUEST_STATUSES = [
  "pending",
  "in_progress",
  "accepted",
  "disputed",
  "canceled",
  "completed",
  "delivered"
] as const;

export type ServiceRequestStatus =
  typeof SERVICE_REQUEST_STATUSES[number];

export const PRIORITY_STATUSES: ServiceRequestStatus[] = [
  "pending",
  "in_progress",
  "accepted",
  "disputed",
  "delivered"
];
export const REQUEST_STATUSES_LABELS = [
  { value: "priority", label: "Priority" },
  { value: "all", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "in_progress", label: "In Progress" },
  { value: "accepted", label: "Accepted" },
  { value: "delivered", label: "Delivered" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
  { value: "disputed", label: "Disputed" },
];
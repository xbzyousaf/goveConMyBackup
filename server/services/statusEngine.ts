export const STATUS_TRANSITIONS: Record<string, string[]> = {
  pending: ["accepted", "cancelled"],
  accepted: ["in_progress", "cancelled"],
  in_progress: ["delivered", "disputed"],
  delivered: ["completed", "disputed"],
  disputed: ["completed", "cancelled"],
  completed: [],
  cancelled: [],
};

export function canTransition(current: string, next: string) {
  return STATUS_TRANSITIONS[current]?.includes(next);
}
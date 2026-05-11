export async function isGateClosed() {
  try {
    const res = await fetch("/api/urgency-slots");
    const data = await res.json();

    return data.remainingSlots <= 0;
  } catch {
    return false;
  }
}
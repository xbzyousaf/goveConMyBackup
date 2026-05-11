import { useEffect, useState } from "react";

export function UrgencyBanner() {
  const [slots, setSlots] = useState<number | null>(null);

  useEffect(() => {
    let interval: any;

    const fetchSlots = async () => {
      try {
        const res = await fetch("/api/urgency-slots");
        const data = await res.json();

        setSlots(data.remainingSlots);

        interval = setInterval(() => {
          setSlots((prev) =>
            prev && prev > 0 ? prev - 1 : 0
          );
        }, 10000); // 10 seconds
      } catch (err) {
        console.error("Urgency fetch failed", err);
      }
    };

    fetchSlots();

    return () => clearInterval(interval);
  }, []);

  // ❗ Only hide if still loading
  if (slots === null) return null;

  return (
    <div className="bg-primary text-gold text-center py-2 text-sm font-medium tracking-wide">
      {slots > 0
      ? `Hurry! Only ${slots} Free PROOF Audits remaining`
      : `⚠️ Free Access Closed — Upgrade Required`}
    </div>
  );
}
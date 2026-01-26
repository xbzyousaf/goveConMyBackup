import { useEffect } from "react";
import { useLocation } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";

export default function SkipAssessment() {
  const [, setLocation] = useLocation();

  useEffect(() => {
    const skip = async () => {
      try {
        await apiRequest("POST", "/api/skip-assessment", {});
        queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
        queryClient.invalidateQueries({ queryKey: ["/api/maturity-profile"] });
      } finally {
        setLocation("/dashboard");
      }
    };

    skip();
  }, [setLocation]);

  return null;
}

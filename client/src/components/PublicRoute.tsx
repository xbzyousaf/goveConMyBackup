import { Redirect } from "wouter";
import { useQuery } from "@tanstack/react-query";

function getDashboardByRole(role: string) {
  switch (role) {
    case "admin":
      return "/admin-dashboard";
    case "vendor":
      return "/vendor-dashboard";
    case "contractor":
      return "/dashboard";
    default:
      return "/";
  }
}

export function PublicRoute({ children }: { children: React.ReactNode }) {
  const { data: user, isLoading } = useQuery({
    queryKey: ["/api/auth/current-user"],
  });

  if (isLoading) return null;

  // ✅ IF USER ALREADY LOGGED IN → REDIRECT
  if (user) {
    return <Redirect to={getDashboardByRole(user.userType)} />;
  }

  return <>{children}</>;
}
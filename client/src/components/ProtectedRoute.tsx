import { Redirect } from "wouter";
import { useQuery } from "@tanstack/react-query";

type Props = {
  children: React.ReactNode;
  allowedRoles: string[];
};

export function ProtectedRoute({ children, allowedRoles }: Props) {
  const { data: user, isLoading } = useQuery({
    queryKey: ["/api/auth/current-user"],
  });

  // wait for user
  if (isLoading) return null;

  // not logged in
  if (!user) return <Redirect to="/login" />;

  // role not allowed
  function getDashboardByRole(role: string) {
    switch (role) {
        case "admin":
        return "/admin-dashboard";
        case "vendor":
        return "/vendor-dashboard";
        case "contractor":
        return "/dashboard";
        default:
        return "/login";
    }
    }

    if (!allowedRoles.includes(user.userType)) {
    return <Redirect to={getDashboardByRole(user.userType)} />;
    }

  return <>{children}</>;
}
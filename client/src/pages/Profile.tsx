import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";

import { Header } from "@/components/Header";
import ProfileTab from "@/components/ProfileTab";
import { ArrowLeft } from "lucide-react";
import { Button } from "../components/ui/button";

export default function Profile() {
  const [, setLocation] = useLocation();

  const { data: user, isLoading: userLoading } = useQuery({
    queryKey: ["/api/auth/current-user"],
  });

  const { data: categories = [] } = useQuery({
    queryKey: ["/api/categories"],
  });

  const { data: vendorProfile, isLoading: profileLoading } = useQuery({
    queryKey: ["/api/vendor-profile"],
    enabled: !!user,
  });

  if (userLoading || profileLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto py-8">
          Loading...
        </div>
      </div>
    );
  }

  const isVendor = user?.userType === "vendor";

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="max-w-6xl mx-auto p-6 space-y-4">
            <Link href="/">
                <Button variant="outline" size="sm" className="" data-testid="button-back-dashboard">
                <ArrowLeft className="mr-2 h-4 w-4" /> Back
                </Button>
            </Link>
        <ProfileTab
          profile={vendorProfile}
          categories={categories}
          showCertificates={isVendor}
          editUrl={
            isVendor
              ? "/vendor/profile/edit"
              : "/contractor/profile/edit"
          }
          createProfileUrl={
            isVendor
              ? "/vendor/profile/create"
              : "/contractor/profile/create"
          }
          onNavigate={setLocation}
        />
      </main>
    </div>
  );
}
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
    queryKey: ["/api/admin/categories"],
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
            <Button size="sm"  variant="outline"
                onClick={() => window.history.back()}
                >
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
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
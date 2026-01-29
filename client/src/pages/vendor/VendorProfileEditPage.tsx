import { useQuery } from "@tanstack/react-query";
import { VendorProfileForm } from "@/components/VendorProfileForm";
import { useLocation } from "wouter";

export default function EditVendorProfilePage() {
  const [, setLocation] = useLocation();

  const { data: vendorProfile, isLoading } = useQuery({
    queryKey: ["/api/vendor-profile"],
    queryFn: async () => {
      const res = await fetch("/api/vendor-profile");
      return res.json();
    },
  });

  if (isLoading) return null;

  return (
    <VendorProfileForm
      mode="edit"
      profileId={vendorProfile.id} 
      defaultValues={vendorProfile}
      onSuccess={() => setLocation("/vendor-dashboard")}
      onCancel={() => setLocation("/vendor-dashboard")}
    />
  );
}

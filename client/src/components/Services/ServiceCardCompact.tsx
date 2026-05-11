import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { getFirstLetter, truncateText } from "../../utility/textUtils";
import { Service } from "@/interfaces/service";
import { Badge } from "../ui/badge";

interface Props {
  service: Service;
  detailsUrl?: string;
}

export function ServiceCardCompact({ service, detailsUrl }: Props) {
  const [, setLocation] = useLocation();

  const companyName = service.vendorProfile?.companyName
    ? service.vendorProfile.companyName
    : "Vendor";

  const firstLetter = getFirstLetter(service.vendorProfile?.companyName, "V");

  return (
    <div className="relative flex items-center justify-between border-2 border-[hsl(var(--accent))] rounded-lg p-4 hover-elevate transition">

      {/* LEFT SIDE */}
      <div className="flex items-center gap-4">

        {/* Vendor Avatar */}
        <div className="flex flex-col items-center">
          <Avatar className="w-14 h-14">
            <AvatarFallback className="bg-[hsl(var(--accent))] text-white">
              {firstLetter}
            </AvatarFallback>
            <AvatarImage src={service.vendorProfile?.avatar ?? ""} />
          </Avatar>

          <div className="text-xs mt-1">
            {truncateText(companyName, 10)}
          </div>
        </div>

        {/* Service Info */}
        <div>
          <p className="text-base flex gap-1">
            <span className="font-bold">Service:</span>
            <span>{truncateText(service?.name, 85)}</span>
          </p>

          <p className="text-base flex gap-1">
            <span className="font-bold">Description:</span>
            <span>{truncateText(service?.description ?? "", 85)}</span>
          </p>
        </div>
      </div>

      {/* RIGHT SIDE */}
      <div className="flex flex-col items-end gap-3">
        <div className="absolute right-4 -top-3 z-10">
          <Badge className="border border-[hsl(var(--accent))] text-[hsl(var(--accent))] bg-background px-3 py-1 shadow-sm">
            Recommended for {service.category} gap
          </Badge>
        </div>

        {detailsUrl && (
          <Button
            size="sm"
            className="bg-[hsl(var(--accent))] hover:opacity-90 text-white"
            onClick={() => setLocation(detailsUrl)}
          >
            View Vendors
          </Button>
        )}
      </div>
    </div>
  );
}
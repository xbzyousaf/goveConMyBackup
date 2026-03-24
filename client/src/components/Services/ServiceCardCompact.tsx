import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { getFirstLetter, truncateText } from "../../utility/textUtils"
import { Service } from "@/interfaces/service";

interface Props {
  service: Service;
  detailsUrl?: string;
}

export function ServiceCardCompact({ service, detailsUrl }: Props) {
  const [, setLocation] = useLocation();

  const companyName = service.vendorProfile?.companyName
    ? `${service.vendorProfile.companyName}`
    : "Vendor";

  const firstLetter = getFirstLetter(service.vendorProfile?.companyName, "V");

  return (
    <div className="flex items-center justify-between border-2 border-orange-500 rounded-lg p-4 hover:shadow-sm transition">

      {/* LEFT SIDE */}
      <div className="flex items-center gap-4">

        {/* Vendor Avatar */}
        <div className="flex flex-col items-center">
          <Avatar className="w-14 h-14">
          <AvatarFallback className="bg-orange-500">
          <Avatar className="w-12 h-12">
            <AvatarImage src={service.vendorProfile?.avatar ?? ""} />
            <AvatarFallback className="text-white font-semibold bg-orange-600">
              {firstLetter}
            </AvatarFallback>
          </Avatar>
          </AvatarFallback>
          </Avatar>

          <div className="text-xs mt-1">{truncateText(companyName,10)}</div>
        </div>

        {/* Service Info */}
        <div>
          <p className="text-base flex gap-1">
            <span className="font-bold">Service:</span>
            <span>{truncateText(service?.title, 85)}</span>
          </p>

          <p className="text-base flex gap-1">
            <span className="font-bold">Description:</span>
            <span>{truncateText(service?.description ?? '', 85)}</span>
          </p>

        </div>
      </div>

      {/* RIGHT SIDE */}
      <div className="flex flex-col items-end gap-3">
        {detailsUrl && (
          <Button
            size="sm"
            className="bg-orange-500 hover:bg-orange-600 text-white"
            onClick={() => setLocation(`${detailsUrl}`)}
          >
            More Details
          </Button>
        )}
      </div>
    </div>
  );
}
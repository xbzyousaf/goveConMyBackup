import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { useLocation } from "wouter";
import { truncateText, getFirstLetter } from "../../utility/textUtils";
import { ServiceRequest } from "@/interfaces/serviceRequest";

const STATUS_COLORS = {
  accepted: "bg-[hsl(var(--accent))] text-white",
  in_progress: "bg-[hsl(var(--primary))] text-white",
  pending: "bg-[hsl(var(--gold))] text-white",
  disputed: "bg-[hsl(var(--destructive))] text-white",
};

interface Props {
  request: ServiceRequest;
  userType?: "vendor" | "contractor";
  detailsUrl?: string;
}

export function ServiceRequestCardCompact({ request, userType, detailsUrl }: Props) {
  const [, setLocation] = useLocation();

  const person =
    userType === "vendor"
      ? request.contractor
      : userType === "contractor"
      ? request.vendor
      : undefined;

  const fullName = person?.firstName || "Not assigned";
  const firstLetter = getFirstLetter(person?.firstName);

  return (
    <div className="flex items-center justify-between border-2 border-[hsl(var(--gold))] rounded-lg p-4 hover-elevate transition">

      {/* LEFT SIDE */}
      <div className="flex items-center gap-4">

        {/* Avatar */}
        <div className="flex flex-col items-center">
          <Avatar className="w-14 h-14">
            <AvatarFallback className="bg-[hsl(var(--gold))] text-white font-semibold">
              {firstLetter}
            </AvatarFallback>
            <AvatarImage src={person?.avatar ?? ""} />
          </Avatar>

          <div className="text-xs mt-1">{fullName}</div>
        </div>

        {/* Title + Description */}
        <div>
          <p className="text-base flex items-start gap-1">
            <span className="font-bold">Title:</span>
            <span>{truncateText(request.title ?? "Request")}</span>
          </p>

          <p className="text-base flex items-start gap-1">
            <span className="font-bold">Description:</span>
            <span>{truncateText(request.description ?? "Request Description")}</span>
          </p>
        </div>
      </div>

      {/* RIGHT SIDE */}
      <div className="flex items-center gap-3">

        {/* Status */}
        <Badge
          className={cn(
            "capitalize px-3 py-1 text-xs",
            STATUS_COLORS[request?.status ?? "pending"]
          )}
        >
          {request.status?.replace("_", " ") ?? "Unknown"}
        </Badge>

        {/* Details */}
        {detailsUrl && (
          <Button
            size="sm"
            className="bg-[hsl(var(--gold))] hover:opacity-90 text-white"
            onClick={() => setLocation(`${detailsUrl}/${request.id}`)}
          >
            More Details
          </Button>
        )}
      </div>
    </div>
  );
}
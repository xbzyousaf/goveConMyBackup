import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { useLocation } from "wouter";
import { truncateText, getFirstLetter } from "../../utility/textUtils"
import { ServiceRequest } from "@/interfaces/serviceRequest";

const STATUS_COLORS = {
  accepted: "bg-green-500 text-white",
  in_progress: "bg-blue-500 text-white",
  pending: "bg-yellow-500 text-white",
  disputed: "bg-red-500 text-white",
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
  const fullName = person?.firstName
    ? `${person.firstName}`
    : "Not assigned";

  const firstLetter = getFirstLetter(person?.firstName);

  return (
    <div className="flex items-center justify-between border rounded-lg p-4 hover:shadow-sm transition">

      {/* LEFT SIDE */}
      <div className="flex items-center gap-4">

        {/* Avatar */}
        <div className="flex flex-col items-center">
          <Avatar className="w-14 h-14">
          <AvatarFallback className="bg-green-500">
          <Avatar className="w-12 h-12">
            <AvatarImage src={person?.avatar ?? ""} />
            <AvatarFallback className="bg-green-600 text-white font-semibold">
              {firstLetter}
            </AvatarFallback>
          </Avatar>
          </AvatarFallback>
          </Avatar>
          <div className="text-xs mt-1">
            {fullName}
          </div>
        </div>
        

        {/* Title + Username */}
        <div>
          <p className="text-base flex items-start gap-1">
          <span className="font-bold">Title:</span>
          <span>
            {truncateText(request.title ?? "Request Description")}
          </span>
        </p>
         <p className="text-base flex items-start gap-1">
          <span className="font-bold">Description:</span>
          <span>
            {truncateText(request.description ?? "Request Description")}
          </span>
        </p>
        </div>
      </div>

      {/* RIGHT SIDE */}
      <div className="flex items-center gap-3">

        {/* Status */}
        <Badge className={cn("capitalize px-3 py-1 text-xs", STATUS_COLORS[request?.status ?? "pending"])}>
          {request.status?.replace("_", " ") ?? "Unknown"}
        </Badge>

        {/* Details */}
        {detailsUrl && (
          <Button
            size="sm"
            className="bg-green-500 hover:bg-green-600 text-white"
            onClick={() => setLocation(`${detailsUrl}/${request.id}`)}
          >
            More Details
          </Button>
        )}

      </div>
    </div>
  );
}
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileText, User, DollarSign, CalendarDays, EyeIcon, Truck } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLocation } from "wouter";

type ServiceRequest = {
  id: string;
  createdAt?: string;
  status?: string;
  budget?: string;
  description?: string;
  title?: string;

  contractor?: {
    firstName?: string | null;
    lastName?: string | null;
  };

  vendor?: {
    firstName?: string | null;
    lastName?: string | null;
  };

  service?: {
    name?: string | null;
  };
};

interface Props {
  request: ServiceRequest;
  userType?: "vendor" | "contractor";
  detailsUrl?: string;
}

export function ServiceRequestCard({ request, userType, detailsUrl }: Props) {
  const [, setLocation] = useLocation();

  const person =
  userType === "vendor"
    ? request.contractor
    : userType === "contractor"
    ? request.vendor
    : undefined;
const rawPriority = Number(request?.priority);
const daysToAdd = isNaN(rawPriority) ? 5 : rawPriority;
const deliveryDate =
  request.createdAt && request.priority != null
    ? new Date(
        new Date(request.createdAt).getTime() +
          Number(daysToAdd) * 24 * 60 * 60 * 1000
      )
    : null;



  return (
    <Card className="flex flex-col transition-all hover:shadow-xl hover:-translate-y-1 rounded-2xl">
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <CardTitle className="text-lg">
            {request.service?.name ?? "Service"}
          </CardTitle>

          <Badge
            className={cn(
              "capitalize text-xs font-medium",
              request.status === "completed" &&
                "bg-green-100 text-green-700 border-green-200",
              request.status === "in_progress" &&
                "bg-blue-100 text-blue-700 border-blue-200",
              request.status === "pending" &&
                "bg-amber-100 text-amber-700 border-amber-200"
            )}
          >
            {request.status?.replace("_", " ") ?? "Unknown"}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col">
        <div className="space-y-3 mb-4">
          <div className="space-y-2 mb-6">
            <div className="flex items-start gap-2">
              <FileText className="w-4 h-4 mt-1 text-muted-foreground" />
              <h4 className="font-semibold">
                {request.title ?? "Untitled Request"}
              </h4>
            </div>

            <p className="text-sm text-muted-foreground pl-6">
              {request.description ?? "No description provided"}
            </p>
          </div>
            <hr />
          {/* Person */}
        {userType && (
          <div className="flex justify-between text-sm">
            <div className="flex gap-2">
              <User className="w-4 h-4 text-muted-foreground" />
              <span className="text-muted-foreground">
                {userType === "vendor" ? "Contractor:" : "Vendor:"}
              </span>
            </div>

            <span className="font-medium">
              {person?.firstName
                ? `${person.firstName} ${person.lastName ?? ""}`
                : "Not assigned"}
            </span>
          </div>
        )}

          {/* Budget */}
          <div className="flex justify-between text-sm">
            <div className="flex gap-2">
              <DollarSign className="w-4 h-4 text-muted-foreground" />
              <span className="text-muted-foreground">Budget:</span>
            </div>

            <span className="font-medium">
                {request?.budget
                ? `${(request.budget ?? 0).toLocaleString()}`
                : "Not specified"}
            </span>
          </div>

          {/* Delivery */}
        <div className="flex justify-between text-sm">
        <div className="flex gap-2">
            <Truck  className="w-4 h-4 text-muted-foreground" />
            <span className="text-muted-foreground">Delivery Date:</span>
        </div>

        <span className="font-medium">
             {deliveryDate ? deliveryDate.toLocaleDateString() : "N/A"}
        </span>
        </div>

          {/* Created */}
          <div className="flex justify-between text-sm">
            <div className="flex gap-2">
              <CalendarDays className="w-4 h-4 text-muted-foreground" />
              <span className="text-muted-foreground">Created:</span>
            </div>

            <span className="font-medium">
              {request.createdAt
                ? new Date(request.createdAt).toLocaleDateString()
                : "N/A"}
            </span>
          </div>
        </div>
    {detailsUrl && (
        <div className="mt-auto pt-4 border-t text-end">
          <Button
            className="rounded-lg bg-primary hover:bg-primary/90"
            onClick={() => setLocation(detailsUrl)}
          >
            <EyeIcon className="w-4 h-4 mr-2" />
            View Details
          </Button>
        </div>
    )}
      </CardContent>
    </Card>
  );
}

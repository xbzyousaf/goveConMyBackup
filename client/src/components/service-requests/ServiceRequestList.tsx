import { ServiceRequestCard } from "./ServiceRequestCard";

interface Props {
  requests: any[];
  userType: "vendor" | "contractor";
  baseUrl: string;
}

export function ServiceRequestList({ requests, userType, baseUrl }: Props) {
  if (!requests.length) {
    return (
      <p className="text-sm text-muted-foreground text-center">
        No service requests found
      </p>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 w-full">
      {requests.map((request) => (
        <ServiceRequestCard
          key={request.id}
          request={request}
          userType={userType}
          detailsUrl={`${baseUrl}/${request.id}`}
        />
      ))}
    </div>
  );
}

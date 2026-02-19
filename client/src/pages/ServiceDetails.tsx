import { useQuery } from "@tanstack/react-query";
import { useRoute, Link } from "wouter";
import { Header } from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DollarSign, ArrowLeft, ArrowRight } from "lucide-react";

export default function ServiceDetails() {
  const [match, params] = useRoute("/services/:serviceId");
  const serviceId = params?.serviceId;

  const { data: service, isLoading } = useQuery({
    queryKey: ["/api/services", serviceId],
    queryFn: async () => {
      const res = await fetch(`/api/services/${serviceId}`);
      if (!res.ok) throw new Error("Failed to fetch service");
      return res.json();
    },
    enabled: !!serviceId,
  });

  if (isLoading) {
    return <div className="p-10 text-center">Loading service...</div>;
  }

  if (!service) {
    return <div className="p-10 text-center">Service not found</div>;
  }

  const vendorId = service.vendorId; // assuming backend returns vendorId

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-10">
        <div className="max-w-3xl mx-auto space-y-6">

          <Link href="/marketplace">
            <Button variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Services
            </Button>
          </Link>

          <Card>
            <CardHeader>
              <CardTitle className="text-3xl">
                {service.name}
              </CardTitle>
              <CardDescription>
                {service.description}
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6">

              <div className="flex items-center gap-2 text-lg">
                <DollarSign className="w-5 h-5 text-muted-foreground" />
                <span className="font-semibold">
                  {service.priceMin && service.priceMax
                    ? `$${service.priceMin} - $${service.priceMax}`
                    : "Contact vendor"}
                </span>
              </div>

              {Array.isArray(service.outcomes) && (
                <div>
                  <h4 className="font-semibold mb-2">Outcomes</h4>
                  <ul className="list-disc ml-6 text-sm space-y-1">
                    {service.outcomes.map((o: string, i: number) => (
                      <li key={i}>{o}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/*  Request This Service Button */}
              <Link
                href={`/request?vendorId=${vendorId}&serviceId=${service.id}`}
              >
                <Button className="w-full">
                  Request This Service
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </Link>

            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}

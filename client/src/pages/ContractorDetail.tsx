import { useQuery } from "@tanstack/react-query";
import { useRoute, Link } from "wouter";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, MessageSquare, Star, MapPin } from "lucide-react";
import { useLocation } from "wouter";

export default function ContractorDetail() {
  const [, params] = useRoute("/contractor/:id");
  const contractorId = params?.id;
  const [, setLocation] = useLocation();

  const { data: contractor, isLoading } = useQuery<any>({
    queryKey: contractorId ? [`/api/contractors/${contractorId}`] : ["disabled"],
    enabled: !!contractorId,
  });

  const { data: reviews = [] } = useQuery<any[]>({
    queryKey: contractorId
      ? [`/api/contractors/${contractorId}/reviews`]
      : ["disabled"],
    enabled: !!contractorId,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex justify-center items-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (!contractor) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-16 text-center">
          <h2 className="text-2xl font-bold mb-4">Contractor Not Found</h2>
          <Link href="/">
            <Button>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Go Back
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const fullName = `${contractor.firstName ?? ""} ${contractor.lastName ?? ""}`.trim() || "Contractor";

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-8">
        {/* Back */}
        <Link href="/">
          <Button variant="ghost" className="mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardContent className="p-8">
                <div className="flex items-start gap-6">
                  <Avatar className="w-24 h-24">
                    <AvatarImage src={contractor.profileImageUrl || ""} />
                    <AvatarFallback className="text-2xl">
                      {fullName[0]}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1">
                    <h1 className="text-3xl font-bold mb-2">{fullName}</h1>

                    {contractor.location && (
                      <div className="flex items-center gap-2 text-muted-foreground mb-2">
                        <MapPin className="w-4 h-4" />
                        {contractor.location}
                      </div>
                    )}

                    <div className="flex items-center gap-2">
                      <Star className="w-4 h-4 text-yellow-400 fill-current" />
                      <span>
                        {contractor.rating ?? "No rating"} (
                        {contractor.reviewCount ?? 0} reviews)
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* About */}
            {contractor.description && (
              <Card>
                <CardHeader>
                  <CardTitle>About Contractor</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{contractor.description}</p>
                </CardContent>
              </Card>
            )}

            {/* Reviews */}
            <Card>
              <CardHeader>
                <CardTitle>Reviews ({reviews.length})</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {reviews.length > 0 ? (
                  reviews.map((review, index) => (
                    <div key={index} className="border-b pb-4">
                      <div className="flex items-center gap-2 mb-2">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={`w-4 h-4 ${
                              i < (review.rating ?? 0)
                                ? "text-yellow-400 fill-current"
                                : "text-muted-foreground"
                            }`}
                          />
                        ))}
                      </div>
                      <p className="text-muted-foreground">{review.comment}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-muted-foreground">No reviews yet.</p>
                )}
              </CardContent>
            </Card>
          </div>

            {/* Sidebar */}
            <div className="space-y-6">
            <Card>
                <CardHeader>
                <CardTitle>Contact</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                {contractor.phoneNumber ? (
                    <div className="text-center font-medium text-lg">
                    📞 {contractor.phoneNumber}
                    </div>
                ) : (
                    <div className="text-center text-muted-foreground">
                    No phone number available
                    </div>
                )}


                </CardContent>
            </Card>
            </div>

        </div>
      </main>
    </div>
  );
}

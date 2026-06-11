import { useQuery } from "@tanstack/react-query";
import { useRoute, Link } from "wouter";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowLeft, MessageSquare, Star, MapPin, Mail } from "lucide-react";
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
      ? [`/api/contractor/${contractorId}/reviews`]
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
              <ArrowLeft  size="sm" className="w-4 h-4 mr-2" />
              Back
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
          <Button variant="ghost" size="sm" className="mb-6">
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
                    <p className="mb-2">@{contractor.username ?? "username"}</p>

                      <div className="flex items-center gap-2 text-muted-foreground mb-2">
                        <MapPin className="w-4 h-4" />
                        {contractor.location ? contractor.location : 'address'}

                      <Star className="w-4 h-4 text-yellow-400 fill-current" />
                      <span>
                        {reviews.length > 0 ? reviews[0].rating : "No rating"} (
                        {reviews.length ?? 0} reviews)
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
  <div className="space-y-4">
    {reviews.map((review, index) => (
      <Card key={review.id || index}>
        <CardContent className="p-6">
          <div className="flex gap-4">

            {/* Avatar */}
            <Avatar className="w-10 h-10">
              <AvatarFallback>
                {review?.vendorName?.[0] || "U"}
              </AvatarFallback>
            </Avatar>

            {/* Content */}
            <div className="flex-1 space-y-2">

              {/* Name + Date */}
              <div className="flex justify-between items-center">
                <p className="font-medium">
                  {review.vendorName ?? "User"}
                </p>

                <span className="text-xs text-muted-foreground">
                  {review.createdAt
                    ? new Date(review.createdAt).toLocaleDateString()
                    : ""}
                </span>
              </div>

              {/* Rating */}
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">
                  {review.rating}/5
                </span>

                <div className="flex gap-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`w-4 h-4 ${
                        i < review.rating
                          ? "text-yellow-400 fill-yellow-400"
                          : "text-muted-foreground"
                      }`}
                    />
                  ))}
                </div>
              </div>

              {/* Comment */}
              {review.comment && (
                <p className="text-sm text-muted-foreground">
                  {review.comment}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    ))}
  </div>
) : (
  <p className="text-muted-foreground text-center py-6">
    No reviews yet.
  </p>
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
                {contractor.email ? (
                    <div className="flex items-center justify-center font-medium text-lg">
                    <Mail className="w-4 h-4 mr-2" /> {contractor.email}
                    </div>
                ) : (
                    <div className="text-center text-muted-foreground">
                    No email available
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

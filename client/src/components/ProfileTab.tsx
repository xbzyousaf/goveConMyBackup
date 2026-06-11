import { Card, CardContent, CardHeader, CardTitle, } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, Phone, DollarSign, CalendarFold, MapPin, Building, LockKeyhole, Award, CheckCircle, AlertCircle, Star, User, User2, User2Icon, } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage,} from "@/components/ui/avatar";

interface ProfileTabProps {
  profile: any;
  categories: any[];
  certificates?: any[];
  editUrl: string;
  onNavigate: (url: string) => void;
  showCertificates?: boolean;
  createProfileUrl?: string;
}

export default function ProfileTab({
  profile,
  categories,
  certificates = [],
  editUrl,
  onNavigate,
  showCertificates = true,
  createProfileUrl,
}: ProfileTabProps) {
if (!profile) {
  return (
    <Card className="text-center py-12">
      <CardContent className="space-y-4">

        <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto">
          <Building className="w-8 h-8 text-muted-foreground" />
        </div>

        <CardTitle>Create Your Profile</CardTitle>

        <p className="text-muted-foreground">
          Complete your profile to start using the platform.
        </p>

        <Button
          onClick={() => onNavigate(createProfileUrl || editUrl)}
        >
          Create Profile
        </Button>

      </CardContent>
    </Card>
  );
}
  return (
    <div className="space-y-6">

      {/* Profile Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">

            <div className="flex items-center space-x-4">

              <Avatar className="w-16 h-16">
                <AvatarImage src={profile?.avatar || ""} />
                <AvatarFallback>
                  {profile?.companyName?.[0] || "V"}
                </AvatarFallback>
              </Avatar>

              <div>
                <CardTitle className="flex items-center gap-2">
                  {profile.companyName}

                  <Badge
                    variant={
                      profile?.isApproved
                        ? "default"
                        : "secondary"
                    }
                  >
                    {profile?.isApproved ? (
                      <>
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Verified
                      </>
                    ) : (
                      <>
                        <AlertCircle className="w-3 h-3 mr-1" />
                        Pending Review
                      </>
                    )}
                  </Badge>
                </CardTitle>
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => onNavigate(editUrl)}
            >
              <Edit className="w-4 h-4" />
              Edit Profile
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">

          {/* Rating */}
          <div className="flex items-center text-sm text-muted-foreground">
            <Star className="w-4 h-4 mr-1 text-yellow-400 fill-current" />
            {profile?.rating || "No ratings yet"}

            {profile?.reviewCount > 0 &&
              ` (${profile.reviewCount} reviews)`}
          </div>

          {/* Description */}
          {profile?.description && (
            <div>
              <h4 className="font-medium mb-2">
                Company Description
              </h4>

              <p className="text-sm text-muted-foreground">
                {profile.description}
              </p>
            </div>
          )}

          {/* Details */}
          <div className="grid md:grid-cols-3 gap-4">

            {profile?.hourlyRate && (
              <div className="flex items-center gap-2 ">
                <DollarSign className="w-4 h-4" />
                <p className="text-sm text-muted-foreground">
                    {profile.hourlyRate}/hr
                </p>
              </div>
            )}

            {profile?.phone && (
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4" />
                <p className="text-sm text-muted-foreground">
                  {profile.phone}
                </p>
              </div>
            )}

            {profile?.availability !== undefined && (
              <div className="flex items-center gap-2">
                <CalendarFold className="w-4 h-4" />
                <p className="text-sm text-muted-foreground">
                  {profile.availability === 0
                    ? "Unavailable"
                    : "Available"}
                </p>
              </div>
            )}
          </div>

          {/* Address */}
          {(profile?.addressLine1 ||
            profile?.addressLine2 ||
            profile?.city ||
            profile?.state) && (
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4" />

              <span className="text-sm text-muted-foreground">
                {[
                  profile.addressLine1,
                  profile.addressLine2,
                  profile.city,
                  profile.state,
                  profile.postalCode,
                ]
                  .filter(Boolean)
                  .join(", ")}
              </span>
            </div>
          )}

          {/* Categories */}
          {profile?.categoryIds?.length > 0 && (
            <div className="space-y-2 outline outline-1 outline-muted rounded p-4">
              <h4 className="font-medium mb-2">
                Service Categories
              </h4>

              <div className="flex flex-wrap gap-2">
                {profile.categoryIds.map(
                  (categoryId: string, index: number) => {
                    const category = categories.find(
                      (cat: any) => cat.id === categoryId
                    );

                    return (
                      <Badge
                        key={index}
                        variant="outline"
                      >
                        {category?.name || "Unknown"}
                      </Badge>
                    );
                  }
                )}
              </div>
            </div>
          )}
          <div className="grid md:grid-cols-2 gap-4">
            {profile.user.businessType && (
              <div className="items-center gap-2 ">
                <h4 className="font-medium mb-2">
                    Market Served
                </h4>
                <p className="text-sm text-muted-foreground">
                    {profile.user.businessType=== "government" ? "Government" : profile.user.businessType=== "commercial" ? "Commercial" : "Both Government & Commercial"}
                </p>
              </div>
            )}

            {profile?.yearsOfExperience && (
              <div className="items-center gap-2 ">
                <h4 className="font-medium mb-2">
                    Years of Experience
                </h4>
                <p className="text-sm text-muted-foreground">
                    {profile.yearsOfExperience} years
                </p>
              </div>
            )}
         </div>
        <div className="grid md:grid-cols-2 gap-4">
          {/* Skills */}
          {profile?.skills?.length > 0 && (
            <div className="outline outline-1 outline-muted rounded p-4">
              <h4 className="font-medium mb-2">
                Skills & Expertise
              </h4>

              <div className="flex flex-wrap gap-2">
                {profile.skills.map(
                  (skill: string, index: number) => (
                    <Badge
                      key={index}
                      variant="outline"
                    >
                      {skill}
                    </Badge>
                  )
                )}
              </div>
            </div>
          )}
          {profile?.agenciesServed?.length > 0 && (
            <div className="outline outline-1 outline-muted rounded p-4">
              <h4 className="font-medium mb-2">
                Agencies / Industries Served
              </h4>

              <div className="flex flex-wrap gap-2">
                {profile.agenciesServed.map(
                  (agency: string, index: number) => (
                    <Badge
                      key={index}
                      variant="outline"
                    >
                      {agency}
                    </Badge>
                  )
                )}
              </div>
            </div>
          )}
        </div>

        </CardContent>
      </Card>

      {/* User Information */}
      <Card>
        <CardHeader className="flex flex-row justify-between">

          <div className="flex items-center">
            <User2Icon className="w-5 h-5 mr-2" />
            <CardTitle>User Information</CardTitle>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              onNavigate(
                `/user/${profile?.userId}/change-password`
              )
            }
          >
            <LockKeyhole className="w-4 h-4" />
            Change Password
          </Button>

        </CardHeader>

        <CardContent>

          {profile?.user && (
            <div className="grid md:grid-cols-2 gap-4">

              <div className="flex items-center gap-2">
                <p>Name:</p>{" "}
                <p className="text-sm text-muted-foreground">
                    {profile.user.firstName}{" "}
                    {profile.user.lastName}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <p>Email:</p>{" "}
                <p className="text-sm text-muted-foreground">
                  {profile.user.email}
                </p>
              </div>

            </div>
          )}

        </CardContent>
      </Card>

      {/* Certificates */}
      {showCertificates && (
        <Card>

          <CardHeader className="flex flex-row justify-between">

            <div className="flex items-center">
              <Award className="w-5 h-5 mr-2" />
              <CardTitle>Certificates</CardTitle>
            </div>

            <Button
              size="sm"
              variant="outline"
              onClick={() =>
                onNavigate(
                  `/vendor/${profile?.id}/add-certificate`
                )
              }
            >
              Add Certificate
            </Button>

          </CardHeader>

          <CardContent>

            {certificates.length > 0 ? (
              <div className="grid md:grid-cols-3 gap-4">

                {certificates.map((cert: any) => (
                  <Card key={cert.id}>
                    <CardContent className="p-4">
                      <h4>{cert.certificateName}</h4>

                      <p className="text-sm text-muted-foreground">
                        {cert.receivedFrom}
                      </p>

                      <p className="text-xs text-muted-foreground">
                        {cert.yearReceived}
                      </p>
                    </CardContent>
                  </Card>
                ))}

              </div>
            ) : (
              <p>No certificates found</p>
            )}

          </CardContent>

        </Card>
      )}
    </div>
  );
}
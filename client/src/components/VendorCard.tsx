import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Star, CheckCircle, Award, TrendingUp, Shield, Building, CalendarFold, Cog } from "lucide-react";
import { getFirstLetter, truncateText } from "@/utility/textUtils";

interface VendorCardProps {
  name: string;
  companyName: string;
  category: string;
  rating: number;
  reviewCount: number;
  location: string;
  responseTime: string;
  businessType?: string;
  yearsOfExperience?: string;
  agenciesServed?: string;
  hourlyRate?: number;
  username?: string;
  isVerified?: boolean;
  isFeatured?: boolean;
  certifications?: string[];
  availability?: number;
  avatar?: string;
  skills: string[];
  onContact?: () => void;
  onViewProfile?: () => void;
}

export function VendorCard({
  name,
  companyName,
  category,
  rating,
  reviewCount,
  location,
  responseTime,
  hourlyRate,
  username,
  businessType,
  yearsOfExperience,
  agenciesServed,
  isVerified = false,
  isFeatured = false,
  certifications = [],
  availability = 1,
  avatar,
  skills,
  onContact,
  onViewProfile
}: VendorCardProps) {
  const initials = name.split(' ').map(n => n[0]).join('');
  const isTopRated = rating >= 4.5 && reviewCount >= 10;

  return (
    <Card className={`p-6 hover-elevate active-elevate-2 transition-all ${isFeatured ? 'border-primary shadow-md' : ''}`}>
      {isFeatured && (
        <div className="flex items-center gap-1 mb-3 -mt-2">
          <Badge variant="default" className="text-xs" data-testid="badge-featured">
            <TrendingUp className="w-3 h-3 mr-1" />
            Featured Vendor
          </Badge>
        </div>
      )}
      <div className="flex items-start justify-between mb-4 h-100">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10 shrink-0">
            {avatar ? (
              <AvatarImage src={avatar} alt={name} />
            ) : (
              <AvatarFallback>
                {getFirstLetter(name, "V")}
              </AvatarFallback>
            )}
          </Avatar>
          <div className="">
              <div>
                <h3 className="font-semibold" data-testid={`text-vendor-name-${name.toLowerCase().replace(/\s+/g, '-')}`}>
                  {name}
                </h3>
                {username && (
                  <p className="text-xs text-muted-foreground">
                    @{username}
                  </p>
                )}
              </div>
             
            <div className="flex mt-1">
              <Building className="h-4 w-4 text-muted-foreground"/>
              <p className="text-sm text-muted-foreground">{truncateText(companyName, 15)}</p>
              <div className="ml-1 mt-1">
                {isVerified && (
                  <CheckCircle className="h-3 w-3 text-primary" data-testid="icon-verified" />
                )}
              </div>              
            </div>
            <div>
                 {isTopRated && (
                <Badge variant="secondary" className="text-xs bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100" data-testid="badge-top-rated">
                  <Star className="w-3 h-3 mr-1 fill-current" />
                  Top Rated
                </Badge>
              )}
            </div>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          <Badge variant="secondary" className="text-xs block leading-none">
            {category}
          </Badge>
        </div>
      </div>

      {certifications && certifications.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {certifications.slice(0, 2).map((cert, index) => (
            <Badge key={index} variant="outline" className="text-xs" data-testid={`badge-cert-${index}`}>
              {cert === 'MBE Certified' && <Award className="w-3 h-3 mr-1" />}
              {cert === 'PROOF Experienced' && <Shield className="w-3 h-3 mr-1" />}
              {cert}
            </Badge>
          ))}
        </div>
      )}
    <hr />
     <div className="mb-4 text-sm text-muted-foreground space-y-3 mt-4">

  {/* Row 1 */}
  <div className="grid grid-cols-2 gap-6">
    <div className="flex items-start gap-2 min-w-0">
      <CalendarFold className="h-4 w-4 shrink-0" />

      <div className="min-w-0">
        <span className="text-xs block leading-none">
          Availability
        </span>

        {availability !== undefined && availability !== null && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-foreground" data-testid="text-availability" >
              {availability === 0 ? "Unavailable" : "Available"}
            </span>
          </div>
        )}
      </div>
    </div>

    {/* Reviews */}
    {/* <div className="flex items-start gap-2 min-w-0">
      <Star className="h-4 w-4 shrink-0" />

      <div className="min-w-0">
        <span className="text-xs block leading-none">
          Reviews
        </span>

        <div className="font-medium text-foreground">
          {rating || 0} ({reviewCount || 0} reviews)
        </div>
      </div>
    </div> */}
    {/* Experience */}
    <div className="flex items-start justify-end gap-2 text-right min-w-0">
      <div className="min-w-0">
        <span className="text-xs block leading-none ">Years of Experience</span>
        <div className="font-medium text-foreground">
          {yearsOfExperience
            ? `${yearsOfExperience} Years`
            : "N/A"}
        </div>
      </div>

      <Award className="h-4 w-4 shrink-0" />
    </div>
    {/* Response Time */}
    {/* <div className="flex items-start justify-end gap-2 text-right min-w-0">
      <div className="min-w-0">
        <span className="text-xs block leading-none">
          Response Time
        </span>

        <div className="font-medium text-foreground">
          {responseTime || "N/A"}
        </div>
      </div>

      <Clock className="h-4 w-4 shrink-0" />
    </div> */}
  </div>

  {/* Row 2 */}
  <div className="grid grid-cols-1 gap-6">
    {businessType && (
      <div className="flex items-start gap-2">
        <Building className="w-4 h-4 shrink-0 mt-1" />

        <div>
          <span className="text-xs block">
            Market Served
          </span>

          <p className="text-foreground">
            {businessType === "both"
              ? "Gov & Commercial"
              : businessType
                  ? businessType.charAt(0).toUpperCase() +
                    businessType.slice(1)
                  : "N/A"}
          </p>
        </div>
      </div>
    )}

    {/* Industries */}
    {/* <div className="flex items-start gap-2 min-w-0">
      <Briefcase className="h-4 w-4 shrink-0" />

      <div className="min-w-0">
        <span className="text-xs block leading-none ">
          Serving Industries
        </span>

        <div className="font-medium text-foreground break-words">
          {agenciesServed
            ? truncateText(agenciesServed, 40)
            : "N/A"}
        </div>
      </div>
    </div> */}

    
  </div>
</div>

    <div className="mb-4 flex items-start gap-2">
      <Cog className="w-4 h-4 shrink-0 text-muted-foreground" />
      <div>
        <span className="text-xs block leading-none mb-2 text-muted-foreground">Skills</span>

        <div className="flex flex-wrap gap-2">
          {skills.slice(0, 5).map((skill, index) => (
            <Badge key={index} variant="outline" className="text-xs" >
              {skill}
            </Badge>
          ))}

          {skills.length > 5 && (
            <Badge variant="outline" className="text-xs">
              +{skills.length - 5} more
            </Badge>
          )}
        </div>
      </div>
    </div>

      <div className="flex items-center justify-between">
        <div>
          <div className="font-semibold">
            {hourlyRate ? `$${hourlyRate}/hr` : "Not specified"}
          </div>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => {
              console.log(`Viewing profile for: ${name}`);
              onViewProfile?.();
            }}
            data-testid={`button-view-profile-${name.toLowerCase().replace(/\s+/g, '-')}`}
          >
            View Profile
          </Button>
          <Button 
            size="sm"
            onClick={() => {
              console.log(`Contacting vendor: ${name}`);
              onContact?.();
            }}
            data-testid={`button-contact-${name.toLowerCase().replace(/\s+/g, '-')}`}
          >
            Contact
          </Button>
        </div>
      </div>
    </Card>
  );
}
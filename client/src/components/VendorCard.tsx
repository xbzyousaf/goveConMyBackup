import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Star, CheckCircle, TrendingUp, Building, Cog, MessageCircle, User, CalendarClock } from "lucide-react";
import { truncateText } from "@/utility/textUtils";
import { useMessages } from "./ui/MessageContext";
import { useLocation } from "wouter";

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
  userId?: string;
  description?: string;
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
  userId,
  description,
  skills,
  onContact,
  onViewProfile
}: VendorCardProps) {
  const initials = name.split(' ').map(n => n[0]).join('');
  const isTopRated = rating >= 4.5 && reviewCount >= 10;
  const { openConversation } = useMessages();
  const [, setLocation] = useLocation();

  return (
    <Card className={`p-6 flex flex-col h-full hover-elevate active-elevate-2 transition-all ${
        isFeatured ? 'border-primary shadow-md' : ''
      }`}
    >
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
            <AvatarImage
                src={avatar || ""}
                alt={companyName}
                className="object-cover"
            />
            <AvatarFallback className="bg-primary text-white text-lg font-semibold">
                {companyName?.[0]?.toUpperCase() || "V"}
            </AvatarFallback>
          </Avatar>
          <div >
              <div className="flex">
                <h3 className="font-semibold" data-testid={`text-vendor-name-${companyName.toLowerCase().replace(/\s+/g, '-')}`}>
                  {companyName}
                </h3>
                 <div className="ml-1 mt-1.5">
                  {isVerified && (
                    <CheckCircle className="h-3 w-3 text-primary" data-testid="icon-verified" />
                  )}
                </div>
              </div>
              <p className="text-sm text-muted-foreground">{truncateText(name, 15)}</p>

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
      </div>

    <hr />
     <div className="mb-4 text-sm text-muted-foreground space-y-3 mt-4">

  {/* Row 1 */}
  <div className="min-h-[95px] max-h-[95px]">
    <div className="flex items-start gap-2">
      <User className="w-4 h-4 shrink-0" />

      <div>
        <span className="text-xs block">
          Description
        </span>

        <p className="text-foreground">
          {truncateText(description || "No description available", 130)}
        </p>
      </div>
    </div>
  </div>
  {/* Row 2 */}
  <div className="grid grid-cols-2 gap-6">
    <div className="flex items-start gap-2 min-w-0">
        {businessType && (
          <div className="flex items-start gap-2">
            <Building className="w-4 h-4 shrink-0" />

            <div>
              <span className="text-xs block">
                Market Served
              </span>

              <p className="text-foreground">
                {businessType === "both"
                  ? "Gov&Commertial"
                  : businessType
                      ? businessType.charAt(0).toUpperCase() +
                        businessType.slice(1)
                      : "N/A"}
              </p>
            </div>
          </div>
        )}
    </div>

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

      <CalendarClock className="h-4 w-4 shrink-0" />
    </div>

  </div>
</div>

    <div className="mb-4 flex items-start gap-2">
      <Cog className="w-4 h-4 shrink-0 text-muted-foreground" />
      <div>
        <span className="text-xs block leading-none mb-2 text-muted-foreground">Skills</span>

        <div className="flex flex-wrap gap-2 min-h-[60px] content-start">
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
    <hr />
      <div className="flex items-center justify-between mt-auto pt-4">
          <Button 
            size="sm"
            onClick={() => openConversation(userId)}
            data-testid={`button-contact-${name.toLowerCase().replace(/\s+/g, '-')}`}
          >
            <MessageCircle className="w-4 h-4" />
            Contact
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setLocation(`/vendor/${userId}`)}
            data-testid={`button-view-profile-${name.toLowerCase().replace(/\s+/g, '-')}`}
          >
            View Profile
          </Button>
      </div>
    </Card>
  );
}
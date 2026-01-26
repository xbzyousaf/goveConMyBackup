import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Star, MapPin, Clock, CheckCircle, Award, TrendingUp, Shield } from "lucide-react";

interface VendorCardProps {
  name: string;
  title: string;
  category: string;
  rating: number;
  reviewCount: number;
  location: string;
  responseTime: string;
  hourlyRate?: number;
  isVerified?: boolean;
  isFeatured?: boolean;
  certifications?: string[];
  availability?: string;
  avatar?: string;
  skills: string[];
  onContact?: () => void;
  onViewProfile?: () => void;
}

export function VendorCard({
  name,
  title,
  category,
  rating,
  reviewCount,
  location,
  responseTime,
  hourlyRate,
  isVerified = false,
  isFeatured = false,
  certifications = [],
  availability = "Available",
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
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <Avatar className="h-12 w-12">
            <AvatarImage src={avatar} alt={name} />
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-semibold" data-testid={`text-vendor-name-${name.toLowerCase().replace(/\s+/g, '-')}`}>
                {name}
              </h3>
              {isVerified && (
                <CheckCircle className="h-4 w-4 text-primary" data-testid="icon-verified" />
              )}
              {isTopRated && (
                <Badge variant="secondary" className="text-xs bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100" data-testid="badge-top-rated">
                  <Star className="w-3 h-3 mr-1 fill-current" />
                  Top Rated
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground">{title}</p>
          </div>
        </div>
        <Badge variant="secondary" className="text-xs">
          {category}
        </Badge>
      </div>

      {certifications && certifications.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {certifications.slice(0, 2).map((cert, index) => (
            <Badge key={index} variant="outline" className="text-xs" data-testid={`badge-cert-${index}`}>
              {cert === 'MBE Certified' && <Award className="w-3 h-3 mr-1" />}
              {cert === 'GovCon Experienced' && <Shield className="w-3 h-3 mr-1" />}
              {cert}
            </Badge>
          ))}
        </div>
      )}

      <div className="flex items-center gap-4 mb-4 text-sm text-muted-foreground flex-wrap">
        <div className="flex items-center gap-1">
          <Star className="h-4 w-4 fill-current text-yellow-400" />
          <span className="font-medium">{rating}</span>
          <span>({reviewCount} reviews)</span>
        </div>
        <div className="flex items-center gap-1">
          <MapPin className="h-4 w-4" />
          <span>{location}</span>
        </div>
        <div className="flex items-center gap-1">
          <Clock className="h-4 w-4" />
          <span>{responseTime}</span>
        </div>
        {availability && (
          <div className="flex items-center gap-1">
            <Badge variant={availability === "Available" ? "secondary" : "outline"} className="text-xs" data-testid="badge-availability">
              {availability}
            </Badge>
          </div>
        )}
      </div>

      <div className="mb-4">
        <div className="flex flex-wrap gap-2">
          {skills.slice(0, 3).map((skill, index) => (
            <Badge key={index} variant="outline" className="text-xs">
              {skill}
            </Badge>
          ))}
          {skills.length > 3 && (
            <Badge variant="outline" className="text-xs">
              +{skills.length - 3} more
            </Badge>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div>
          {hourlyRate && (
            <div className="text-lg font-semibold">
              ${hourlyRate}/hr
            </div>
          )}
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
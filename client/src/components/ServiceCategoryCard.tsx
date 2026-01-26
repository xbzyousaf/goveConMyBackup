import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LucideIcon } from "lucide-react";

interface ServiceCategoryCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  vendorCount: number;
  featured?: boolean;
  onClick?: () => void;
}

export function ServiceCategoryCard({ 
  title, 
  description, 
  icon: Icon, 
  vendorCount, 
  featured = false,
  onClick 
}: ServiceCategoryCardProps) {
  return (
    <Card 
      className={`p-6 cursor-pointer hover-elevate active-elevate-2 transition-all ${
        featured ? 'border-primary/50 bg-primary/5' : ''
      }`}
      onClick={() => {
        console.log(`Selected category: ${title}`);
        onClick?.();
      }}
      data-testid={`card-category-${title.toLowerCase().replace(/\s+/g, '-')}`}
    >
      <div className="flex items-start gap-4">
        <div className={`p-3 rounded-lg ${featured ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
          <Icon className="h-6 w-6" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="font-semibold">{title}</h3>
            {featured && <Badge variant="secondary" className="text-xs">Popular</Badge>}
          </div>
          <p className="text-sm text-muted-foreground mb-3">{description}</p>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">{vendorCount} vendors</span>
            <Badge variant="outline" className="text-xs">
              View All
            </Badge>
          </div>
        </div>
      </div>
    </Card>
  );
}
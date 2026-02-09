import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Star, TrendingUp, Package, Briefcase, Scale, Zap, Award, Filter, ArrowRight, CheckCircle } from "lucide-react";
import type { VendorProfile } from "@shared/schema";
const categoryIconMap: Record<string, React.ElementType> = {
  legal: Scale,
  cybersecurity: Zap,
  marketing: TrendingUp,
  finance: Briefcase,
  hr: Package,
  business_tools: Award,
};
export interface MarketplaceService {
  id: string;
  title: string;
  description: string;
  category: string;
  tier: string;
  priceMin: string | null;
  priceMax: string | null;
  turnaround: string | null;
  pricingModel: string | null;
  outcomes: string[] | null;
  vendorId: string;
}
export const getServiceDisplayPrice = (service: MarketplaceService) => {
  if (service.priceMin && service.priceMax) {
    return `$${Number(service.priceMin).toLocaleString()} – $${Number(service.priceMax).toLocaleString()}`;
  }
  if (service.priceMin) {
    return `$${Number(service.priceMin).toLocaleString()}`;
  }
  return "Contact for pricing";
};


export default function Marketplace() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStage, setSelectedStage] = useState<string>("all");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [priceRange, setPriceRange] = useState<string>("all");

  const { data: vendors = [] } = useQuery<VendorProfile[]>({
    queryKey: ["/api/vendors"],
  });

  // const featuredServices = [
  //   {
  //     id: "sam-registration",
  //     title: "SAM.gov Registration & Renewal",
  //     description: "Complete SAM.gov registration service with expert guidance through the entire process",
  //     category: "legal",
  //     price: 1500,
  //     trending: true,
  //     icon: Award,
  //     features: ["Entity registration", "Unique Entity ID", "CAGE code assistance", "Annual renewal support"]
  //   },
  //   {
  //     id: "gsa-schedule",
  //     title: "GSA Schedule Pricing Refresh",
  //     description: "Update and optimize your GSA Schedule pricing for maximum competitiveness",
  //     category: "finance",
  //     price: 2000,
  //     trending: true,
  //     icon: TrendingUp,
  //     features: ["Price analysis", "Market research", "Modification support", "Compliance review"]
  //   },
  //   {
  //     id: "proposal-writing",
  //     title: "Federal Proposal Writing",
  //     description: "Professional proposal development for federal opportunities",
  //     category: "marketing",
  //     price: 5000,
  //     icon: Package,
  //     features: ["Technical volumes", "Past performance", "Pricing strategy", "Compliance matrix"]
  //   },
  //   {
  //     id: "cybersecurity-audit",
  //     title: "CMMC/NIST Compliance Audit",
  //     description: "Comprehensive cybersecurity assessment and compliance roadmap",
  //     category: "cybersecurity",
  //     price: 3500,
  //     trending: true,
  //     icon: Zap,
  //     features: ["Gap analysis", "CMMC preparation", "NIST 800-171", "Remediation plan"]
  //   }
  // ];
  const { data: featuredServices = [], isLoading } = useQuery<MarketplaceService[]>({
    queryKey: ["/api/marketplace/services"],
  });

  const serviceBundles = [
    {
      id: "startup",
      name: "Startup Essentials",
      description: "Everything you need to start federal contracting",
      stage: "startup",
      price: 3500,
      savings: 500,
      services: [
        "SAM.gov Registration",
        "Basic Cybersecurity Setup",
        "Contract Compliance Training",
        "Capability Statement Review"
      ],
      popular: false
    },
    {
      id: "growth",
      name: "Growth Package",
      description: "Scale your federal contracting business",
      stage: "growth",
      price: 8500,
      savings: 1500,
      services: [
        "GSA Schedule Application",
        "Advanced Proposal Support",
        "CMMC Level 2 Assessment",
        "HR Compliance Package",
        "Monthly Legal Consultation"
      ],
      popular: true
    },
    {
      id: "enterprise",
      name: "Enterprise Suite",
      description: "Complete solution for established contractors",
      stage: "scaling",
      price: 15000,
      savings: 3000,
      services: [
        "Full GSA Schedule Support",
        "Dedicated Proposal Team",
        "Complete Cybersecurity Program",
        "Financial Audit Preparation",
        "Executive Advisory Services",
        "Business Development Support"
      ],
      popular: false
    }
  ];

  const promotions = [
    {
      id: "q4-special",
      title: "Q4 Compliance Package - 20% Off",
      description: "Get ready for year-end with our complete compliance review package",
      discount: "20%",
      validUntil: "Dec 31, 2025"
    },
    {
      id: "workshop",
      title: "Free Workshop: Federal Contracting 101",
      description: "Join our next live workshop on navigating federal opportunities",
      discount: "Free",
      validUntil: "Nov 15, 2025"
    },
    {
      id: "member-perk",
      title: "Member Exclusive: Priority Support",
      description: "Premium members get 24-hour response time on all services",
      discount: "Members Only",
      validUntil: "Ongoing"
    }
  ];

  const categories = [
    { id: "all", label: "All Services" },
    { id: "legal", label: "Legal & Compliance" },
    { id: "cybersecurity", label: "Cybersecurity" },
    { id: "marketing", label: "Proposal & Marketing" },
    { id: "finance", label: "Finance & Accounting" },
    { id: "hr", label: "HR & Talent" },
    { id: "business_tools", label: "Business Tools" }
  ];

  const businessStages = [
    { id: "all", label: "All Stages" },
    { id: "startup", label: "Startup (0-2 years)" },
    { id: "growth", label: "Growth (3-7 years)" },
    { id: "scaling", label: "Scaling (8+ years)" }
  ];

  const filteredServices = featuredServices.filter(service => {
    if (selectedCategory !== "all" && service.category !== selectedCategory) return false;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return service.title.toLowerCase().includes(query) || 
             service.description.toLowerCase().includes(query);
    }
    return true;
  });

  const filteredBundles = serviceBundles.filter(bundle => {
    // Stage filter
    if (selectedStage !== "all" && bundle.stage !== selectedStage) {
      return false;
    }
    
    // Price range filter
    if (priceRange !== "all") {
      const price = bundle.price;
      if (priceRange === "low" && price > 5000) return false;
      if (priceRange === "medium" && (price < 5000 || price > 10000)) return false;
      if (priceRange === "high" && price < 10000) return false;
    }
    
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesName = bundle.name.toLowerCase().includes(query);
      const matchesDescription = bundle.description.toLowerCase().includes(query);
      const matchesServices = bundle.services.some(service => 
        service.toLowerCase().includes(query)
      );
      if (!matchesName && !matchesDescription && !matchesServices) {
        return false;
      }
    }
    
    return true;
  });

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Hero Section */}
        <div className="mb-12 text-center">
          <Badge variant="outline" className="mb-4">
            Your Federal Contracting Marketplace
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold mb-4" data-testid="text-marketplace-title">
            Discover Services & Solutions
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Browse our curated marketplace of federal contracting services, bundles, and expert support
          </p>
        </div>

        {/* Search & Filters */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  placeholder="Search services, bundles, or solutions..."
                  className="pl-10 text-base"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  data-testid="input-marketplace-search"
                />
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  <label className="text-sm font-medium mb-2 block">Business Stage</label>
                  <Select value={selectedStage} onValueChange={setSelectedStage}>
                    <SelectTrigger data-testid="select-business-stage">
                      <SelectValue placeholder="Select stage" />
                    </SelectTrigger>
                    <SelectContent>
                      {businessStages.map(stage => (
                        <SelectItem key={stage.id} value={stage.id}>{stage.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Service Category</label>
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger data-testid="select-service-category">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map(cat => (
                        <SelectItem key={cat.id} value={cat.id}>{cat.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Price Range</label>
                  <Select value={priceRange} onValueChange={setPriceRange}>
                    <SelectTrigger data-testid="select-price-range">
                      <SelectValue placeholder="Select range" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Prices</SelectItem>
                      <SelectItem value="low">Under $5,000</SelectItem>
                      <SelectItem value="medium">$5,000 - $10,000</SelectItem>
                      <SelectItem value="high">$10,000+</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="services" className="space-y-8">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="services" data-testid="tab-services">Featured Services</TabsTrigger>
            <TabsTrigger value="bundles" data-testid="tab-bundles">Service Bundles</TabsTrigger>
            <TabsTrigger value="promotions" data-testid="tab-promotions">Promotions</TabsTrigger>
          </TabsList>

          {/* Featured Services Tab */}
          <TabsContent value="services" className="space-y-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold">Featured Services</h2>
              <Badge variant="secondary" className="flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />
                Trending Now
              </Badge>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              {filteredServices.map((service) => {
                const Icon = categoryIconMap[service.category] ?? Package;
                return (
                <Card key={service.id} className="hover-elevate active-elevate-2 transition-all" data-testid={`card-service-${service.id}`}>
                  <CardHeader>
                    <div className="flex items-start justify-between mb-2">
                      <div className="p-3 rounded-lg bg-primary/10">
                        <Icon className="w-6 h-6 text-primary" />
                      </div>
                      {service.trending && (
                        <Badge variant="default" className="flex items-center gap-1">
                          <Star className="w-3 h-3" />
                          Trending
                        </Badge>
                      )}
                    </div>
                    <CardTitle className="text-xl">{service.title}</CardTitle>
                    <CardDescription>{service.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <ul className="space-y-2">
                        {service.outcomes?.map((outcomes, idx) => (
                          <li key={idx} className="flex items-center gap-2 text-sm">
                            <CheckCircle className="w-4 h-4 text-primary" />
                            <span>{outcomes}</span>
                          </li>
                        ))}
                      </ul>
                      
                      <div className="flex items-center justify-between pt-4 border-t">
                        <div>
                          <span className="text-2xl font-bold">
                            {getServiceDisplayPrice(service)}
                          </span>

                        </div>
                        <Link href={`/vendors?category=${service.category}`}>
                          <Button data-testid={`button-view-vendors-${service.id}`}>
                            View Vendors
                            <ArrowRight className="ml-2 w-4 h-4" />
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )})}
            </div>
          </TabsContent>

          {/* Service Bundles Tab */}
          <TabsContent value="bundles" className="space-y-6">
            <div className="mb-4">
              <h2 className="text-2xl font-bold mb-2">Pre-Packaged Solutions</h2>
              <p className="text-muted-foreground">Save money with our curated service bundles</p>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
              {filteredBundles.map((bundle) => (
                <Card 
                  key={bundle.id} 
                  className={`hover-elevate active-elevate-2 transition-all ${bundle.popular ? 'border-primary shadow-lg' : ''}`}
                  data-testid={`card-bundle-${bundle.id}`}
                >
                  <CardHeader>
                    {bundle.popular && (
                      <Badge variant="default" className="w-fit mb-2">Most Popular</Badge>
                    )}
                    <CardTitle>{bundle.name}</CardTitle>
                    <CardDescription>{bundle.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="mb-4">
                        <div className="flex items-baseline gap-2 mb-1">
                          <span className="text-3xl font-bold">${bundle.price.toLocaleString()}</span>
                          <Badge variant="secondary" className="text-xs">Save ${bundle.savings}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">One-time package price</p>
                      </div>

                      <div className="space-y-2">
                        <p className="text-sm font-medium">Includes:</p>
                        <ul className="space-y-2">
                          {bundle.services.map((service, idx) => (
                            <li key={idx} className="flex items-center gap-2 text-sm">
                              <CheckCircle className="w-4 h-4 text-primary" />
                              <span>{service}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <Button className="w-full mt-4" variant={bundle.popular ? "default" : "outline"} data-testid={`button-select-bundle-${bundle.id}`}>
                        Select Package
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Promotions Tab */}
          <TabsContent value="promotions" className="space-y-6">
            <div className="mb-4">
              <h2 className="text-2xl font-bold mb-2">Current Promotions</h2>
              <p className="text-muted-foreground">Take advantage of limited-time offers and member perks</p>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
              {promotions.map((promo) => (
                <Card key={promo.id} className="hover-elevate active-elevate-2 transition-all" data-testid={`card-promotion-${promo.id}`}>
                  <CardHeader>
                    <div className="flex items-start justify-between mb-2">
                      <Badge variant="default" className="text-lg px-3 py-1">
                        {promo.discount}
                      </Badge>
                    </div>
                    <CardTitle className="text-lg">{promo.title}</CardTitle>
                    <CardDescription>{promo.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <p className="text-sm text-muted-foreground">
                        Valid until: <span className="font-medium">{promo.validUntil}</span>
                      </p>
                      <Button variant="outline" className="w-full" data-testid={`button-claim-${promo.id}`}>
                        Learn More
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>

        {/* CTA Section */}
        <Card className="mt-12 bg-primary/5 border-primary/20">
          <CardContent className="p-8 text-center">
            <h3 className="text-2xl font-bold mb-2">Can't find what you need?</h3>
            <p className="text-muted-foreground mb-6">
              Browse our full vendor directory or get personalized recommendations from our AI
            </p>
            <div className="flex gap-4 justify-center flex-wrap">
              <Link href="/vendors">
                <Button size="lg" variant="outline" data-testid="button-browse-all-vendors">
                  Browse All Vendors
                </Button>
              </Link>
              <Link href="/?section=request">
                <Button size="lg" data-testid="button-get-ai-recommendations">
                  Get AI Recommendations
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

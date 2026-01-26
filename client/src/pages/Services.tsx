import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Scale, Users, DollarSign, Shield, Megaphone, Settings, CheckCircle, ArrowRight, Clock, TrendingUp, Lock, Star, Search } from "lucide-react";

export default function Services() {
  const [location, setLocation] = useLocation();
  const searchParams = new URLSearchParams(location.split('?')[1]);
  const categoryParam = searchParams.get('category');
  
  const [selectedCategory, setSelectedCategory] = useState<string>(categoryParam || "all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  useEffect(() => {
    if (categoryParam && categoryParam !== selectedCategory) {
      setSelectedCategory(categoryParam);
    }
  }, [categoryParam]);

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    if (category === "all") {
      setLocation("/services");
    } else {
      setLocation(`/services?category=${category}`);
    }
  };

  const serviceCategories = [
    { id: "all", label: "All Services", icon: TrendingUp },
    { id: "legal", label: "Legal & Compliance", icon: Scale },
    { id: "hr", label: "HR & Talent", icon: Users },
    { id: "finance", label: "Finance & Accounting", icon: DollarSign },
    { id: "cybersecurity", label: "IT & Cybersecurity", icon: Shield },
    { id: "marketing", label: "Proposal Support", icon: Megaphone },
    { id: "business_tools", label: "Business Tools", icon: Settings }
  ];

  const allServices = [
    {
      id: "sam-registration",
      category: "legal",
      name: "SAM.gov Registration",
      description: "Complete entity registration in the System for Award Management with expert guidance",
      turnaround: "5-7 business days",
      pricingModel: "Fixed: $1,500",
      outcomes: ["Active SAM registration", "Unique Entity ID (UEI)", "CAGE code assignment", "Marketing partnerships activated"],
      tier: "free" // Available to all tiers
    },
    {
      id: "contract-review",
      category: "legal",
      name: "Federal Contract Review",
      description: "Expert legal review of federal contracts and agreements for compliance and risk",
      turnaround: "3-5 business days",
      pricingModel: "Hourly: $150-250/hr",
      outcomes: ["Compliance verification", "Risk assessment report", "Negotiation recommendations", "FAR/DFARS compliance check"],
      tier: "premium"
    },
    {
      id: "gsa-schedule",
      category: "legal",
      name: "GSA Schedule Application",
      description: "Full support for GSA Schedule application and contract award process",
      turnaround: "60-90 days",
      pricingModel: "Fixed: $15,000-25,000",
      outcomes: ["GSA Schedule contract", "Pricing strategy", "SIN selection guidance", "Contract maintenance support"],
      tier: "premium"
    },
    {
      id: "cmmc-assessment",
      category: "cybersecurity",
      name: "CMMC Compliance Assessment",
      description: "Comprehensive Cybersecurity Maturity Model Certification readiness evaluation",
      turnaround: "10-15 business days",
      pricingModel: "Fixed: $3,500-7,500",
      outcomes: ["Gap analysis report", "Remediation roadmap", "CMMC Level 1-3 preparation", "Documentation templates"],
      tier: "discounted"
    },
    {
      id: "nist-audit",
      category: "cybersecurity",
      name: "NIST 800-171 Audit",
      description: "Full audit and implementation support for NIST 800-171 compliance requirements",
      turnaround: "15-20 business days",
      pricingModel: "Fixed: $5,000-10,000",
      outcomes: ["Compliance audit report", "System Security Plan (SSP)", "Plan of Action & Milestones", "Continuous monitoring setup"],
      tier: "free"
    },
    {
      id: "proposal-writing",
      category: "marketing",
      name: "Federal Proposal Writing",
      description: "Professional proposal development for federal opportunities and RFPs",
      turnaround: "10-30 days (varies)",
      pricingModel: "Project-based: $5,000-50,000",
      outcomes: ["Complete proposal package", "Technical/management volumes", "Past performance narratives", "Compliance matrix"],
      tier: "premium"
    },
    {
      id: "capability-statement",
      category: "marketing",
      name: "Capability Statement Design",
      description: "Professional capability statement creation highlighting your federal contracting capabilities",
      turnaround: "5-7 business days",
      pricingModel: "Fixed: $500-1,500",
      outcomes: ["Professional capability statement", "Multiple formats (PDF, print)", "NAICS/PSC codes highlighted", "Past performance showcase"],
      tier: "free"
    },
    {
      id: "hr-compliance",
      category: "hr",
      name: "HR Compliance Package",
      description: "Complete HR compliance setup for government contractors including OFCCP and EEO requirements",
      turnaround: "10-15 business days",
      pricingModel: "Fixed: $2,500-5,000",
      outcomes: ["OFCCP compliance program", "EEO-1 reporting setup", "AAP development", "Employee handbook"],
      tier: "discounted"
    },
    {
      id: "payroll-setup",
      category: "hr",
      name: "Federal Payroll Setup",
      description: "Payroll system configuration with SCA/Davis-Bacon wage determination compliance",
      turnaround: "7-10 business days",
      pricingModel: "Monthly: $500-1,500/mo",
      outcomes: ["Compliant payroll system", "Wage determination integration", "Fringe benefit tracking", "Certified payroll reports"],
      tier: "premium"
    },
    {
      id: "dcaa-accounting",
      category: "finance",
      name: "DCAA-Compliant Accounting",
      description: "Accounting system setup and audit preparation for DCAA compliance",
      turnaround: "15-30 business days",
      pricingModel: "Fixed: $8,000-15,000",
      outcomes: ["DCAA-compliant system", "Chart of accounts", "Timekeeping system", "Indirect rate structure"],
      tier: "premium"
    },
    {
      id: "cost-proposal",
      category: "finance",
      name: "Cost Proposal Development",
      description: "Detailed cost proposal preparation for federal contracts and task orders",
      turnaround: "5-10 business days",
      pricingModel: "Hourly: $125-200/hr",
      outcomes: ["Detailed cost proposal", "Rate justification", "Basis of estimate", "Price-to-win analysis"],
      tier: "discounted"
    },
    {
      id: "erp-implementation",
      category: "business_tools",
      name: "ERP System Implementation",
      description: "Enterprise resource planning system selection and implementation for contractors",
      turnaround: "30-90 days",
      pricingModel: "Project-based: $10,000-50,000",
      outcomes: ["ERP system deployed", "Process automation", "Reporting dashboards", "Staff training"],
      tier: "premium"
    }
  ];

  const processSteps = [
    {
      step: 1,
      title: "AI Assessment",
      description: "Our AI analyzes your requirements and matches you with the best service options",
      icon: TrendingUp
    },
    {
      step: 2,
      title: "Vendor Match",
      description: "Get connected with vetted vendors who specialize in your needed service",
      icon: Users
    },
    {
      step: 3,
      title: "Escrowed Payment",
      description: "Secure payment held in escrow until service completion meets your standards",
      icon: Lock
    },
    {
      step: 4,
      title: "Completion",
      description: "Review deliverables, approve completion, and payment is released to vendor",
      icon: CheckCircle
    }
  ];

  const membershipTiers = [
    {
      name: "Free Tier",
      services: "3 services included at no cost",
      description: "Essential services at no cost for all members",
      benefits: [
        "✓ SAM.gov Registration (Free)",
        "✓ Capability Statement Design (Free)",
        "✓ NIST 800-171 Audit (Free)",
        "Basic vendor access",
        "Email support"
      ],
      includedServices: ["SAM.gov Registration", "Capability Statement Design", "NIST 800-171 Audit"]
    },
    {
      name: "Professional ($99/mo)",
      services: "20% discount on all services",
      description: "Discounted rates on premium services",
      benefits: [
        "All Free Tier services",
        "20% off CMMC Assessment",
        "20% off Cost Proposal Development",
        "20% off HR Compliance Package",
        "Priority vendor matching",
        "24-hour support response"
      ],
      includedServices: ["CMMC Compliance Assessment", "Cost Proposal Development", "HR Compliance Package"],
      popular: true
    },
    {
      name: "Enterprise ($299/mo)",
      services: "30% off + premium access",
      description: "Premium services with white-glove support",
      benefits: [
        "All Pro Tier discounts",
        "30% off Federal Proposal Writing",
        "30% off GSA Schedule Application",
        "30% off DCAA-Compliant Accounting",
        "30% off ERP Implementation",
        "Dedicated account manager",
        "Same-day support response",
        "Quarterly strategy sessions"
      ],
      includedServices: ["Federal Proposal Writing", "GSA Schedule Application", "Federal Contract Review", "DCAA-Compliant Accounting", "Payroll Setup", "ERP System Implementation"]
    }
  ];

  const filteredServices = allServices.filter(service => {
    // Category filter
    if (selectedCategory !== "all" && service.category !== selectedCategory) {
      return false;
    }

    // Search query filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesName = service.name.toLowerCase().includes(query);
      const matchesDescription = service.description.toLowerCase().includes(query);
      const matchesCategory = service.category.toLowerCase().includes(query);
      const matchesOutcomes = service.outcomes?.some(outcome => 
        outcome.toLowerCase().includes(query)
      );
      
      return matchesName || matchesDescription || matchesCategory || matchesOutcomes;
    }

    return true;
  });

  const getCategoryDescription = (categoryId: string) => {
    const descriptions: Record<string, string> = {
      legal: "Contract compliance, SAM registration, GSA schedules, and legal advisory services",
      hr: "Talent acquisition, compliance consulting, payroll setup, and workforce management",
      finance: "Cost accounting, financial reporting, DCAA compliance, and ERP systems",
      cybersecurity: "CMMC assessments, NIST audits, penetration testing, and security compliance",
      marketing: "Proposal writing, capture planning, BD support, and technical documentation",
      business_tools: "Project management, document control, quality systems, and business intelligence"
    };
    return descriptions[categoryId] || "";
  };

  const getServiceCountByCategory = (categoryId: string) => {
    if (categoryId === "all") return allServices.length;
    return allServices.filter(s => s.category === categoryId).length;
  };

  const getTierBadge = (tier: string) => {
    switch(tier) {
      case "free":
        return <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100" data-testid="badge-tier-free">Free Tier</Badge>;
      case "discounted":
        return <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100" data-testid="badge-tier-discounted">Pro Discount</Badge>;
      case "premium":
        return <Badge variant="secondary" className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100" data-testid="badge-tier-premium">Premium</Badge>;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2" data-testid="text-services-title">
            Browse Services
          </h1>
          <p className="text-lg text-muted-foreground">
            Pre-scoped services with clear pricing, turnaround times, and guaranteed outcomes
          </p>
        </div>

        {/* Search and Filters */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="space-y-4">
              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search by service name, description, or keywords..."
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  data-testid="input-search-services"
                />
              </div>

              {/* Category Filter */}
              <div>
                <Select value={selectedCategory} onValueChange={handleCategoryChange}>
                  <SelectTrigger data-testid="select-category">
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent>
                    {serviceCategories.map(cat => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Results Count */}
        <div className="mb-6">
          <p className="text-sm text-muted-foreground" data-testid="text-results-count">
            Showing {filteredServices.length} {filteredServices.length === 1 ? 'service' : 'services'}
          </p>
        </div>

        {/* Service Cards */}
        {filteredServices.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-16">
            {filteredServices.map((service) => (
              <Card key={service.id} className="hover-elevate active-elevate-2 transition-all flex flex-col" data-testid={`card-service-${service.id}`}>
                <CardHeader>
                  <div className="flex items-start justify-between mb-2">
                    <CardTitle className="text-lg">{service.name}</CardTitle>
                    {getTierBadge(service.tier)}
                  </div>
                  <CardDescription>{service.description}</CardDescription>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col">
                  <div className="space-y-3 mb-4">
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="w-4 h-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Turnaround:</span>
                      <span className="font-medium">{service.turnaround}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <DollarSign className="w-4 h-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Pricing:</span>
                      <span className="font-medium">{service.pricingModel}</span>
                    </div>
                  </div>

                  <div className="mb-4">
                    <p className="text-sm font-medium mb-2">Outcomes:</p>
                    <ul className="space-y-1">
                      {service.outcomes.map((outcome, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-sm">
                          <CheckCircle className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                          <span className="text-muted-foreground">{outcome}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="mt-auto pt-4 border-t">
                    <Link href={`/vendors?category=${service.category}`}>
                      <Button className="w-full" data-testid={`button-find-vendors-${service.id}`}>
                        Find Vendors
                        <ArrowRight className="ml-2 w-4 h-4" />
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-lg text-muted-foreground mb-4">
              No services found matching your search
            </p>
          </div>
        )}

        {/* Process Flow */}
        <div className="mb-16">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold mb-2">How It Works</h2>
            <p className="text-muted-foreground">Our streamlined process ensures quality and security</p>
          </div>

          <div className="grid gap-6 md:grid-cols-4">
            {processSteps.map((step) => (
              <Card key={step.step} className="text-center">
                <CardContent className="pt-6">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <step.icon className="w-8 h-8 text-primary" />
                  </div>
                  <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center mx-auto mb-3 text-sm font-bold">
                    {step.step}
                  </div>
                  <h3 className="font-semibold mb-2">{step.title}</h3>
                  <p className="text-sm text-muted-foreground">{step.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Membership Benefits */}
        <div className="mb-16">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold mb-2">Membership Benefits</h2>
            <p className="text-muted-foreground">Choose the plan that fits your business stage</p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {membershipTiers.map((tier) => (
              <Card key={tier.name} className={`${tier.popular ? 'border-primary shadow-lg' : ''}`}>
                <CardHeader>
                  {tier.popular && (
                    <Badge variant="default" className="w-fit mb-2">Most Popular</Badge>
                  )}
                  <CardTitle className="text-xl">{tier.name}</CardTitle>
                  <CardDescription>{tier.description}</CardDescription>
                  <div className="pt-2">
                    <p className="text-2xl font-bold text-primary">{tier.services}</p>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {tier.benefits.map((benefit, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm">
                        <CheckCircle className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                        <span>{benefit}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* CTA */}
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-8 text-center">
            <h3 className="text-2xl font-bold mb-2">Need help choosing a service?</h3>
            <p className="text-muted-foreground mb-6">
              Use our AI-powered recommendation engine to find the perfect services for your needs
            </p>
            <Link href="/?section=request">
              <Button size="lg" data-testid="button-get-ai-help">
                Get AI Recommendations
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

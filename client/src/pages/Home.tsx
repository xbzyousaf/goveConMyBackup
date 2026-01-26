import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { Header } from "../components/Header";
import { ServiceCategoryCard } from "../components/ServiceCategoryCard";
import { VendorCard } from "../components/VendorCard";
import { AIServiceRequestForm } from "../components/AIServiceRequestForm";
import { PricingTiers } from "../components/PricingTiers";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Scale, Users, DollarSign, Shield, Megaphone, Settings, ArrowRight, Star, CheckCircle } from "lucide-react";
import type { VendorProfile } from "@shared/schema";

export default function Home() {
  const [location] = useLocation();
  const searchParams = new URLSearchParams(location.split('?')[1]);
  const sectionParam = searchParams.get('section') as "categories" | "vendors" | "request" | "pricing" | null;
  
  const [activeSection, setActiveSection] = useState<"categories" | "vendors" | "request" | "pricing">(
    sectionParam || "categories"
  );

  useEffect(() => {
    if (sectionParam) {
      setActiveSection(sectionParam);
    }
  }, [sectionParam]);

  // Fetch real vendors from database
  const { data: vendors = [], isLoading: vendorsLoading } = useQuery<VendorProfile[]>({
    queryKey: ["/api/vendors"],
  });

  // Featured vendors (top 3 by rating)
  const featuredVendors = vendors
    .filter(v => v.isApproved)
    .sort((a, b) => Number(b.rating || 0) - Number(a.rating || 0))
    .slice(0, 3);

  const categories = [
    { id: "legal", title: "Legal & Compliance", description: "Contract review, regulatory compliance, and legal advisory services", icon: Scale, featured: true },
    { id: "hr", title: "HR & Talent", description: "Recruitment, payroll, benefits administration, and HR consulting", icon: Users },
    { id: "finance", title: "Finance & Accounting", description: "Bookkeeping, tax preparation, financial planning, and auditing", icon: DollarSign },
    { id: "cybersecurity", title: "IT & Cybersecurity", description: "System administration, security audits, and technical infrastructure", icon: Shield },
    { id: "marketing", title: "Marketing & Branding", description: "Digital marketing, brand development, and proposal writing", icon: Megaphone },
    { id: "business_tools", title: "Business Tools", description: "CRM setup, ERP implementation, and operational software", icon: Settings }
  ];

  // Count vendors per category
  const getCategoryVendorCount = (categoryId: string) => {
    return vendors.filter(v => 
      v.categories?.includes(categoryId as any) && v.isApproved
    ).length;
  };

  const testimonials = [
    {
      name: "David Rodriguez",
      company: "DefenseTech Solutions",
      text: "GovScale Alliance delivered measurable results: 30% faster contract cycle time and $5M in new awards within 12 months. The proven frameworks eliminated guesswork.",
      rating: 5
    },
    {
      name: "Lisa Wong", 
      company: "Federal Logistics Group",
      text: "The structured approach to maturity assessment and milestone tracking provided our team with a clear roadmap. We achieved 40% improvement in proposal win rates.",
      rating: 5
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header notificationCount={2} />
      
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary/10 via-background to-background py-16">
        <div className="container max-w-6xl mx-auto px-4 text-center">
          <div className="max-w-3xl mx-auto">
            <Badge variant="outline" className="mb-6">
              Trusted by 500+ Government Contractors
            </Badge>
            <h1 className="text-4xl md:text-6xl font-bold mb-6" data-testid="text-hero-title">
              Scale Your Government Contracting
              <span className="text-primary block">With Trusted Experts</span>
            </h1>
            <p className="text-xl text-muted-foreground mb-8">
              Connect with vetted service providers for legal, cybersecurity, HR, and operational support. 
              Our AI matches you with the right experts for your federal contracting needs.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                onClick={() => setActiveSection("request")}
                data-testid="button-get-started"
                className="text-lg px-8"
              >
                Get Started Free
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button 
                variant="outline" 
                size="lg"
                onClick={() => setActiveSection("vendors")}
                data-testid="button-browse-vendors" 
                className="text-lg px-8"
              >
                Browse Vendors
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Navigation Tabs */}
      <section className="border-b bg-background sticky top-14 z-30">
        <div className="container max-w-6xl mx-auto px-4">
          <nav className="flex gap-8 py-4">
            {[
              { key: "categories", label: "Service Categories" },
              { key: "vendors", label: "Featured Vendors" },  
              { key: "request", label: "AI Request" },
              { key: "pricing", label: "Pricing" }
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveSection(tab.key as any)}
                className={`font-medium py-2 px-1 border-b-2 transition-colors ${
                  activeSection === tab.key 
                    ? 'border-primary text-primary' 
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
                data-testid={`tab-${tab.key}`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </section>

      {/* Dynamic Content Sections */}
      <main className="container max-w-6xl mx-auto px-4 py-12">
        {activeSection === "categories" && (
          <div className="space-y-8">
            <div className="text-center">
              <h2 className="text-3xl font-bold mb-4">Service Categories</h2>
              <p className="text-lg text-muted-foreground">
                Discover vetted professionals across all areas of government contracting
              </p>
            </div>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {categories.map((category, index) => (
                <Link key={index} href={`/vendors?category=${category.id}`}>
                  <div className="cursor-pointer">
                    <ServiceCategoryCard 
                      {...category} 
                      vendorCount={getCategoryVendorCount(category.id)}
                    />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {activeSection === "vendors" && (
          <div className="space-y-8">
            <div className="text-center">
              <h2 className="text-3xl font-bold mb-4">Featured Vendors</h2>
              <p className="text-lg text-muted-foreground">
                Top-rated professionals ready to support your federal contracting needs
              </p>
            </div>
            {vendorsLoading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : featuredVendors.length > 0 ? (
              <>
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {featuredVendors.map((vendor, index) => (
                    <Link key={vendor.id} href={`/vendor/${vendor.id}`}>
                      <div className="cursor-pointer">
                        <VendorCard 
                          name={vendor.title}
                          title={vendor.companyName || vendor.title}
                          category={vendor.categories?.[0] || "General"}
                          rating={Number(vendor.rating) || 0}
                          reviewCount={vendor.reviewCount || 0}
                          location={vendor.location || "Remote"}
                          responseTime={vendor.responseTime || "N/A"}
                          hourlyRate={Number(vendor.hourlyRate) || 0}
                          isVerified={vendor.isApproved || false}
                          skills={vendor.skills || []}
                        />
                      </div>
                    </Link>
                  ))}
                </div>
                <div className="text-center">
                  <Link href="/vendors">
                    <Button variant="outline" size="lg" data-testid="button-view-all-vendors">
                      View All Vendors
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <p>No vendors available yet. Be the first to create a vendor profile!</p>
                <Link href="/vendor-dashboard">
                  <Button className="mt-4">Create Vendor Profile</Button>
                </Link>
              </div>
            )}
          </div>
        )}

        {activeSection === "request" && (
          <div className="space-y-8">
            <div className="text-center">
              <h2 className="text-3xl font-bold mb-4">AI-Powered Service Matching</h2>
              <p className="text-lg text-muted-foreground">
                Describe your needs and let our AI find the perfect vendors for you
              </p>
            </div>
            <div className="max-w-2xl mx-auto">
              <AIServiceRequestForm />
            </div>
          </div>
        )}

        {activeSection === "pricing" && (
          <div className="space-y-8">
            <PricingTiers />
          </div>
        )}
      </main>

      {/* Testimonials */}
      <section className="bg-muted/50 py-16">
        <div className="container max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Trusted by Government Contractors</h2>
            <p className="text-lg text-muted-foreground">
              See how <span className="gradient-text font-semibold">GovScale Alliance</span> has helped businesses scale their operations
            </p>
          </div>
          <div className="grid gap-8 md:grid-cols-2">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="p-8">
                <div className="flex items-center gap-1 mb-4">
                  {Array.from({ length: testimonial.rating }).map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-current text-yellow-400" />
                  ))}
                </div>
                <p className="text-lg mb-4 italic">"{testimonial.text}"</p>
                <div>
                  <p className="font-semibold">{testimonial.name}</p>
                  <p className="text-sm text-muted-foreground">{testimonial.company}</p>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-primary text-primary-foreground">
        <div className="container max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Accelerate Your Federal Growth?</h2>
          <p className="text-xl mb-8 opacity-90">
            Join government contractors achieving proven results through data-driven maturity frameworks and expert guidance
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              variant="secondary"
              onClick={() => setActiveSection("request")}
              data-testid="button-cta-start"
              className="text-lg px-8"
            >
              Start Your First Request
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              onClick={() => setActiveSection("pricing")}
              data-testid="button-cta-pricing"
              className="text-lg px-8 border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-primary"
            >
              View Pricing Plans
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-background py-12">
        <div className="container max-w-6xl mx-auto px-4">
          <div className="grid gap-8 md:grid-cols-4">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="h-8 w-8 rounded-md gradient-bg flex items-center justify-center">
                  <span className="text-primary-foreground font-bold text-sm">GS</span>
                </div>
                <span className="font-semibold text-lg gradient-text">GovScale Alliance</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Proven frameworks and AI-driven insights helping government contractors achieve measurable growth outcomes.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-3">Services</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>Legal & Compliance</li>
                <li>Cybersecurity</li>
                <li>HR & Talent</li>
                <li>Financial Services</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-3">Company</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>About Us</li>
                <li>Contact</li>
                <li>Careers</li>
                <li>Privacy Policy</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-3">Support</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>Help Center</li>
                <li>Documentation</li>
                <li>Community</li>
                <li>Status</li>
              </ul>
            </div>
          </div>
          <div className="border-t mt-8 pt-8 text-center text-sm text-muted-foreground">
            <p>&copy; 2024 GovScale Alliance. Proven performance. Measurable results.</p>
            <p className="mt-2">Powered by Tullis Strategic Solutions LLC</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
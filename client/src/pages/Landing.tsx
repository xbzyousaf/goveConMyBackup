import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Shield, Users, Zap, Star, CheckCircle } from "lucide-react";

export default function Landing() {
  const [, setLocation] = useLocation();

  const features = [
    {
      icon: Shield,
      title: "Vetted Professionals",
      description: "All service providers are thoroughly vetted and verified for quality assurance."
    },
    {
      icon: Zap,
      title: "AI-Powered Matching",
      description: "Our intelligent system matches you with the perfect service providers for your needs."
    },
    {
      icon: Users,
      title: "Specialized Services",
      description: "Access experts in Legal, HR, Finance, Cybersecurity, Marketing, and Business Tools."
    },
    {
      icon: Star,
      title: "Quality Guarantee",
      description: "Rated professionals with transparent reviews and secure payment processing."
    }
  ];

  const serviceCategories = [
    { name: "Legal Services", count: "200+" },
    { name: "Human Resources", count: "150+" },
    { name: "Financial Services", count: "180+" },
    { name: "Cybersecurity", count: "120+" },
    { name: "Marketing", count: "250+" },
    { name: "Business Tools", count: "300+" }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 gradient-bg rounded-lg flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">GS</span>
            </div>
            <span className="text-xl font-bold gradient-text" data-testid="text-brand-name">GovScale Alliance</span>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setLocation("/login")} data-testid="button-signin">
              Sign In
            </Button>
            <Button onClick={() => setLocation("/signup")} data-testid="button-signup">
              Sign Up
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4 text-center">
        <div className="container mx-auto max-w-4xl">
          <Badge variant="secondary" className="mb-4" data-testid="badge-trusted-by">
            Trusted by 500+ Government Contractors
          </Badge>
          <h1 className="text-5xl font-bold mb-6" data-testid="text-hero-title">
            Connect with <span className="text-primary">Vetted Service Providers</span> for Your Government Contracting Needs
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto" data-testid="text-hero-description">
            Access a curated marketplace of professional service providers specializing in government contracting. 
            From legal compliance to cybersecurity, find the expertise you need to succeed.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Button size="lg" onClick={() => setLocation("/signup")} data-testid="button-get-started">
              Get Started <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
            <Button variant="outline" size="lg" onClick={() => setLocation("/signup?intent=vendor")} data-testid="button-become-vendor">
              Become a Vendor
            </Button>
          </div>
          <p className="text-sm text-muted-foreground mt-4">
            Vendors: Your application will be AI-vetted within minutes
          </p>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 bg-muted/50">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4" data-testid="text-features-title">
              Why Choose <span className="gradient-text">GovScale Alliance</span>?
            </h2>
            <p className="text-lg text-muted-foreground" data-testid="text-features-description">
              Proven frameworks and measurable outcomes for government contractors
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <Card key={index} className="text-center" data-testid={`card-feature-${index}`}>
                <CardHeader>
                  <feature.icon className="w-12 h-12 text-primary mx-auto mb-4" />
                  <CardTitle className="text-lg" data-testid={`text-feature-title-${index}`}>
                    {feature.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription data-testid={`text-feature-description-${index}`}>
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Service Categories */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4" data-testid="text-services-title">
              Professional Services Available
            </h2>
            <p className="text-lg text-muted-foreground" data-testid="text-services-description">
              Access specialized expertise across all critical business functions
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {serviceCategories.map((category, index) => (
              <Card key={index} className="hover-elevate" data-testid={`card-service-${index}`}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-lg mb-2" data-testid={`text-service-name-${index}`}>
                        {category.name}
                      </h3>
                      <div className="flex items-center text-sm text-muted-foreground">
                        <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                        <span data-testid={`text-service-count-${index}`}>{category.count} verified providers</span>
                      </div>
                    </div>
                    <ArrowRight className="w-5 h-5 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-primary text-primary-foreground">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-3xl font-bold mb-4" data-testid="text-cta-title">
            Ready to Find Your Perfect Service Provider?
          </h2>
          <p className="text-lg mb-8" data-testid="text-cta-description">
            Join government contractors achieving measurable results through proven maturity frameworks and expert guidance.
          </p>
          <Button 
            size="lg" 
            variant="secondary" 
            onClick={() => setLocation("/signup")}
            data-testid="button-join-now"
          >
            Join GovScale Alliance Now
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8 px-4 text-center text-muted-foreground">
        <div className="container mx-auto">
          <p data-testid="text-footer">
            © 2024 GovScale Alliance. Proven performance. Measurable results.
          </p>
          <p className="mt-2">Powered by Tullis Strategic Solutions LLC</p>
        </div>
      </footer>
    </div>
  );
}
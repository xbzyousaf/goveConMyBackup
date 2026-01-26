import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Sparkles, Zap, Crown } from "lucide-react";

interface PricingTier {
  name: string;
  price: number;
  period: string;
  description: string;
  features: string[];
  popular?: boolean;
  icon: React.ReactNode;
}

interface PricingTiersProps {
  onSelectPlan?: (planName: string) => void;
}

export function PricingTiers({ onSelectPlan }: PricingTiersProps) {
  // todo: remove mock functionality
  const plans: PricingTier[] = [
    {
      name: "Startup",
      price: 99,
      period: "month",
      description: "Perfect for new government contractors",
      icon: <Sparkles className="h-5 w-5" />,
      features: [
        "5 AI service requests per month",
        "Access to basic vendor directory",
        "Email support",
        "Basic compliance templates",
        "Vendor ratings and reviews"
      ]
    },
    {
      name: "Growth",
      price: 299,
      period: "month", 
      description: "For established contractors scaling operations",
      icon: <Zap className="h-5 w-5" />,
      popular: true,
      features: [
        "20 AI service requests per month",
        "Full vendor marketplace access",
        "Priority email & chat support",
        "Advanced compliance toolkit",
        "Monthly strategy consultation",
        "Custom vendor matching",
        "Proposal template library"
      ]
    },
    {
      name: "Scale",
      price: 699,
      period: "month",
      description: "Enterprise-level support and features",
      icon: <Crown className="h-5 w-5" />,
      features: [
        "Unlimited AI service requests",
        "Premium vendor network",
        "24/7 phone & chat support",
        "Custom compliance workflows",
        "Weekly strategy sessions",
        "Dedicated account manager",
        "White-label proposals",
        "API access",
        "Custom integrations"
      ]
    }
  ];

  return (
    <div className="py-12">
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold mb-4">Choose Your Plan</h2>
        <p className="text-lg text-muted-foreground">
          Scale your government contracting operations with the right level of support
        </p>
      </div>

      <div className="grid gap-8 md:grid-cols-3 max-w-6xl mx-auto">
        {plans.map((plan, index) => (
          <Card 
            key={plan.name} 
            className={`p-8 relative ${
              plan.popular ? 'border-primary/50 bg-primary/5 scale-105' : ''
            }`}
          >
            {plan.popular && (
              <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-primary">
                Most Popular
              </Badge>
            )}
            
            <div className="text-center mb-8">
              <div className={`inline-flex p-3 rounded-lg mb-4 ${
                plan.popular ? 'bg-primary text-primary-foreground' : 'bg-muted'
              }`}>
                {plan.icon}
              </div>
              <h3 className="text-xl font-semibold mb-2">{plan.name}</h3>
              <div className="mb-4">
                <span className="text-4xl font-bold">${plan.price}</span>
                <span className="text-muted-foreground">/{plan.period}</span>
              </div>
              <p className="text-muted-foreground">{plan.description}</p>
            </div>

            <ul className="space-y-3 mb-8">
              {plan.features.map((feature, featureIndex) => (
                <li key={featureIndex} className="flex items-center gap-3">
                  <Check className="h-4 w-4 text-primary flex-shrink-0" />
                  <span className="text-sm">{feature}</span>
                </li>
              ))}
            </ul>

            <Button 
              className={`w-full ${plan.popular ? 'bg-primary' : ''}`}
              variant={plan.popular ? "default" : "outline"}
              onClick={() => {
                console.log(`Selected plan: ${plan.name}`);
                onSelectPlan?.(plan.name);
              }}
              data-testid={`button-select-plan-${plan.name.toLowerCase()}`}
            >
              {plan.popular ? "Get Started" : "Choose Plan"}
            </Button>
          </Card>
        ))}
      </div>
    </div>
  );
}
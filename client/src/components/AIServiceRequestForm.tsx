import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Sparkles, Send, DollarSign, Star, MapPin } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import type { VendorProfile } from "@shared/schema";
import { Header } from "./Header";
type ServiceRequestPayload = {
  title: string;
  category: string;
  description: string;
  priority: string;
  budget: string;
  vendorId?: string;
  serviceId?: string;
};

interface AIServiceRequestFormProps {
  onSubmit?: (request: string) => void;
  vendorId?: string;
  serviceId?: string;
}

export function AIServiceRequestForm({ onSubmit, vendorId, serviceId }: AIServiceRequestFormProps) {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [requesttitle, setTitle] = useState("");
  const [request, setRequest] = useState("");
  const [priority, setPriority] = useState("");
  const [budget, setBudget] = useState("");
  const [matches, setMatches] = useState<VendorProfile[]>([]);
  const queryClient = useQueryClient();

  const aiMatchMutation = useMutation({
    mutationFn: async (payload: ServiceRequestPayload) => {
      const res = await fetch("/api/service-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Request failed");
      }
      return data;
    },
     onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: ["/api/service-requests"],
      });
      setMatches(data.matchedVendors || []);
      toast({
        title: "Request submitted successfully",
        description: "Request submitted successfully",
      });
      onSubmit?.(data.description);
      navigate(`/`);
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Request failed",
        description: error.message,
      });
    },
  });


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!request.trim()) return;
    if (vendorId && !serviceId) {
    toast({
        variant: "destructive",
        title: "Missing service",
        description: "Please select a service before requesting a vendor.",
      });
      return;
    }
        aiMatchMutation.mutate({
          title: requesttitle,
          category: selectedCategory,
          description: request,
          priority,
          budget,
          serviceId: serviceId || undefined,
          vendorId: vendorId || undefined,
        });
    setMatches(aiMatchMutation.data?.matchedVendors || []);
    toast({
      title: "AI is processing your request",
      description: "We are finding the best vendor matches for you.",
    });
    onSubmit?.(request);
  };

  const handleViewVendor = (vendorId: string) => {
    navigate(`/vendor/${vendorId}`);
  };
  const [selectedCategory, setSelectedCategory] = useState("all");

  const handleCategoryChange = (value: string) => {
    setSelectedCategory(value);
  };
  
  const { data: service } = useQuery<any>({
    queryKey: [`/api/services/${serviceId}`],
  });

  useEffect(() => {
    if (service?.category) {
      setSelectedCategory(service.category);
    }
  }, [service]);
  const serviceCategories = [
    { id: "legal", label: "Legal & Compliance" },
    { id: "hr", label: "HR & Talent" },
    { id: "finance", label: "Finance & Accounting" },
    { id: "cybersecurity", label: "IT & Cybersecurity" },
    { id: "marketing", label: "Proposal Support" },
    { id: "business_tools", label: "Business Tools" },
  ];
  return (
    <div className="min-h-screen bg-background">
    <Header />
    <main className="container mx-auto px-4 py-8">
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="h-5 w-5 text-primary" />
        <h2 className="text-lg font-semibold">AI Service Request</h2>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Title Input */}
        <div>
          <label className="text-sm font-medium mb-2 block">Request Title</label>
          <input
            type="text"
            placeholder="Example: Website Redesign, IT Security Audit, Cloud Migration"
            value={requesttitle}
            onChange={(a) => setTitle(a.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
            data-testid="input-request-title"
          />
        </div>

        {/* Category Dropdown */}
        <div>
          <label className="text-sm font-medium mb-2 block">Category</label>
          <Select value={selectedCategory} disabled onValueChange={handleCategoryChange}>
            <SelectTrigger data-testid="select-category" className="w-full">
              <SelectValue placeholder="Select a category" />
            </SelectTrigger>
            <SelectContent>
              {serviceCategories.map((cat) => (
                <SelectItem key={cat.id} value={cat.id}>
                  {cat.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

        <div>
          <label className="text-sm font-medium mb-2 block">
            Describe what you need help with
          </label>
          <Textarea
            placeholder="Example: I need a cybersecurity audit for my federal contract compliance, specifically FISMA requirements for our IT infrastructure..."
            value={request}
            onChange={(e) => setRequest(e.target.value)}
            className="min-h-24"
            data-testid="textarea-service-request"
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="text-sm font-medium mb-2 block">Priority</label>
            <Select value={priority} onValueChange={setPriority}>
              <SelectTrigger data-testid="select-priority">
                <SelectValue placeholder="Select priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="urgent">Urgent (1-2 days)</SelectItem>
                <SelectItem value="high">High (3-7 days)</SelectItem>
                <SelectItem value="normal">Normal (1-2 weeks)</SelectItem>
                <SelectItem value="low">Low (Flexible)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Budget Range</label>
            <Select value={budget} onValueChange={setBudget}>
              <SelectTrigger data-testid="select-budget">
                <SelectValue placeholder="Select budget" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0-1000">Under $1,000</SelectItem>
                <SelectItem value="1000-5000">$1,000 - $5,000</SelectItem>
                <SelectItem value="5000-10000">$5,000 - $10,000</SelectItem>
                <SelectItem value="10000-25000">$10,000 - $25,000</SelectItem>
                <SelectItem value="25000-50000">$25,000+</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Button 
          type="submit" 
          disabled={!request.trim() || aiMatchMutation.isPending}
          className="w-full"
          data-testid="button-submit-request"
        >
          {aiMatchMutation.isPending ? (
            <>
              <Sparkles className="h-4 w-4 mr-2 animate-spin" />
              AI is finding matches...
            </>
          ) : (
            <>
              <Send className="h-4 w-4 mr-2" />
              Get AI Recommendations
            </>
          )}
        </Button>
      </form>

      {matches.length > 0 && (
        <div className="mt-6 pt-6 border-t">
          <h3 className="font-semibold mb-4">AI Matched Vendors</h3>
          <div className="space-y-4">
            {matches.map((vendor, index) => (
              <div key={vendor.id} className="border rounded-lg p-4 hover-elevate cursor-pointer" onClick={() => handleViewVendor(vendor.id)}>
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h4 className="font-medium">{vendor.title}</h4>
                    <p className="text-sm text-muted-foreground">{vendor.companyName}</p>
                  </div>
                  <Badge variant="secondary">
                    Match #{index + 1}
                  </Badge>
                </div>
                
                <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                  {vendor.hourlyRate && (
                    <div className="flex items-center gap-1">
                      <DollarSign className="h-4 w-4" />
                      <span>${vendor.hourlyRate}/hr</span>
                    </div>
                  )}
                  {vendor.rating && (
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 text-yellow-400 fill-current" />
                      <span>{vendor.rating}</span>
                    </div>
                  )}
                  {vendor.location && (
                    <div className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      <span>{vendor.location}</span>
                    </div>
                  )}
                </div>

                {vendor.skills && vendor.skills.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {vendor.skills.slice(0, 3).map((skill, idx) => (
                      <Badge key={idx} variant="outline" className="text-xs">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                )}
                
                <Button 
                  size="sm" 
                  onClick={(e) => {
                    e.stopPropagation();
                    handleViewVendor(vendor.id);
                  }}
                  data-testid={`button-view-vendor-${index}`}
                >
                  View Profile
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
    </main>
    </div>
  );
}
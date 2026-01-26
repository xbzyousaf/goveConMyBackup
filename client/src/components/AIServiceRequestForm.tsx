import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
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

interface AIServiceRequestFormProps {
  onSubmit?: (request: string) => void;
}

export function AIServiceRequestForm({ onSubmit }: AIServiceRequestFormProps) {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [request, setRequest] = useState("");
  const [priority, setPriority] = useState("");
  const [budget, setBudget] = useState("");
  const [matches, setMatches] = useState<VendorProfile[]>([]);

  const aiMatchMutation = useMutation({
    mutationFn: async (data: { description: string; priority: string; budget: string }) => {
      const response = await apiRequest("POST", "/api/ai-match", data);
      return response.json();
    },
    onSuccess: (data) => {
      setMatches(data.matches || []);
      if (data.matches?.length === 0) {
        toast({
          title: "No matches found",
          description: "Try adjusting your requirements or check back later for new vendors.",
        });
      }
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to process AI matching. Please try again.",
        variant: "destructive"
      });
      console.error("AI matching error:", error);
    }
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!request.trim()) return;

    aiMatchMutation.mutate({
      description: request,
      priority,
      budget
    });
    
    onSubmit?.(request);
  };

  const handleViewVendor = (vendorId: string) => {
    navigate(`/vendor/${vendorId}`);
  };

  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="h-5 w-5 text-primary" />
        <h2 className="text-lg font-semibold">AI Service Request</h2>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-4">
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
                <SelectItem value="under-1k">Under $1,000</SelectItem>
                <SelectItem value="1k-5k">$1,000 - $5,000</SelectItem>
                <SelectItem value="5k-10k">$5,000 - $10,000</SelectItem>
                <SelectItem value="10k-25k">$10,000 - $25,000</SelectItem>
                <SelectItem value="25k-plus">$25,000+</SelectItem>
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
  );
}
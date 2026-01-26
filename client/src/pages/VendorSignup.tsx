import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { z } from "zod";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Loader2, CheckCircle, AlertCircle, Building2, MapPin, DollarSign, Award, FileText } from "lucide-react";

const vendorSignupSchema = z.object({
  companyName: z.string().min(2, "Company name must be at least 2 characters"),
  title: z.string().min(2, "Your professional title is required"),
  description: z.string().min(50, "Please provide a detailed description (at least 50 characters)"),
  categories: z.array(z.string()).min(1, "Select at least one service category"),
  skills: z.string().min(10, "Please list your key skills and expertise"),
  location: z.string().min(2, "Location is required"),
  hourlyRate: z.string().min(1, "Hourly rate is required"),
  responseTime: z.string().min(1, "Response time is required"),
  availability: z.string().min(1, "Availability status is required"),
  yearsOfExperience: z.string().min(1, "Years of experience is required"),
  certifications: z.string().optional(),
  pastPerformance: z.string().optional(),
  businessLicense: z.string().optional(),
  insuranceInfo: z.string().optional(),
});

type VendorSignupForm = z.infer<typeof vendorSignupSchema>;

export default function VendorSignup() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [vettingStatus, setVettingStatus] = useState<"idle" | "vetting" | "approved" | "rejected">("idle");

  const form = useForm<VendorSignupForm>({
    resolver: zodResolver(vendorSignupSchema),
    defaultValues: {
      companyName: "",
      title: "",
      description: "",
      categories: [],
      skills: "",
      location: "",
      hourlyRate: "",
      responseTime: "24-48 hours",
      availability: "Available",
      yearsOfExperience: "",
      certifications: "",
      pastPerformance: "",
      businessLicense: "",
      insuranceInfo: "",
    },
  });

  const categories = [
    { value: "legal", label: "Legal & Compliance" },
    { value: "hr", label: "HR & Talent" },
    { value: "finance", label: "Finance & Accounting" },
    { value: "cybersecurity", label: "IT & Cybersecurity" },
    { value: "marketing", label: "Marketing & Branding" },
    { value: "business_tools", label: "Business Tools" },
  ];

  const createVendorMutation = useMutation({
    mutationFn: async (data: VendorSignupForm) => {
      const skillsArray = data.skills.split(',').map(s => s.trim()).filter(Boolean);
      const categoriesArray = data.categories;
      const certificationsArray = data.certifications 
        ? data.certifications.split(',').map(s => s.trim()).filter(Boolean)
        : [];

      const pastPerformanceData = data.pastPerformance
        ? data.pastPerformance.split('\n\n').map((project, idx) => {
            const lines = project.split('\n');
            return {
              projectName: lines[0] || `Project ${idx + 1}`,
              client: lines[1] || "Confidential",
              description: lines.slice(2).join(' ') || "Project details",
            };
          })
        : [];

      const vendorData = {
        companyName: data.companyName,
        title: data.title,
        description: data.description,
        categories: categoriesArray,
        skills: skillsArray,
        location: data.location,
        hourlyRate: parseInt(data.hourlyRate),
        responseTime: data.responseTime,
        availability: data.availability,
        certifications: certificationsArray,
        pastPerformance: pastPerformanceData,
        isApproved: false, // Will be vetted
      };

      // Create vendor profile
      const vendorResponse = await apiRequest("POST", "/api/vendor-profile", vendorData);
      const vendor = await vendorResponse.json();

      // Submit for AI vetting
      const vettingResp = await apiRequest("POST", "/api/vendor-profile/vet", {
        vendorId: vendor.id,
        applicationData: {
          ...vendorData,
          yearsOfExperience: data.yearsOfExperience,
          businessLicense: data.businessLicense,
          insuranceInfo: data.insuranceInfo,
        },
      });
      const vetting = await vettingResp.json();

      return { vendor, vetting };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/vendor-profile"] });
      setVettingStatus(data.vetting.approved ? "approved" : "rejected");
      
      if (data.vetting.approved) {
        toast({
          title: "Application Approved!",
          description: "Your vendor profile has been approved and is now live.",
        });
        setTimeout(() => {
          setLocation("/vendor-dashboard");
        }, 2000);
      } else {
        toast({
          title: "Application Under Review",
          description: data.vetting.feedback || "Our team will review your application manually.",
          variant: "default",
        });
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to submit vendor application",
        variant: "destructive",
      });
      setIsSubmitting(false);
    },
  });

  const onSubmit = async (data: VendorSignupForm) => {
    setIsSubmitting(true);
    setVettingStatus("vetting");
    await createVendorMutation.mutateAsync(data);
    setIsSubmitting(false);
  };

  if (vettingStatus === "vetting") {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-16 max-w-2xl">
          <Card>
            <CardContent className="p-12 text-center">
              <Loader2 className="w-16 h-16 animate-spin text-primary mx-auto mb-6" />
              <h2 className="text-2xl font-bold mb-4">AI Vetting in Progress</h2>
              <p className="text-muted-foreground mb-2">
                Our AI system is reviewing your application...
              </p>
              <p className="text-sm text-muted-foreground">
                This usually takes 10-30 seconds
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (vettingStatus === "approved") {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-16 max-w-2xl">
          <Card className="border-green-500">
            <CardContent className="p-12 text-center">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-6" />
              <h2 className="text-2xl font-bold mb-4">Application Approved!</h2>
              <p className="text-muted-foreground mb-6">
                Congratulations! Your vendor profile has been approved and is now live on GovScale Alliance.
              </p>
              <p className="text-sm text-muted-foreground">
                Redirecting to your dashboard...
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <Badge variant="outline" className="mb-4">Vendor Application</Badge>
          <h1 className="text-4xl font-bold mb-2" data-testid="text-page-title">
            Join <span className="gradient-text">GovScale Alliance</span> as a Vendor
          </h1>
          <p className="text-lg text-muted-foreground">
            Complete this application to offer your services to government contractors. All applications are reviewed by our AI vetting system to ensure quality and compliance.
          </p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="w-5 h-5" />
                  Business Information
                </CardTitle>
                <CardDescription>
                  Tell us about your company and professional background
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="companyName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Company Name *</FormLabel>
                      <FormControl>
                        <Input placeholder="Your company or business name" {...field} data-testid="input-company-name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Professional Title *</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Federal Contract Attorney, CMMC Consultant" {...field} data-testid="input-title" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Business Description *</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Provide a detailed description of your services, expertise, and what makes your business unique..."
                          className="min-h-32"
                          {...field}
                          data-testid="input-description"
                        />
                      </FormControl>
                      <FormDescription>
                        Minimum 50 characters. Be specific about your experience with government contracting.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="yearsOfExperience"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Years of Experience *</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="e.g., 5" {...field} data-testid="input-years-experience" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="businessLicense"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Business License / Registration</FormLabel>
                      <FormControl>
                        <Input placeholder="License number or registration details" {...field} data-testid="input-business-license" />
                      </FormControl>
                      <FormDescription>
                        Optional: Provide your business license or professional registration information
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="insuranceInfo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Insurance Information</FormLabel>
                      <FormControl>
                        <Input placeholder="Professional liability, E&O, etc." {...field} data-testid="input-insurance" />
                      </FormControl>
                      <FormDescription>
                        Optional: Professional liability or errors & omissions insurance details
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="w-5 h-5" />
                  Services & Expertise
                </CardTitle>
                <CardDescription>
                  Specify your service categories and skills
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="categories"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Service Categories * (Select all that apply)</FormLabel>
                      <div className="grid grid-cols-2 gap-3">
                        {categories.map((category) => (
                          <div key={category.value} className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              id={category.value}
                              checked={field.value?.includes(category.value)}
                              onChange={(e) => {
                                const value = category.value;
                                const current = field.value || [];
                                if (e.target.checked) {
                                  field.onChange([...current, value]);
                                } else {
                                  field.onChange(current.filter((v) => v !== value));
                                }
                              }}
                              className="rounded"
                              data-testid={`checkbox-category-${category.value}`}
                            />
                            <label htmlFor={category.value} className="text-sm cursor-pointer">
                              {category.label}
                            </label>
                          </div>
                        ))}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="skills"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Skills & Expertise *</FormLabel>
                      <FormControl>
                        <Input placeholder="FAR/DFARS compliance, GSA schedules, cybersecurity, etc. (comma-separated)" {...field} data-testid="input-skills" />
                      </FormControl>
                      <FormDescription>
                        List your key skills separated by commas
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="certifications"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Certifications</FormLabel>
                      <FormControl>
                        <Input placeholder="CISSP, PMP, CPA, Bar Licensed, etc. (comma-separated)" {...field} data-testid="input-certifications" />
                      </FormControl>
                      <FormDescription>
                        Optional: Professional certifications and licenses
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="pastPerformance"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Past Performance</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Project Name&#10;Client Name&#10;Brief description&#10;&#10;Project Name 2&#10;Client Name 2&#10;Brief description..."
                          className="min-h-32"
                          {...field}
                          data-testid="input-past-performance"
                        />
                      </FormControl>
                      <FormDescription>
                        Optional: List past projects (one per paragraph, format: Project Name, Client, Description)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  Location & Availability
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Location *</FormLabel>
                      <FormControl>
                        <Input placeholder="City, State or 'Remote'" {...field} data-testid="input-location" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="availability"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Availability Status *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-availability">
                            <SelectValue placeholder="Select availability" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Available">Available</SelectItem>
                          <SelectItem value="Busy">Busy (limited capacity)</SelectItem>
                          <SelectItem value="Booked">Fully Booked</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="responseTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Response Time *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-response-time">
                            <SelectValue placeholder="Select typical response time" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Same day">Same day</SelectItem>
                          <SelectItem value="24-48 hours">24-48 hours</SelectItem>
                          <SelectItem value="2-3 business days">2-3 business days</SelectItem>
                          <SelectItem value="3-5 business days">3-5 business days</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5" />
                  Pricing
                </CardTitle>
              </CardHeader>
              <CardContent>
                <FormField
                  control={form.control}
                  name="hourlyRate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Hourly Rate (USD) *</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="e.g., 150" {...field} data-testid="input-hourly-rate" />
                      </FormControl>
                      <FormDescription>
                        Your standard hourly rate in US dollars
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <div className="flex gap-4">
              <Button
                type="submit"
                size="lg"
                className="flex-1"
                disabled={isSubmitting}
                data-testid="button-submit-application"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Submitting for AI Review...
                  </>
                ) : (
                  <>
                    <FileText className="w-4 h-4 mr-2" />
                    Submit Application
                  </>
                )}
              </Button>
            </div>

            <p className="text-sm text-muted-foreground text-center">
              By submitting, your application will be reviewed by our AI vetting system to ensure quality standards and compliance with platform requirements.
            </p>
          </form>
        </Form>
      </main>
    </div>
  );
}

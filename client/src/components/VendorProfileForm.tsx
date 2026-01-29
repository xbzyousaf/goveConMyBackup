import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { insertVendorProfileSchema } from "@shared/schema";
import { z } from "zod";
import { X, Plus, Building, MapPin, DollarSign, Clock, Star, Badge as BadgeIcon } from "lucide-react";

const formSchema = insertVendorProfileSchema
  .omit({ userId: true })   // ✅ remove userId requirement
  .extend({
    categories: z.array(
      z.enum(["legal", "hr", "finance", "cybersecurity", "marketing", "business_tools"])
    ).min(1, "Select at least one category"),
    skills: z.array(z.string()).min(1, "Add at least one skill"),
  });

type FormData = z.infer<typeof formSchema>;

interface VendorProfileFormProps {
  defaultValues?: Partial<FormData>;
  profileId?: number; 
  mode?: "create" | "edit";
  onSuccess?: () => void;
  onCancel?: () => void;
}

const serviceCategories = [
  { id: "legal", label: "Legal & Compliance", description: "Contract review, regulatory compliance" },
  { id: "hr", label: "HR & Talent", description: "Recruitment, payroll, benefits" },
  { id: "finance", label: "Finance & Accounting", description: "Bookkeeping, tax, financial planning" },
  { id: "cybersecurity", label: "IT & Cybersecurity", description: "Security audits, system administration" },
  { id: "marketing", label: "Marketing & Branding", description: "Digital marketing, proposal writing" },
  { id: "business_tools", label: "Business Tools", description: "CRM, ERP, operational software" },
];

export function VendorProfileForm({defaultValues,profileId, mode = "create", onSuccess, onCancel }: VendorProfileFormProps) {
  const [skillInput, setSkillInput] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      companyName: "",
      title: "",
      description: "",
      location: "",
      hourlyRate: "",
      responseTime: "2-4 hours",
      skills: [],
      categories: [],
      avatar: "",
      ...defaultValues,
    },
  });
useEffect(() => {
  if (defaultValues) {
    form.reset({
      companyName: defaultValues.companyName ?? "",
      title: defaultValues.title ?? "",
      description: defaultValues.description ?? "",
      location: defaultValues.location ?? "",
      hourlyRate: defaultValues.hourlyRate ?? "",
      responseTime: defaultValues.responseTime ?? "2-4 hours",
      skills: defaultValues.skills ?? [],
      categories: defaultValues.categories ?? [],
      avatar: defaultValues.avatar ?? "",
    });
  }
}, [defaultValues, form]);
  const createProfileMutation = useMutation({
    mutationFn: async (data: FormData) => {
      return mode === "edit"
      ? apiRequest("PUT", `/api/vendor-profile/${profileId}`, data)
      : apiRequest("POST", "/api/vendor-profile", data);
    },
    onSuccess: () => {
      toast({
        title: "Profile created successfully!",
        description: "Your vendor profile has been submitted for review.",
      });
      // Invalidate both vendor list and profile queries
      queryClient.invalidateQueries({ queryKey: ["/api/vendors"] });
      queryClient.invalidateQueries({ queryKey: ["/api/vendor-profile"] });
      form.reset();
      onSuccess?.();
    },
    onError: (error) => {
      toast({
        title: "Error creating profile",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: FormData) => {
    createProfileMutation.mutate(data);
  };

  const addSkill = () => {
    if (skillInput.trim()) {
      const currentSkills = form.getValues("skills");
      if (!currentSkills.includes(skillInput.trim())) {
        form.setValue("skills", [...currentSkills, skillInput.trim()]);
        setSkillInput("");
      }
    }
  };

  const removeSkill = (skillToRemove: string) => {
    const currentSkills = form.getValues("skills");
    form.setValue("skills", currentSkills.filter(skill => skill !== skillToRemove));
  };

  const selectedCategories = form.watch("categories");
  const currentSkills = form.watch("skills");

  return (
    <Card className="max-w-4xl mx-auto" data-testid="card-vendor-profile-form">
      <CardHeader>
        <CardTitle className="flex items-center gap-2" data-testid="text-form-title">
          <BadgeIcon className="w-5 h-5" />
          Create Vendor Profile
        </CardTitle>
        <CardDescription data-testid="text-form-description">
          Set up your professional profile to connect with government contractors seeking your services.
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(
              (data) => {
                onSubmit(data);
              },
              (errors) => {
                console.log("FORM ERRORS", errors);
                toast({
                  title: "Submit Failed",
                  description: "Failed to submit form. Please try again.",
                  variant: "destructive",
                });
              }
            )}
          >
            {/* Company Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2" data-testid="text-section-company">
                <Building className="w-4 h-4" />
                Company Information
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="companyName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Company Name (Optional)</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Your company or freelance name"
                          data-testid="input-company-name"
                          {...field} 
                        />
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
                        <Input 
                          placeholder="e.g., Federal Contract Attorney"
                          data-testid="input-title"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Professional Description</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Describe your expertise, experience, and what makes you unique..."
                        className="min-h-24"
                        data-testid="input-description"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Location and Pricing */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2" data-testid="text-section-details">
                <MapPin className="w-4 h-4" />
                Location & Pricing
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Location</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="City, State"
                          data-testid="input-location"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="hourlyRate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Hourly Rate</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input 
                            placeholder="150"
                            className="pl-10"
                            data-testid="input-hourly-rate"
                            {...field} 
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="responseTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Response Time</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-response-time">
                            <Clock className="w-4 h-4 mr-2" />
                            <SelectValue placeholder="Select response time" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="1-2 hours">1-2 hours</SelectItem>
                          <SelectItem value="2-4 hours">2-4 hours</SelectItem>
                          <SelectItem value="4-8 hours">4-8 hours</SelectItem>
                          <SelectItem value="8-24 hours">8-24 hours</SelectItem>
                          <SelectItem value="1-2 days">1-2 days</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Service Categories */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold" data-testid="text-section-categories">
                Service Categories *
              </h3>
              <p className="text-sm text-muted-foreground">
                Select the categories that best describe your services
              </p>
              
              <FormField
                control={form.control}
                name="categories"
                render={() => (
                  <FormItem>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {serviceCategories.map((category) => (
                        <FormField
                          key={category.id}
                          control={form.control}
                          name="categories"
                          render={({ field }) => {
                            return (
                              <FormItem
                                key={category.id}
                                className="flex flex-row items-start space-x-3 space-y-0"
                              >
                                <FormControl>
                                  <Checkbox
                                    data-testid={`checkbox-category-${category.id}`}
                                    checked={field.value?.includes(category.id as any)}
                                    onCheckedChange={(checked) => {
                                      return checked
                                        ? field.onChange([...field.value, category.id])
                                        : field.onChange(
                                            field.value?.filter(
                                              (value) => value !== category.id
                                            )
                                          );
                                    }}
                                  />
                                </FormControl>
                                <div className="space-y-1 leading-none">
                                  <FormLabel className="font-medium">
                                    {category.label}
                                  </FormLabel>
                                  <FormDescription>
                                    {category.description}
                                  </FormDescription>
                                </div>
                              </FormItem>
                            );
                          }}
                        />
                      ))}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Skills */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold" data-testid="text-section-skills">
                Skills & Expertise *
              </h3>
              
              <div className="flex gap-2">
                <Input
                  placeholder="Add a skill (e.g., Contract Review)"
                  value={skillInput}
                  onChange={(e) => setSkillInput(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addSkill();
                    }
                  }}
                  data-testid="input-skill"
                />
                <Button 
                  type="button" 
                  onClick={addSkill}
                  variant="outline"
                  data-testid="button-add-skill"
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              
              <div className="flex flex-wrap gap-2">
                {currentSkills.map((skill, index) => (
                  <Badge key={index} variant="secondary" className="flex items-center gap-1" data-testid={`badge-skill-${index}`}>
                    {skill}
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-4 w-4 p-0 hover:bg-transparent"
                      onClick={() => removeSkill(skill)}
                      data-testid={`button-remove-skill-${index}`}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </Badge>
                ))}
              </div>
              
              {form.formState.errors.skills && (
                <p className="text-sm text-destructive" data-testid="error-skills">
                  {form.formState.errors.skills.message}
                </p>
              )}
            </div>

            {/* Form Actions */}
            <div className="flex gap-4 justify-end">
              {onCancel && (
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={onCancel}
                  data-testid="button-cancel"
                >
                  Cancel
                </Button>
              )}
              <Button type="submit" disabled={createProfileMutation.isPending}>
                {createProfileMutation.isPending
                  ? mode === "edit" ? "Updating..." : "Creating..."
                  : mode === "edit" ? "Update Profile" : "Create Profile"}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
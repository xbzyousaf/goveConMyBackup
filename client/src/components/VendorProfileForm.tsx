import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { insertVendorProfileSchema } from "@shared/schema";
import { z } from "zod";
import { X, Plus, Building, MapPin, DollarSign, Clock, Star, Badge as BadgeIcon, Phone, PhoneForwarded, Layers, LocateIcon, MapPinned, MapPinHouse, MapPinCheckInside, MapPinCheck } from "lucide-react";
import { AvatarFallback, AvatarImage } from "@radix-ui/react-avatar";
import { Avatar } from "./ui/avatar";
import { useLocation } from "wouter";

const formSchema = insertVendorProfileSchema
  .omit({ userId: true, responseTime: true })
  .extend({
    businessType: z.enum([
      "commercial",
      "government",
      "both",
    ]),
    addressLine1: z.string().optional(),
    addressLine2: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    postalCode: z.string().optional(),
    phone: z.string().optional(),
    categoryIds: z.array(z.string()).min(1, "Select at least one category"),
    skills: z.array(z.string()).min(1, "Add at least one skill"),
    agenciesServed: z.array(z.string()).optional(),
    availability: z.number().optional(),
    location: z.string().optional(),
  });

type VendorProfileFormValues = z.infer<typeof formSchema>;

interface VendorProfileFormProps {
  defaultValues?: Partial<VendorProfileFormValues>;
  profileId?: number; 
  mode?: "create" | "edit";
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function VendorProfileForm({defaultValues,profileId, mode = "create", onSuccess, onCancel }: VendorProfileFormProps) {
  const [skillInput, setSkillInput] = useState("");
  const [agencyInput, setAgencyInput] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
   const { data: categories = [], isLoading, error } = useQuery({
    queryKey: ["/api/admin/categories"],
    queryFn: async () => {
      const res = await fetch("/api/admin/categories");
      const json = await res.json();
      return Array.isArray(json) ? json : json.data || [];
    },
  });

  const { data: user, isLoading: isUserLoading,} = useQuery<any>({
    queryKey: ['/api/auth/current-user'],
  });

  const serviceCategories = categories;

  const form = useForm<VendorProfileFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      companyName: "",
      description: "",
      hourlyRate: "",
      businessType: "commercial",
      phone: "", 
      skills: [],
      categoryIds: [],
      avatar: "",
      yearsOfExperience: "",
      agenciesServed: [],
      availability: 1,
      location: "",
      addressLine1: "",
      addressLine2: "",
      city: "",
      state: "",
      postalCode: "",
    },
  });
  
  const [imagePreview, setImagePreview] = useState<string>("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    setImagePreview(URL.createObjectURL(file));
  };
  
useEffect(() => {
  if (defaultValues) {
    form.reset({
      companyName: defaultValues.companyName ?? "",
      description: defaultValues.description ?? "",
      hourlyRate: defaultValues.hourlyRate ?? "",
      phone: defaultValues.phone ?? "",
      skills: defaultValues.skills ?? [],
      categoryIds: defaultValues.categoryIds ?? [],
      avatar: defaultValues.avatar ?? "",
      businessType: defaultValues.businessType || "commercial",
      yearsOfExperience: defaultValues.yearsOfExperience ?? "",
      agenciesServed: defaultValues.agenciesServed ?? [],
      availability: defaultValues.availability ?? 1,
      location: defaultValues.location ?? "",
      addressLine1: defaultValues.addressLine1 ?? "",
      addressLine2: defaultValues.addressLine2 ?? "",
      city: defaultValues.city ?? "",
      state: defaultValues.state ?? "",
      postalCode: defaultValues.postalCode ?? "",
    });
  }
}, [defaultValues, form]);
  const createProfileMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const url = mode === "edit" 
        ? `/api/vendor-profile/${profileId}`
        : "/api/vendor-profile";

      // Use fetch directly for FormData upload
      const response = await fetch(url, {
        method: mode === "edit" ? "PUT" : "POST",
        body: formData,
        // IMPORTANT: Do NOT set Content-Type here, browser will set multipart/form-data
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to submit");
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: `Profile ${mode === "edit" ? "updated" : "created"} successfully!`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/vendors"] });
      queryClient.invalidateQueries({ queryKey: ["/api/vendor-profile"] });
      form.reset();
      setSelectedFile(null);        // clear file after submit
      setImagePreview("");           // reset preview
      setLocation("/"); // redirect to dashboard after success
      onSuccess?.();
    },
    onError: (error: any) => {
      toast({
        title: `Error ${mode === "edit" ? "updating" : "creating"} profile`,
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: VendorProfileFormValues) => {
    const formData = new FormData();
    console.log("businessType", data.businessType);

    formData.append("companyName", data.companyName);
    formData.append("description", data.description);
    formData.append("hourlyRate", data.hourlyRate);
    formData.append("phone", data.phone || "");
    formData.append("location", data.location || "");
    formData.append("addressLine1", data.addressLine1 || "");
    formData.append("addressLine2", data.addressLine2 || "");
    formData.append("city", data.city || "");
    formData.append("state", data.state || "");
    formData.append("postalCode", data.postalCode || "");

    formData.append("skills", JSON.stringify(data.skills));
    formData.append("categoryIds", JSON.stringify(data.categoryIds)); 
    formData.append("yearsOfExperience", data.yearsOfExperience || "");
    formData.append("agenciesServed", JSON.stringify(data.agenciesServed || []));
    formData.append("availability", String(data.availability ?? 1));
    formData.append("businessType", data.businessType || "");
    if (selectedFile) {
      formData.append("avatar", selectedFile);
    }

    createProfileMutation.mutate(formData);
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
  const addAgency = () => {
    if (agencyInput.trim()) {
      const currentAgencies = form.getValues("agenciesServed") || [];

      if (!currentAgencies.includes(agencyInput.trim())) {
        form.setValue("agenciesServed", [
          ...currentAgencies,
          agencyInput.trim(),
        ]);

        setAgencyInput("");
      }
    }
  };

  const removeAgency = (agencyToRemove: string) => {
    const currentAgencies = form.getValues("agenciesServed") || [];

    form.setValue(
      "agenciesServed",
      currentAgencies.filter(
        agency => agency !== agencyToRemove
      )
    );
  };

  const selectedCategories = form.watch("categoryIds");
  const currentSkills = form.watch("skills");
  const currentAgencies = form.watch("agenciesServed") || [];

  return (
    <Card className="max-w-4xl mx-auto card-vendor-profile" data-testid="card-vendor-profile-form">
      <CardHeader className="mt-2">
        <CardTitle className="flex items-center gap-2" data-testid="text-form-title">
          <BadgeIcon className="w-5 h-5" />
          {mode === "edit" ? "Edit" : "Create"} Profile
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
            
              {/* Headshot Upload */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">
                Logo/Headshot
              </h3>
              <div className="flex items-center space-x-4">
                <Avatar className="w-16 h-16 ">
                  <AvatarImage className="aspect-square" src={imagePreview || form.watch("avatar") || ""} />
                  <AvatarFallback className="text-lg">
                  </AvatarFallback>
                </Avatar>

                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                />

              </div>

            </div>
            {/* Company Information */}
            <div className="space-y-2 mt-6">
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
                      <FormLabel>Company Name</FormLabel>
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
  name="businessType"
  render={({ field }) => (
    <FormItem>
      <FormLabel>Market Served</FormLabel>

      <FormControl>
  <select
    {...field}
    value={field.value ?? "commercial"}
    onChange={(e) => field.onChange(e.target.value)}
    className="w-full border rounded-md p-2"
  >
          <option value="commercial">Commercial</option>
          <option value="government">Government</option>
          <option value="both">Both</option>
        </select>
      </FormControl>

      <FormMessage />
    </FormItem>
  )}
/>
                
                {/* <FormField
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
                  )} */}
                {/* /> */}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="yearsOfExperience"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Years of Experience</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Years of Experience"
                          data-testid="input-years-of-experience"
                          {...field} 
                        />
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
                      <FormLabel>Availability</FormLabel>

                      <FormControl>
                        <select
                          {...field}
                          className="w-full border rounded-md p-2"
                          value={field.value}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                        >
                          <option value={1}>Available</option>
                          <option value={0}>Unavailable</option>
                        </select>
                      </FormControl>

                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            
              <div className="space-y-2">
                  <FormLabel>Agencies / Industries Served</FormLabel>
                    <div className="flex gap-2">
                      <Input
                      placeholder="Add an agency and press Enter"
                      value={agencyInput}
                      onChange={(e) => setAgencyInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addAgency();
                        }
                      }}
                  />

                  <Button
                    type="button"
                    variant="outline"
                    onClick={addAgency}
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>

                <div className="flex flex-wrap gap-2">
                  {currentAgencies.map((agency, index) => (
                    <Badge
                      key={index}
                      variant="secondary"
                      className="flex items-center gap-1"
                    >
                      {agency}

                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-4 w-4 p-0 hover:bg-transparent"
                        onClick={() => removeAgency(agency)}
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </Badge>
                  ))}
                </div>
              </div>

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Company Description</FormLabel>
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
            <div className="space-y-2 mt-6">
              <h3 className="text-lg font-semibold flex items-center gap-2" data-testid="text-section-details">
                <PhoneForwarded className="w-4 h-4" />
                Contact {user?.userType !== "contractor" ? "& Pricing" : ""}
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input 
                            placeholder="+1 234 567 890"
                            className="pl-10"
                            data-testid="input-phone"
                            {...field} 
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                { user?.userType !== "contractor" && (
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
                )}
              </div>
              {/* <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
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
              </div> */}
            </div>
            <div className="space-y-2 mt-6">
              <h3 className="text-lg font-semibold flex items-center gap-2" data-testid="text-section-details">
                <MapPinned className="w-4 h-4" />
                Address Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="addressLine1"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Address Line 1</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input 
                            placeholder="e.g., 123 Main St"
                            className="pl-10"
                            data-testid="input-address-line-1"
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
                  name="addressLine2"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Address Line 2</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <LocateIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input 
                            placeholder="e.g., Apartment 4B"
                            className="pl-10"
                            data-testid="input-address-line-2"
                            {...field} 
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>City</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <MapPinHouse className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input 
                            placeholder="e.g., New York"
                            className="pl-10"
                            data-testid="input-city"
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
                  name="state"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>State</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <MapPinCheckInside className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input 
                            placeholder="e.g., NY"
                            className="pl-10"
                            data-testid="input-state"
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
                  name="postalCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Postal Code</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <MapPinCheck className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input 
                            placeholder="e.g., 10001"
                            className="pl-10"
                            data-testid="input-postal-code"
                            {...field} 
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Service Categories */}
            <div className="mt-6">
              <div className="flex gap-2 items-center mb-2">
                <Layers className="w-4 h-4" />
                <h3 className="text-lg font-semibold" data-testid="text-section-categories">
                  Service Categories *
                </h3>
              </div>
              
              <p className="text-sm text-muted-foreground mb-4">
                Select the categories that best describe your services
              </p>
              
              <FormField
                control={form.control}
                name="categoryIds"
                render={() => (
                  <FormItem>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {serviceCategories.map((category: any) => (
                        <FormField
                          key={category.id}
                          control={form.control}
                          name="categoryIds"
                          render={({ field }) => {
                            return (
                              <FormItem
                                key={category.id}
                                className="flex flex-row items-start space-x-3 space-y-0"
                              >
                                <FormControl>
                                  <Checkbox
                                    data-testid={`checkbox-category-${category.id}`}
                                    checked={field.value?.includes(category.id)}
                                    onCheckedChange={(checked) => {
                                      return checked
                                        ? field.onChange([...field.value, category.id])
                                        : field.onChange(
                                            field.value?.filter((value) => value !== category.id)
                                          );
                                    }}
                                  />
                                </FormControl>
                                <div className="space-y-1 leading-none">
                                  <FormLabel className="font-medium">
                                    {category.name}
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
            <div className="space-y-4 mt-4">
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
            <div className="flex gap-4 justify-end mt-4">
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
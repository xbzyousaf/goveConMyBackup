import { useRoute, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import {Card, CardHeader, CardTitle, CardContent, CardDescription,} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {FileText, User, DollarSign, CalendarDays, Check, X, CheckCircle, MessageSquare, ArrowLeft,} from "lucide-react";
import { cn } from "@/lib/utils";
import {Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger,} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { useMessages } from "@/components/ui/MessageContext";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Header } from "@/components/Header";
import { Star } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { ServiceRequestCard } from "@/components/service-requests/ServiceRequestCard";

export default function RequestDetails() {
  const [, params] = useRoute("/vendor/requests/:id");
  const id = params?.id;
  const { openConversation } = useMessages();
  const [, setLocation] = useLocation();
  const [confirmAction, setConfirmAction] = useState<{
    id: string;
    status: "in_progress" | "cancelled";
  } | null>(null);
  const { user } = useAuth();
  const [isExtendOpen, setIsExtendOpen] = useState(false);
  const [newDeliveryDate, setNewDeliveryDate] = useState(
    new Date().toISOString().split("T")[0] // today
  );
  const [extendReason, setExtendReason] = useState("");

  const { data: request, isLoading } = useQuery({
    queryKey: ["service-request", id],
    queryFn: async () => {
      const res = await fetch(`/api/service-requests/${id}`);
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    enabled: !!id,
  });
  const [isDeliverOpen, setIsDeliverOpen] = useState(false);
    const [deliveryMessage, setDeliveryMessage] = useState("");
    const [attachment, setAttachment] = useState<File | null>(null);

    const isDelivered = request?.status === "delivered";
    const queryClient = useQueryClient();
    const { toast } = useToast();
    const updateStatus = useMutation({
    mutationFn: async ({ status }: { status: string }) => {
        const res = await fetch(`/api/service-requests/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
        });

        if (!res.ok) throw new Error("Failed to update status");

        return res.json();
        },
        onSuccess: () => {
            toast({
            title: "Status Updated",
            description: "Service request updated successfully",
            });

            queryClient.invalidateQueries({ queryKey: ["service-request", id] });
            queryClient.invalidateQueries({ queryKey: ["/api/service-requests"] });
        },
    });
    const extendDelivery = useMutation({
      mutationFn: async () => {
        const res = await fetch(
          `/api/service-requests/${request.id}/extend`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              newDeliveryDate,
              reason: extendReason,
            }),
          }
        );

        if (!res.ok) {
          const error = await res.json().catch(() => null);
          throw new Error(error?.message || "Failed to extend delivery");
        }

        return res.json();
      },
      onSuccess: () => {
        toast({
          title: "Delivery Extended",
          description: "New delivery date submitted successfully.",
        });

        queryClient.invalidateQueries({
          queryKey: ["service-request", request.id],
        });

        setIsExtendOpen(false);
        setExtendReason("");
      },
      onError: (err: any) => {
        toast({
          title: "Error",
          description: err.message,
          variant: "destructive",
        });
      },
    });

    const [reviewModal, setReviewModal] = useState(false);
    const [rating, setRating] = useState(5);
    const [comment, setComment] = useState("");
    const submitReview = useMutation({
  mutationFn: async () => {
    const res = await fetch("/api/reviews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        serviceRequestId: request.id,
        revieweeId: request.contractorId, // vendor reviews contractor
        rating,
        comment,
      }),
    });

    if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.message || "Failed to submit review");
    }

    return res.json();
  },
  onSuccess: () => {
  toast({
    title: "Feedback Submitted",
    description: "Your review has been submitted successfully",
  });

  queryClient.invalidateQueries({ queryKey: ["service-request", id] });

  setReviewModal(false);
  setRating(5);
  setComment("");
},
onError: (error: any) => {
  toast({
    title: "Error",
    description: error.message,
    variant: "destructive",
  });
},
});

  if (isLoading) return <p>Loading...</p>;
  if (!request) return <p>Not found</p>;
  const alreadyReviewed = request.alreadyReviewed;

const handleDeliver = async () => {
  try {
    if (!deliveryMessage.trim()) {
      toast({
        title: "Validation Error",
        description: "Please write delivery message",
        variant: "destructive",
      });
      return;
    }
    let uploadedAttachment = null;
    // 1️⃣ Upload file if exists
    if (attachment) {
      const formData = new FormData();
      formData.append("file", attachment);
      const uploadRes = await fetch("/api/upload", {
        method: "POST",
        body: formData,
        credentials: "include"
      });
      if (!uploadRes.ok) {
        throw new Error("File upload failed");
      }
      uploadedAttachment = await uploadRes.json();
      // expected: { filePath, fileName, fileSize }
    }
    // 2️⃣ Call deliver API
    const res = await fetch(`/api/service-requests/${request.id}/deliver`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({
        message: deliveryMessage,
        attachments: uploadedAttachment ? [uploadedAttachment] : [],
      }),
    });
    

     if (!res.ok) {
      const errorData = await res.json().catch(() => null);
      throw new Error(errorData?.message || "Delivery failed");
    }

    // ✅ Success Toast
    toast({
      title: "Delivered Successfully",
      description: "Your work has been delivered to the client.",
    });
    // Optional: refresh request
    queryClient.invalidateQueries({
      queryKey: ["service-request", request.id],
    });

    setIsDeliverOpen(false);
    setDeliveryMessage("");
    setAttachment(null);
  } catch (err:any) {
    console.error(err);
    toast({
      title: "Delivery Failed",
      description: err.message || "Something went wrong",
      variant: "destructive",
    });
  }
};

  return (
    <div className="min-h-screen bg-background">
            <Header />
        <div className="max-w-6xl mx-auto p-6 space-y-6">

            {/* Back Button */}
            <Button
            variant="ghost"
            onClick={() =>
              setLocation(user?.userType === "vendor" ? "/vendor-dashboard" : "/dashboard")
            }
            className="flex items-center gap-2 mb-6"
            >
            <ArrowLeft className="w-4 h-4" />
            Back
            </Button>

            {/* Two Column Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* ================= LEFT SIDE (Main Details) ================= */}
            <div className="lg:col-span-2">
                <ServiceRequestCard
                  key={request.id}
                  request={request}
                  userType={user?.userType}
                />
                {/* ================= CONTRACTOR DELIVERY VIEW ================= */}
                {user?.userType === "contractor" && (
                  <Card className="rounded-2xl shadow-md mt-6">
                    <CardHeader>
                      <CardTitle className="text-lg font-semibold">Deliveries</CardTitle>
                      <CardDescription>View messages and files from the vendor</CardDescription>
                      <hr />
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {request.deliveries && request.deliveries.length > 0 ? (
                        request.deliveries.map((delivery: any, idx: number) => (
                          <div key={idx} className="p-3 border rounded-md bg-gray-50 space-y-2">
                            <p className="font-medium">{delivery.message}</p>
                            {delivery.attachments?.length > 0 && (
                              <div className="flex flex-col gap-1">
                                {delivery.attachments.map((file: any, i: number) => (
                                  <a
                                    key={i}
                                    href={file.filePath}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-600 underline"
                                  >
                                    {file.fileName}
                                  </a>
                                ))}
                              </div>
                            )}
                          </div>
                        ))
                      ) : (
                        <p className="text-muted-foreground">No deliveries yet</p>
                      )}

                      { request.status === "delivered" && (
                        <Button
                          className="w-full mt-2"
                          variant="success"
                          onClick={() => {
                            setConfirmAction({
                            id: request.id,
                            status: "completed",
                            });
                        }}
                        >
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Mark as Completed
                        </Button>
                      )}

                    </CardContent>
                  </Card>
                  )}
            </div>


            {/* ================= RIGHT SIDE (Action Panel) ================= */}
            <div className="space-y-6 ">

                {/* Service Summary Card */}
                <Card className="rounded-2xl shadow-md">
                <CardHeader>
                    <p className="text-muted-foreground mb-1">
                        Service
                    </p>
                    <CardTitle className="font-semibold text-lg">
                        {request.service?.name}
                    </CardTitle>
                    <CardDescription>
                        {request.service?.description}
                    </CardDescription>
                    <hr />
                </CardHeader>

                <CardContent className="space-y-4 text-sm">

                    {/* Hardcoded Timer */}
                    <div>
                    <p className="text-muted-foreground mb-1">
                        Time left to deliver
                    </p>
                    <div className="font-semibold text-lg">
                        02 Days 12 Hours 30 Minutes
                    </div>
                    </div>

                    <Dialog open={isExtendOpen} onOpenChange={setIsExtendOpen}>
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full"
                          disabled={
                            request.status !== "in_progress" ||
                            user?.userType !== "vendor"
                          }
                        >
                          Extend delivery date
                        </Button>
                      </DialogTrigger>

                      <DialogContent className="sm:max-w-lg">
                        <DialogHeader>
                          <DialogTitle>Extend Delivery Date</DialogTitle>
                        </DialogHeader>

                        <div className="space-y-4 mt-4">
                          
                          {/* Date Field */}
                          <div>
                            <label className="text-sm font-medium mb-2 block">
                              New Delivery Date
                            </label>
                            <Input
                              type="date"
                              value={newDeliveryDate}
                              min={new Date().toISOString().split("T")[0]}
                              onChange={(e) => setNewDeliveryDate(e.target.value)}
                            />
                          </div>

                          {/* Reason Field */}
                          <div>
                            <label className="text-sm font-medium mb-2 block">
                              Reason
                            </label>
                            <Textarea
                              rows={4}
                              placeholder="Explain why you need to extend the delivery..."
                              value={extendReason}
                              onChange={(e) => setExtendReason(e.target.value)}
                            />
                          </div>
                        </div>

                        <DialogFooter className="mt-6">
                          <Button variant="outline" onClick={() => setIsExtendOpen(false)}>
                            Cancel
                          </Button>

                          <Button
                            disabled={!extendReason.trim()}
                            onClick={() => extendDelivery.mutate()}
                          >
                            Submit Request
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>

                    <Dialog open={isDeliverOpen} onOpenChange={setIsDeliverOpen}>
                        <DialogTrigger asChild>
                          <Button
                            className="w-full"
                            disabled={request.status !== "in_progress" || user?.userType !== "vendor"}
                          >
                            {isDelivered ? "Re-Deliver" : "Deliver Now"}
                          </Button>
                        </DialogTrigger>


                        <DialogContent className="sm:max-w-lg">
                            <DialogHeader>
                            <DialogTitle>
                                {isDelivered ? "Re-Deliver Work" : "Deliver Work"}
                            </DialogTitle>
                            </DialogHeader>

                            <div className="space-y-4 mt-4">

                            {/* Message */}
                            <div>
                                <label className="text-sm font-medium mb-2 block">
                                Delivery Message
                                </label>
                                <Textarea
                                rows={6}
                                placeholder="Describe what you are delivering..."
                                value={deliveryMessage}
                                onChange={(e) => setDeliveryMessage(e.target.value)}
                                />
                            </div>

                            {/* Attachment */}
                            <div>
                                <label className="text-sm font-medium mb-2 block">
                                Attach Files
                                </label>
                                <Input className="cursor-pointer"
                                type="file"
                                onChange={(e) =>
                                    setAttachment(e.target.files?.[0] ?? null)
                                }
                                />
                            </div>

                            </div>

                            <DialogFooter className="mt-6">
                            <Button
                                variant="outline"
                                onClick={() => setIsDeliverOpen(false)}
                            >
                                Cancel
                            </Button>

                            <Button onClick={handleDeliver}>
                                {isDelivered ? "Re-Deliver" : "Deliver"}
                            </Button>

                            </DialogFooter>
                        </DialogContent>
                        </Dialog>
                        {request.status === "completed" && !alreadyReviewed && (
                            <Button
                                className="mt-4 w-full bg-green-600 hover:bg-green-700 text-white"
                                onClick={() => setReviewModal(true)}
                            >
                                Leave Feedback
                            </Button>
                            )}

                            {request.status === "completed" && alreadyReviewed && (
                            <Badge className="mt-4 w-full justify-center bg-green-100 text-green-700">
                                Feedback Submitted
                            </Badge>
                            )}


                </CardContent>
                
                </Card>


                {/* Contractor Info Card */}
                <Card className="rounded-2xl shadow-md">
                <CardContent className="p-5 space-y-4">

                    <div>
                    <p className="text-sm text-muted-foreground mb-2">
                        Contractor
                    </p>
                    <div className="flex gap-3 items-center">
                        <div className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center font-semibold">
                            {request.contractor?.firstName?.charAt(0)?.toUpperCase() ?? "U"}
                        </div>
                        <div className="">
                            <p className="font-medium">
                                {request.contractor?.firstName
                                ? `${request.contractor.firstName} ${request.contractor.lastName ?? ""}`
                                : "Not assigned"}
                            </p>
                            <p className="text-sm text-muted-foreground">@
                                {request.contractor?.username
                                ? `${request.contractor.username}`
                                : "Not assigned"}
                            </p>
                            <p className="text-sm text-muted-foreground">Last Seen:
                                5 sec ago
                            </p>
                        </div>
                        
                    </div>
                        
                    </div>

                    {/* Message Button */}
                    <Button variant="secondary" className="w-full"
                        onClick={() => openConversation(request.id)}
                        >
                        <MessageSquare className="w-4 h-4 mr-2" />
                        Message
                    </Button>

                </CardContent>
                </Card>


                {/* Status Action Card */}
                {user?.userType === "vendor" && (
                <Card className="rounded-2xl shadow-md">
                <CardContent className="p-5 space-y-3">
    
                    <Button
                        disabled={
                            user?.userType !== "vendor" ||
                            request.status === "in_progress" ||
                            request.status === "completed" ||
                            request.status === "delivered"
                        }
                        className="w-full"
                        onClick={() => {
                            setConfirmAction({
                            id: request.id,
                            status: "in_progress",
                            });
                        }}
                        >
                        <Check className="w-4 h-4 mr-2" />
                        Approve
                    </Button>
                    <Button
                        variant="destructive"
                        disabled={
                            request.status === "completed" 
                        }
                        className="w-full"
                        onClick={() => {
                            setConfirmAction({
                            id: request.id,
                            status: "cancelled",
                            });
                        }}
                        >
                        <X className="w-4 h-4 mr-2" />
                        Cancel
                    </Button>



                </CardContent>
                </Card>
                )}

            </div>
            </div>
        </div>{reviewModal && (
  <div className="fixed inset-0 z-50 flex items-center justify-center">
    <div
      className="absolute inset-0 bg-black/40"
      onClick={() => setReviewModal(false)}
    />

    <div className="relative bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
      <h3 className="text-lg font-semibold mb-4">
        Leave Feedback
      </h3>

      {/* Star Rating */}
      <div className="flex items-center gap-2 mb-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star
            key={i}
            onClick={() => setRating(i + 1)}
            className={`w-6 h-6 cursor-pointer ${
              i < rating
                ? "text-yellow-400 fill-current"
                : "text-muted-foreground"
            }`}
          />
        ))}
      </div>

      {/* Comment */}
      <textarea
        className="w-full border rounded-lg p-2 text-sm mb-4"
        rows={4}
        placeholder="Write your feedback..."
        value={comment}
        onChange={(e) => setComment(e.target.value)}
      />

      <div className="flex justify-end gap-3">
        <Button
          variant="outline"
          onClick={() => setReviewModal(false)}
        >
          Cancel
        </Button>

        <Button
          disabled={rating === 0 || submitReview.isPending}
          onClick={() => submitReview.mutate()}
        >
          Submit Review
        </Button>
      </div>
    </div>
  </div>
)}
{confirmAction && (
  <Dialog open={!!confirmAction} onOpenChange={() => setConfirmAction(null)}>
    <DialogContent>
      <DialogHeader>
        <DialogTitle>
          Confirm Action
        </DialogTitle>
      </DialogHeader>

      <p className="text-sm text-muted-foreground">
        Are you sure you want to change status to{" "}
        <strong>{confirmAction.status.replace("_", " ")}</strong>?
      </p>

      <DialogFooter>
        <Button
          variant="outline"
          onClick={() => setConfirmAction(null)}
        >
          Cancel
        </Button>

        <Button
          onClick={() => {
            updateStatus.mutate({ status: confirmAction.status });
            setConfirmAction(null);
          }}
        >
          Confirm
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
)}


    </div>
    
    );
    

}

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

export default function RequestDetails() {
  const [, params] = useRoute("/vendor/requests/:id");
  const id = params?.id;
  const { openConversation } = useMessages();
  const [, setLocation] = useLocation();
  const [confirmAction, setConfirmAction] = useState<{
    id: string;
    status: "in_progress" | "cancelled";
  } | null>(null);


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
      alert("Please write delivery message");
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
      throw new Error("Delivery failed");
    }

    // 3️⃣ Refresh request or update local state
    // example:
    // refetchRequest();

    setIsDeliverOpen(false);
  } catch (err) {
    console.error(err);
    alert("Something went wrong while delivering");
  }
};

  return (
    <div className="min-h-screen bg-background">
            <Header />
        <div className="max-w-7xl mx-auto py-8 px-4">

            {/* Back Button */}
            <Button
            variant="ghost"
            onClick={() => setLocation("/vendor-dashboard")}
            className="flex items-center gap-2 mb-6"
            >
            <ArrowLeft className="w-4 h-4" />
            Back
            </Button>

            {/* Two Column Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* ================= LEFT SIDE (Main Details) ================= */}
            <div className="lg:col-span-2">
                <Card className="rounded-2xl shadow-md">
                <CardHeader>
                    <div className="flex items-start justify-between gap-3">
                    <CardTitle className="flex items-start gap-2">
                        <FileText className="w-4 h-4 mt-1 text-muted-foreground flex-shrink-0" />
                    <h2 className="font-semibold text-lg mb-2">
                        {request.title ?? "Untitled Request"}
                    </h2>
                    </CardTitle>

                    <Badge
                        className={cn(
                        "capitalize text-xs font-medium",
                        request.status === "completed" &&
                            "bg-green-100 text-green-700",
                        request.status === "in_progress" &&
                            "bg-blue-100 text-blue-700",
                        request.status === "pending" &&
                            "bg-amber-100 text-amber-700"
                        )}
                    >
                        {request.status?.replace("_", " ") ?? "Unknown"}
                    </Badge>
                    </div>


                </CardHeader>

                <CardContent className="space-y-6">

                    {/* Title */}
                    <div>
                        
                    <p className="text-muted-foreground">
                        {request.description ?? "No description provided"}
                    </p>
                    </div>

                    {/* Meta Info */}
                    <div className="space-y-3 border-t pt-4 text-sm">

                        {/* Budget */}
                        <div className="flex justify-between text-sm">
                            <div className="flex gap-2">
                            <DollarSign className="w-4 h-4 text-muted-foreground" />
                            <span className="text-muted-foreground">Budget:</span>
                            </div>
                            <div>
                            <span className="font-medium">
                                {request?.budget
                                ? `${(request.budget ?? 0).toLocaleString()}`
                                : "Not specified"}
                            </span>
                            </div>
                        </div>

                        {/* Created Date */}
                        <div className="flex justify-between text-sm">
                            <div className="flex gap-2">
                            <CalendarDays className="w-4 h-4 text-muted-foreground" />
                            <span className="text-muted-foreground">Created:</span>
                            </div>
                            <div>
                            <span className="font-medium">
                                {request.createdAt
                                ? new Date(request.createdAt).toLocaleDateString()
                                : "N/A"}
                            </span>
                            </div>
                        </div>

                    </div>

                </CardContent>
                </Card>
            </div>


            {/* ================= RIGHT SIDE (Action Panel) ================= */}
            <div className="space-y-6">

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

                    <Button variant="outline" className="w-full" disabled={
                            request.status == "in_progress"
                        }>
                    Extend delivery date
                    </Button>

                    <Dialog open={isDeliverOpen} onOpenChange={setIsDeliverOpen}>
                        <DialogTrigger asChild>
                            <Button className="w-full" disabled={
                            request.status == "pending"
                        }>
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
                <Card className="rounded-2xl shadow-md">
                <CardContent className="p-5 space-y-3">

                    <Button
                        disabled={
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
                            request.status === "cancelled" ||
                            request.status === "pending" ||
                            request.status === "completed" ||
                            request.status === "in_progress"
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

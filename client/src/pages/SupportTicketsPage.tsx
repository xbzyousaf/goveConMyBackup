import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";

import { Header } from "@/components/Header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "../hooks/useAuth";
import { useEffect, useState } from "react";
import { truncateText } from "../utility/textUtils";
import { UserAvatar } from "./common/UserAvatar";
import { Textarea } from "@/components/ui/textarea";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

export default function SupportTicketsPage() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [replyMessage, setReplyMessage] = useState("");
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("all");
  const LIMIT = 5;
  const [showReplyBox, setShowReplyBox] = useState(false);
  const { data, isLoading } = useQuery({
    queryKey: ["/api/support", page, status],
    queryFn: async () => {
      const endpoint =
        user?.userType === "admin"
          ? `/api/admin/support?page=${page}&limit=${LIMIT}&status=${status}`
          : `/api/support?page=${page}&limit=${LIMIT}&status=${status}`;

      const response = await fetch(endpoint);

      if (!response.ok) {
        throw new Error("Failed to load tickets");
      }

      return response.json();
    },
  });
  const tickets = data?.tickets || [];
  const total = data?.total || 0;

  const { data: selectedTicket } = useQuery({
    queryKey: ["/api/support", selectedTicketId],
    queryFn: async () => {
      const response = await fetch(`/api/support/${selectedTicketId}`);

      if (!response.ok) {
        throw new Error("Failed");
      }

      return response.json();
    },
    enabled: !!selectedTicketId,
  });
  const replyMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/support/${selectedTicketId}/reply`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: replyMessage,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message);
      }

      return data;
    },

    onSuccess: () => {
      setReplyMessage("");
      setShowReplyBox(false);

      queryClient.invalidateQueries({
        queryKey: ["/api/support", selectedTicketId],
      });

      toast({
        title: "Reply sent successfully",
      });
    },

    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  const statusMutation = useMutation({
    mutationFn: async (status: string) => {
      const response = await fetch(
        `/api/admin/support/${selectedTicketId}/status`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            status,
          }),
        },
      );

      if (!response.ok) {
        throw new Error("Failed to update status");
      }

      return response.json();
    },

    onSuccess: async () => {
      await queryClient.refetchQueries({
        queryKey: ["/api/support/stats"],
      });

      await queryClient.refetchQueries({
        queryKey: ["/api/support"],
      });

      await queryClient.refetchQueries({
        queryKey: ["/api/support", selectedTicketId],
      });

      toast({
        title: "Status updated",
      });
    },
  });
  useEffect(() => {
    if (
      tickets.length > 0 &&
      !tickets.find((t: any) => t.id === selectedTicketId)
    ) {
      setSelectedTicketId(tickets[0].id);
    }
  }, [tickets]);
  const { data: stats } = useQuery({
    queryKey: ["/api/support/stats"],

    queryFn: async () => {
      const response = await fetch("/api/support/stats");

      if (!response.ok) {
        throw new Error("Failed to load stats");
      }

      return response.json();
    },
  });
  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="max-w-6xl mx-auto px-2 py-2">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h1 className="text-2xl font-bold">Support Tickets</h1>
            <p className="text-muted-foreground text-sm">
              Manage and track your support tickets here.
            </p>
          </div>
              {user?.userType !== "admin" && (
                <Button size="sm" onClick={() => setLocation("/support/create")}>
                  New Support Request
                </Button>
              )}
        </div>

        {isLoading && <p>Loading tickets...</p>}

        <div className="grid grid-cols-12 gap-2">
          {/* Left Side - Ticket List */}
          <div className="col-span-4">
            <Card>
              <div className="flex items-center justify-between border-b overflow-x-auto">
                <button
                  onClick={() => {
                    setStatus("all");
                    setPage(1);
                  }}
                  className={`px-3 py-2 ml-2 text-xs whitespace-nowrap border-b-2 transition-colors ${
                    status === "all"
                      ? "border-primary text-primary font-medium"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
                >
                  All ({stats?.all || 0})
                </button>

                <button
                  onClick={() => {
                    setStatus("open");
                    setPage(1);
                  }}
                  className={`px-3 py-2 text-xs whitespace-nowrap border-b-2 transition-colors ${
                    status === "open"
                      ? "border-primary text-primary font-medium"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Open ({stats?.open || 0})
                </button>

                <button
                  onClick={() => {
                    setStatus("resolved");
                    setPage(1);
                  }}
                  className={`px-3 py-2 text-xs whitespace-nowrap border-b-2 transition-colors ${
                    status === "resolved"
                      ? "border-primary text-primary font-medium"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Resolved ({stats?.resolved || 0})
                </button>

                <button
                  onClick={() => {
                    setStatus("closed");
                    setPage(1);
                  }}
                  className={`px-3 py-2 mr-2 text-xs whitespace-nowrap border-b-2 transition-colors ${
                    status === "closed"
                      ? "border-primary text-primary font-medium"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Closed ({stats?.closed || 0})
                </button>
              </div>
              <CardContent className="p-2">
                {!isLoading && tickets.length === 0 && (
                  <Card>
                    <CardContent className="py-4 text-center">
                      No support tickets found.
                    </CardContent>
                  </Card>
                )}
                <div className="space-y-1">
                  {tickets.map((ticket: any) => (
                    <Card
                      key={ticket.id}
                      onClick={() => setSelectedTicketId(ticket.id)}
                      className={`cursor-pointer border ${
                        selectedTicketId === ticket.id ? "border-primary" : ""
                      }`}
                    >
                      <CardContent className="p-2">
                        <div className="flex gap-2">
                          <UserAvatar user={ticket.user} />

                          <div className="flex-1">
                            <div className="flex justify-between items-center">
                              <div className="font-bold text-sm">
                                {ticket.user.firstName} {ticket.user.lastName}
                              </div>

                              <div className="text-xs text-muted-foreground mr-2">
                                {new Date(
                                  ticket.createdAt,
                                ).toLocaleDateString()}
                              </div>
                            </div>

                            <div className="flex justify-between text-xs text-muted-foreground">
                              <span>
                                Ticket ID: #{truncateText(ticket.id, 8)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
            <div className="flex justify-between mt-1">
              <Button
                size="sm"
                variant="outline"
                disabled={page === 1}
                onClick={() => setPage(page - 1)}
              >
                Previous
              </Button>

              <div className="text-sm flex items-center">Page {page}</div>

              <Button
                size="sm"
                variant="outline"
                disabled={page >= Math.ceil(total / LIMIT)}
                onClick={() => setPage(page + 1)}
              >
                Next
              </Button>
            </div>
          </div>

          {/* Center - Messages */}
          <div className="col-span-8">
            {/* TOP CARD */}
            <Card className="">
              <CardContent className="flex justify-between items-center py-1">
                <div>
                  <h2 className="font-semibold mt-1">
                    {selectedTicket?.subject}
                  </h2>
                  <div className="flex text-xs text-muted-foreground mb-1 gap-10">
                    <p>Ticket ID: #{selectedTicket?.id}</p>
                  </div>
                </div>
              </CardContent>
              <hr className="" />
              {/* MESSAGES */}
              <div className="grid grid-cols-12 gap-2 p-2">
                <div className="col-span-8">
                  <Card>
                    {selectedTicket?.status !== "resolved" &&
                      selectedTicket?.status !== "closed" && (
                        <CardContent className="py-1 mt-1">
                          <div className="">
                            {!showReplyBox ? (
                              <div className="flex justify-end">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => setShowReplyBox(true)}
                                >
                                  Write Reply
                                </Button>
                              </div>
                            ) : (
                              <>
                                <Textarea
                                  rows={4}
                                  placeholder="Type your reply..."
                                  value={replyMessage}
                                  onChange={(e) =>
                                    setReplyMessage(e.target.value)
                                  }
                                />

                                <div className="flex justify-end gap-2 mt-2">
                                  <Button
                                    variant="outline"
                                    onClick={() => {
                                      setShowReplyBox(false);
                                      setReplyMessage("");
                                    }}
                                  >
                                    Cancel
                                  </Button>

                                  <Button
                                    disabled={
                                      !replyMessage.trim() ||
                                      replyMutation.isPending
                                    }
                                    onClick={() => replyMutation.mutate()}
                                  >
                                    {replyMutation.isPending
                                      ? "Sending..."
                                      : "Send Reply"}
                                  </Button>
                                </div>
                              </>
                            )}
                          </div>
                        </CardContent>
                      )}
                    <CardContent className="p-0">
                      <div className="max-h-[330px] overflow-y-auto">
                        {selectedTicket?.messages?.map((msg: any) => (
                          <div key={msg.id} className="border-b p-2">
                            <div className="flex gap-3">
                              <UserAvatar user={msg.sender} />

                              <div className="flex-1">
                                <div className="flex items-center justify-between">
                                  <div className="font-bold text-sm">
                                    {msg.sender?.firstName}{" "}
                                    {msg.sender?.lastName}
                                  </div>

                                  <div className="text-xs text-muted-foreground">
                                    {new Date(msg.createdAt).toLocaleString()}
                                  </div>
                                </div>

                                <div className="text-sm">{msg.message}</div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
                {/* Right Side - Ticket Details */}
                <div className="col-span-4">
                  <Card>
                    <CardContent className="p-4">
                      <h3 className="font-semibold mb-4">Ticket Details</h3>

                      <div className="space-y-4">
                        <div>
                          <div className="text-sm text-muted-foreground mb-2">
                            Status
                          </div>

                          <Badge>{selectedTicket?.status}</Badge>

                          {user?.userType === "admin" && (
                            <div className="flex flex-col gap-2 mt-3">
                              <Button
                                size="sm"
                                variant="outline"
                                disabled={
                                  selectedTicket?.status === "resolved" ||
                                  statusMutation.isPending
                                }
                                onClick={() =>
                                  statusMutation.mutate("resolved")
                                }
                              >
                                Mark Resolved
                              </Button>

                              <Button
                                size="sm"
                                variant="destructive"
                                className="bg-accent border-accent hover:bg-accent/90"
                                disabled={
                                  selectedTicket?.status === "closed" ||
                                  statusMutation.isPending
                                }
                                onClick={() => statusMutation.mutate("closed")}
                              >
                                Close Ticket
                              </Button>
                            </div>
                          )}
                        </div>

                        <div>
                          <div className="text-sm text-muted-foreground">
                            Created
                          </div>
                          <div className="font-medium text-sm">
                            {selectedTicket?.createdAt &&
                              new Date(
                                selectedTicket.createdAt,
                              ).toLocaleString()}
                          </div>
                        </div>

                        <div>
                          <div className="text-sm text-muted-foreground">
                            Updated
                          </div>
                          <div className="font-medium text-sm">
                            {selectedTicket?.updatedAt &&
                              new Date(
                                selectedTicket.updatedAt,
                              ).toLocaleString()}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}

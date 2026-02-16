import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { useState } from "react";
import { X } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef  } from "react";
import { IconLeft } from "react-day-picker";
import { Link } from "wouter";

interface Props {
  open: boolean;
  onClose: () => void;
  serviceRequestId?: string;
  fullScreen?: boolean;
}


export default function ServiceMessages({
  open,
  onClose,
  serviceRequestId,
  fullScreen=false,
}: Props) {
    const queryClient = useQueryClient();
    const { user } = useAuth();
    const [message, setMessage] = useState("");
    const messagesEndRef = useRef<HTMLDivElement | null>(null);
    const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({
        behavior: "smooth",
    });
    };

    const [activeConversationId, setActiveConversationId] = useState<string | null>(serviceRequestId ?? null);
    useEffect(() => {if (serviceRequestId) {
        setActiveConversationId(serviceRequestId);
        }
        }, [serviceRequestId]);
    useEffect(() => {
        if (activeConversationId) {
            fetch(`/api/conversations/${activeConversationId}/mark-read`, {
            method: "POST",
            });

            queryClient.invalidateQueries({
            queryKey: ["/api/conversations"],
            });
        }
        }, [activeConversationId]);
        


    const conversationsQuery = useQuery({
        queryKey: ["/api/conversations"],
        queryFn: async () => {
            const res = await fetch("/api/conversations");
            if (!res.ok) throw new Error("Failed to load conversations");
            return res.json();
        },
        enabled: open,
        refetchInterval: 5000, // auto update unread + last message
        });
    const messagesQuery = useQuery({
        queryKey: ["/api/service-requests", activeConversationId, "messages"],
        queryFn: async () => {
            const res = await fetch(
            `/api/service-requests/${activeConversationId}/messages`
            );
            if (!res.ok) throw new Error("Failed to load messages");
            return res.json();
        },
        enabled: !!activeConversationId,
        refetchInterval: 4000, // auto refresh chat
        });



    const messages = messagesQuery.data?.messages ?? [];
    const conversations = conversationsQuery.data?.conversations ?? [];
    const totalUnread = conversationsQuery.data?.totalUnread ?? 0;
    
    const serviceId = messagesQuery.data?.service?.id;
    const serviceTitle = messagesQuery.data?.service?.title;
    const requestTitle = messagesQuery.data?.serviceRequest?.title;
    const vendorName = messagesQuery.data?.participants?.vendorName;
    const contractorName = messagesQuery.data?.participants?.contractorName;
    const isVendor = user?.id === messagesQuery.data?.serviceRequest?.vendorId;
    const vendorId = messagesQuery.data?.serviceRequest?.vendorId;
    const contractorId = messagesQuery.data?.serviceRequest?.contractorId;


    const otherName = isVendor ? contractorName : vendorName;
    const firstLetter = otherName?.charAt(0)?.toUpperCase() ?? "?";
useEffect(() => {
  if (activeConversationId) {
    scrollToBottom();
  }
}, [messages, activeConversationId]);

 const sendMessage = useMutation({
  mutationFn: async () => {
    const res = await fetch("/api/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        serviceRequestId: activeConversationId,
        content: message,
        }),
    });

    if (!res.ok) {
      throw new Error("Failed to send message");
    }

    return res.json();
    },
    onSuccess: () => {
        setMessage("");

        queryClient.invalidateQueries({
            queryKey: ["/api/service-requests", activeConversationId, "messages"],
        });

        queryClient.invalidateQueries({
            queryKey: ["/api/conversations"],
        });
    },

    });
    

  if (!open) return null;

  return (
  <div
    className={
      fullScreen
        ? "fixed inset-0 z-50 flex justify-end"
        : "flex flex-col h-full"
    }
  >
    {fullScreen && (
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
      />
    )}

    {/* right panel */}
    <div
        className={
            fullScreen
            ? "relative w-[420px] h-full bg-white shadow-xl flex flex-col"
            : "flex flex-col h-full"
        }
    >
        {/* header */}
        <div className="flex justify-between items-center p-4 border-b">

        {activeConversationId ? (
            <>
            <div className="flex items-center gap-3">
                <button
                    onClick={() => setActiveConversationId(null)}
                    className="text-xsm text-muted-foreground hover:text-black"
                    >
                <IconLeft />
                </button>

                <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center font-semibold">
                    {firstLetter}
                </div>

                <div>
                    {(isVendor ? contractorId : vendorId) ? (
                    <Link
                        href={
                        isVendor
                            ? `/contractor/${contractorId}`
                            : `/vendor/${vendorId}`
                        }
                        onClick={() => {
                        onClose(); // 🔥 close chat box
                        }}
                    >
                        <p className="font-semibold hover:underline cursor-pointer">
                        {otherName ?? "User"}
                        </p>
                    </Link>
                    ) : (
                    <p className="font-semibold">
                        {otherName ?? "User"}
                    </p>
                    )}

                    {serviceId ? (
                        <Link
                            href={`/services/${serviceId}`}
                            onClick={() => {
                            onClose(); // 🔥 hide message box
                            }}
                        >
                            <h2 className="text-sm text-muted-foreground hover:underline cursor-pointer">
                            {serviceTitle ?? "Service"}
                            </h2>
                        </Link>
                    ) : (
                    <h2 className="text-sm text-muted-foreground">
                        {serviceTitle ?? "Service"}
                    </h2>
                    )}



                    {requestTitle && (
                    <p className="text-xs text-muted-foreground">
                        Request: {requestTitle}
                    </p>
                    )}
                </div>
                </div>
            </div>
            </>
        ) : (
            <p className="font-semibold text-lg">Messages</p>
        )}

        <button onClick={onClose}>
            <X />
        </button>
        </div>


            {/* Body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2">

            {/* Header Click → Show Conversation List */}
            {!activeConversationId  &&
                conversations.map((conv: any) => {
                    const otherName = conv.otherUser?.name ?? "User";
                    const firstLetter = otherName.charAt(0).toUpperCase();

                    return (
                    <div
                        key={conv.id}
                        className="flex items-center gap-3 p-3 border-b cursor-pointer hover:bg-muted transition"
                        onClick={() => setActiveConversationId(conv.id)}
                    >
                        {/* Avatar */}
                        <div className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center font-semibold">
                        {firstLetter}
                        </div>

                        {/* Text */}
                        <div className="flex flex-col flex-1">
                        <p className="font-medium text-sm">
                            {otherName}
                        </p>

                        <p className="text-xs text-muted-foreground truncate">
                            {conv.lastMessage ?? "No messages yet"}
                        </p>
                        </div>
                         {conv.unreadCount > 0 && (
                            <span className="ml-auto bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                            {conv.unreadCount}
                            </span>
                        )}
                    </div>
                    );
                })}


            {/* Service Card Click → Show Messages */}
            {activeConversationId && (
                <>
                    {messages.map((m: any) => (
                    <div
                        key={m.id}
                        className={`p-2 rounded-md max-w-[70%] ${
                        m.senderId === user?.id
                            ? "ml-auto bg-primary text-white"
                            : "bg-muted"
                        }`}
                    >
                        {m.content}
                    </div>
                    ))}

                    {/* Scroll Anchor */}
                    <div ref={messagesEndRef} />
                </>
                )}

            </div>


        {/* input */}
        {activeConversationId && (
        <div className="p-3 border-t flex gap-2">
            <Input
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type your message..."
                onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();

                    if (message.trim()) {
                        sendMessage.mutate();
                    }
                    }
                }}
                />
            <Button onClick={() => sendMessage.mutate()}>
            Send
            </Button>
        </div>
        )}
      </div>
    </div>
  );
}

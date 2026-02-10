import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { useState } from "react";
import { X } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

interface Props {
  open: boolean;
  onClose: () => void;
  serviceRequestId: string;
}

export default function ServiceMessages({
  open,
  onClose,
  serviceRequestId,
}: Props) {
    const queryClient = useQueryClient();
    const { user } = useAuth();
    const [message, setMessage] = useState("");

  const { data } = useQuery({
    queryKey: ["/api/service-requests", serviceRequestId, "messages"],
    queryFn: async () => {
        const res = await fetch(
        `/api/service-requests/${serviceRequestId}/messages`
        );
        if (!res.ok) throw new Error("Failed to load messages");
        return res.json();
    },
    enabled: open,
    });
    const messages = data?.messages ?? [];
    const serviceTitle = data?.serviceRequest?.title;

 const sendMessage = useMutation({
  mutationFn: async () => {
    const res = await fetch("/api/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        serviceRequestId,
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
        queryKey: ["/api/service-requests", serviceRequestId, "messages"],
        });
    },
    });

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* backdrop */}
      <div
        className="absolute inset-0 bg-black/30"
        onClick={onClose}
      />

      {/* right panel */}
      <div className="relative w-full max-w-md h-full bg-white shadow-xl flex flex-col">
        {/* header */}
        <div className="flex justify-between items-center p-4 border-b">
            <div>
                <h2 className="font-semibold">Messages</h2>
                {serviceTitle && (
                    <p className="text-xs text-muted-foreground">
                    Service: {serviceTitle}
                    </p>
                )}
            </div>

          <button onClick={onClose}>
            <X />
          </button>
        </div>

        {/* messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
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
        </div>

        {/* input */}
        <div className="p-3 border-t flex gap-2">
          <Input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type your message..."
          />
          <Button onClick={() => sendMessage.mutate()}>
            Send
          </Button>
        </div>
      </div>
    </div>
  );
}

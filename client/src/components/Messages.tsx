import { useState } from "react";
import { X, ArrowLeft } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import ServiceMessages from "@/pages/ServiceMessages";

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function Messages({ open, onClose }: Props) {
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);

  const { data } = useQuery({
    queryKey: ["my-conversations"],
    queryFn: async () => {
      const res = await fetch("/api/my-conversations");
      if (!res.ok) throw new Error("Failed to load conversations");
      return res.json();
    },
    enabled: open,
  });

  const conversations = data?.conversations ?? [];

  if (!open) return null;

  return (
    <div className="fixed inset-0 flex justify-end z-50">
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
      />

      <div className="relative w-[420px] bg-white h-full shadow-xl flex flex-col">

        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b">
          {selectedChatId && (
            <ArrowLeft
              className="cursor-pointer"
              onClick={() => setSelectedChatId(null)}
            />
          )}

          <h2 className="font-semibold text-lg">
            {selectedChatId ? "Conversation" : "Messages"}
          </h2>

          <X className="cursor-pointer" onClick={onClose} />
        </div>

        {!selectedChatId ? (
          /* Conversation List */
          <div className="flex-1 overflow-y-auto">
            {conversations.map((conv: any) => (
              <div
                key={conv.id}
                className="p-4 border-b cursor-pointer hover:bg-gray-100"
                onClick={() => setSelectedChatId(conv.id)}
              >
                <div className="font-medium">
                  {conv.otherUserName}
                </div>
                <div className="text-sm text-gray-500">
                  {conv.lastMessage}
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Reuse ServiceMessages */
          <ServiceMessages
            open={true}
            onClose={() => setSelectedChatId(null)}
            serviceRequestId={selectedChatId}
            fullScreen={false}
          />
        )}
      </div>
    </div>
  );
}

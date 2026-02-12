import { useEffect, useState } from "react";
import { useMessages } from "./MessageContext";
import { apiRequest } from "@/lib/queryClient";
import ServiceMessages from "@/pages/ServiceMessages";

interface MessageBoxProps {
  serviceRequestId?: string;
}

export default function MessageBox({ serviceRequestId }: MessageBoxProps) {
  const { isOpen } = useMessages();

  const [conversations, setConversations] = useState<any[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    if (!serviceRequestId) {
      fetchAllConversations();
    }
  }, [isOpen, serviceRequestId]);

  const fetchAllConversations = async () => {
    const response = await apiRequest("GET", "/api/conversations");
    const res = await response.json();
    setConversations(res.conversations);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed right-0 top-16 w-96 h-[calc(100vh-4rem)] bg-white shadow-lg border-l z-50 flex flex-col">
      
      <div className="p-4 border-b font-semibold text-lg">
        Messages
      </div>

      {/* If conversation selected → show full chat */}
      {selectedId ? (
        <ServiceMessages
          open={true}
          onClose={() => setSelectedId(null)}
          serviceRequestId={selectedId}
          fullScreen={false}
        />
      ) : (
        <div className="flex-1 overflow-y-auto">
          {conversations.map((conv) => (
            <div
              key={conv.id}
              className="p-4 border-b cursor-pointer hover:bg-gray-100"
              onClick={() => setSelectedId(conv.id)}
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
      )}
    </div>
  );
}

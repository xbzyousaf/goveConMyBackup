import { createContext, useContext, useState } from "react";

interface MessageContextType {
  isOpen: boolean;
  selectedConversationId: string | null;
  toggleMessages: () => void;
  openConversation: (id?: string) => void;
  closeMessages: () => void;
}

const MessageContext = createContext<MessageContextType | null>(null);

export function MessageProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);

  const toggleMessages = () => {
    setSelectedConversationId(null); // reset
    setIsOpen((prev) => !prev);
  };

  const openConversation = (id?: string) => {
    if (id) {
      setSelectedConversationId(id);
    } else {
      setSelectedConversationId(null);
    }
    setIsOpen(true);
  };

  const closeMessages = () => {
    setIsOpen(false);
    setSelectedConversationId(null);
  };

  return (
    <MessageContext.Provider
      value={{
        isOpen,
        selectedConversationId,
        toggleMessages,
        openConversation,
        closeMessages,
      }}
    >
      {children}
    </MessageContext.Provider>
  );
}

export const useMessages = () => {
  const context = useContext(MessageContext);
  if (!context) throw new Error("useMessages must be inside provider");
  return context;
};

import { createContext, useContext, useState } from "react";

interface MessageContextType {
  id: string | null;
  isOpen: boolean;
  selectedConversationId: string | null;

  toggleMessages: () => void;

  openConversation: (
    vendorId?: string
  ) => Promise<void>;

  closeMessages: () => void;
}

const MessageContext =
  createContext<MessageContextType | null>(
    null
  );

export function MessageProvider({
  children,
}: {
  children: React.ReactNode;
}) {

  const [isOpen, setIsOpen] =
    useState(false);

  const [
    selectedConversationId,
    setSelectedConversationId,
  ] = useState<string | null>(null);

  const toggleMessages = () => {

    setSelectedConversationId(null);

    setIsOpen((prev) => !prev);
  };

  const openConversation = async (
    vendorId?: string
  ) => {

    try {

      // open inbox only
      if (!vendorId) {

        setSelectedConversationId(null);

        setIsOpen(true);

        return;
      }

      const res = await fetch(
        "/api/conversations/start",
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          credentials: "include",

          body: JSON.stringify({
            vendorId,
          }),
        }
      );

      if (!res.ok) {
        throw new Error(
          "Failed to start conversation"
        );
      }

      const json = await res.json();

      setSelectedConversationId(
        json.data.id
      );

      setIsOpen(true);

    } catch (error) {

      console.error(error);
    }
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
        setSelectedConversationId,
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

  const context =
    useContext(MessageContext);

  if (!context) {

    throw new Error(
      "useMessages must be inside provider"
    );
  }

  return context;
};
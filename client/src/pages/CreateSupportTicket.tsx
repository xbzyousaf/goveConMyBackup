import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";

import { Header } from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

export default function CreateSupportTicket() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");

  const mutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/support", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          subject,
          message,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message);
      }

      return data;
    },

    onSuccess: () => {
      toast({
        title: "Support ticket created",
      });

      setLocation("/support");
    },

    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = () => {
    if (!subject.trim() || !message.trim()) {
      toast({
        title: "Missing fields",
        description: "Subject and message are required",
        variant: "destructive",
      });

      return;
    }

    mutation.mutate();
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto max-w-2xl px-4 py-6">
        <Card>
          <CardHeader>
            <CardTitle>Create Support Ticket</CardTitle>
          </CardHeader>

          <CardContent className="space-y-4">
            <Input
              placeholder="Subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            />

            <Textarea
              rows={6}
              placeholder="Describe your issue..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />

            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setLocation(`/support/${ticket.id}`)}
              >
                Cancel
              </Button>

              <Button
                onClick={handleSubmit}
                disabled={mutation.isPending}
              >
                {mutation.isPending
                  ? "Submitting..."
                  : "Submit Ticket"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
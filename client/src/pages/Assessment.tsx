import { useState, useRef, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Loader2, Send, Sparkles, TrendingUp, CheckCircle2, ArrowRight } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

interface Message {
  role: "assistant" | "user";
  content: string;
}

interface AssessmentResult {
  maturityStage: "startup" | "growth" | "scale";
  readinessScore: number;
  aiAnalysis: string;
  recommendations: string[];
}

export default function Assessment() {
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [hasStarted, setHasStarted] = useState(false);
  const [input, setInput] = useState("");
  const [isComplete, setIsComplete] = useState(false);
  const [result, setResult] = useState<AssessmentResult | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };
  useEffect(() => {
    const loadDraft = async () => {
      try {
        const res = await fetch("/api/maturity-profile", {
          credentials: "include",
        });
        if (!res.ok) {
          throw new Error("Failed to load assessment draft");
        }

        const profile = await res.json();
        const assessmentStatus = profile?.assessmentData?.status;
        const loadDraft = async () => {
  try {
    const res = await fetch("/api/maturity-profile", {
      credentials: "include",
    });

    if (!res.ok) {
      throw new Error("Failed to load assessment draft");
    }

    const profile = await res.json();
    const status = profile?.assessmentData?.status;
    const history = profile?.assessmentData?.conversationHistory;

    // ✅ CASE 1: Never started
    if (status === "not_started") {
      setMessages([
        {
          role: "assistant",
          content:
            "Welcome to GovScale Alliance! I'm your AI guide, and I'm here to help you understand where you are in your government contracting journey.\n\nLet's start with the basics: What's your company name, and have you worked with government contracts before?",
        },
      ]);
      return;
    }

    // ✅ CASE 2: In progress or skipped → resume
    if (Array.isArray(history) && history.length > 0) {
      setMessages(history);
      return;
    }

    // ✅ FALLBACK (safety)
    setMessages([
      {
        role: "assistant",
        content:
          "Welcome back! Let's continue your assessment.",
      },
    ]);
  } catch (err) {
    console.error("Load draft failed:", err);
  }
};

        if (profile?.assessmentData?.status === "not_started") {
  setMessages([
    {
      role: "assistant",
      content:
        "Welcome to GovScale Alliance! I'm your AI guide, and I'm here to help you understand where you are in your government contracting journey.\n\nLet's start with the basics: What's your company name, and have you worked with government contracts before?",
    },
  ]);
  return;
}

        if (
            profile?.assessmentData?.conversationHistory &&
            profile.assessmentData.conversationHistory.length > 0
          ) {
            // RESUME assessment
            setMessages(profile.assessmentData.conversationHistory);
          } else {
            // FIRST TIME assessment
            setMessages([
              {
                role: "assistant",
                content:
                  "Welcome to GovScale Alliance! I'm your AI guide, and I'm here to help you understand where you are in your government contracting journey.\n\nLet's start with the basics: What's your company name, and have you worked with government contracts before?",
              },
            ]);
          }


      } catch (err) {
        console.error("Load draft failed:", err);
      }
    };

    loadDraft();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessageMutation = useMutation({
    mutationFn: async (messagesToSend: Message[]) => {
    const response = await apiRequest("POST", "/api/assessment/chat", {
      messages: messagesToSend,
    });
    return await response.json();
  },
    onSuccess: (data) => {
      if (data.isComplete) {
        setIsComplete(true);
        setResult(data.result);
      } else {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: data.nextQuestion },
        ]);
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to process your response",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || sendMessageMutation.isPending) return;

    const userMessage = input.trim();
    const updatedMessages: Message[] = [
  ...messages,
  { role: "user" as const, content: userMessage },
];
    setMessages(updatedMessages);
    sendMessageMutation.mutate(updatedMessages);
    setInput("");
  };

  const handleContinueToDashboard = async () => {
    await queryClient.invalidateQueries({
      queryKey: ["/api/maturity-profile"],
    });
    setLocation("/dashboard");
  };

  if (isComplete && result) {
    const stageConfig = {
      startup: {
        label: "Startup Stage",
        color: "bg-blue-500",
        description: "You're in the foundational phase of your GovCon journey",
      },
      growth: {
        label: "Growth Stage",
        color: "bg-green-500",
        description: "You're actively pursuing opportunities and building momentum",
      },
      scale: {
        label: "Scale Stage",
        color: "bg-purple-500",
        description: "You're an established player scaling your operations",
      },
    };

    const config = stageConfig[result.maturityStage];

    return (
      <div className="min-h-screen bg-background p-6">
        <div className="container mx-auto max-w-3xl">
          <Card className="border-2">
            <CardContent className="p-8">
              <div className="text-center mb-8">
                <div className="flex items-center justify-center mb-4">
                  <CheckCircle2 className="w-16 h-16 text-green-500" />
                </div>
                <h1 className="text-3xl font-bold mb-2" data-testid="text-assessment-complete">
                  Assessment Complete!
                </h1>
                <p className="text-muted-foreground">
                  We've analyzed your responses and created your personalized roadmap
                </p>
              </div>

              <div className="space-y-6">
                <div className="text-center">
                  <Badge className={`${config.color} text-white text-lg px-6 py-2`} data-testid="badge-maturity-stage">
                    {config.label}
                  </Badge>
                  <p className="text-sm text-muted-foreground mt-2">{config.description}</p>
                </div>

                <div className="bg-muted rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <span className="font-semibold">Readiness Score</span>
                    <Badge variant="outline" className="text-lg" data-testid="text-readiness-score">
                      {result.readinessScore}/100
                    </Badge>
                  </div>
                  <div className="w-full bg-background rounded-full h-3">
                    <div
                      className={`${config.color} h-3 rounded-full transition-all duration-1000`}
                      style={{ width: `${result.readinessScore}%` }}
                    />
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" />
                    AI Analysis
                  </h3>
                  <p className="text-muted-foreground whitespace-pre-line" data-testid="text-ai-analysis">
                    {result.aiAnalysis}
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <Sparkles className="w-5 h-5" />
                    Recommended Next Steps
                  </h3>
                  <ul className="space-y-2">
                    {result.recommendations.map((rec, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <ArrowRight className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                        <span className="text-muted-foreground" data-testid={`text-recommendation-${idx}`}>
                          {rec}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>

                <Button
                  size="lg"
                  className="w-full"
                  onClick={handleContinueToDashboard}
                  data-testid="button-continue-dashboard"
                >
                  Continue to Your Dashboard
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-6 text-center">
          <Badge variant="secondary" className="mb-3" data-testid="badge-assessment-header">
            <Sparkles className="w-3 h-3 mr-1" />
            AI-Powered Assessment
          </Badge>
          <h1 className="text-3xl font-bold mb-2" data-testid="text-page-title">
            Discover Your GovCon Maturity Level
          </h1>
          <p className="text-muted-foreground">
            Answer a few questions to get personalized guidance and resources
          </p>
        </div>

        <Card>
          <CardContent className="p-0">
            <div className="h-[500px] overflow-y-auto p-6 space-y-4" data-testid="container-chat-messages">
              {messages.map((message, idx) => (
                <div
                  key={idx}
                  className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg p-4 ${
                      message.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted"
                    }`}
                    data-testid={`message-${message.role}-${idx}`}
                  >
                    {message.role === "assistant" && (
                      <div className="flex items-center gap-2 mb-2">
                        <Sparkles className="w-4 h-4 text-primary" />
                        <span className="text-xs font-semibold text-primary">AI Guide</span>
                      </div>
                    )}
                    <p className="whitespace-pre-line">{message.content}</p>
                  </div>
                </div>
              ))}
              {sendMessageMutation.isPending && (
                <div className="flex justify-start">
                  <div className="bg-muted rounded-lg p-4">
                    <Loader2 className="w-5 h-5 animate-spin text-primary" />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <form onSubmit={handleSubmit} className="border-t p-4">
              <div className="flex gap-2">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Type your response..."
                  disabled={sendMessageMutation.isPending}
                  className="flex-1"
                  data-testid="input-chat-message"
                  autoFocus
                />
                <Button
                  type="submit"
                  disabled={!input.trim() || sendMessageMutation.isPending}
                  data-testid="button-send-message"
                >
                  {sendMessageMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </form>
            <Button
              variant="ghost"
              onClick={async () => {
                await apiRequest("POST", "/api/skip-assessment");

                // 🔥 IMPORTANT: clear stale cache
                await queryClient.invalidateQueries({
                  queryKey: ["/api/maturity-profile"],
                });

                setLocation("/dashboard");
              }}
            >
              Skip Assessment
            </Button>

          </CardContent>
        </Card>
        <p className="text-xs text-center text-muted-foreground mt-4">
          Your responses are analyzed by AI to provide personalized recommendations. This typically takes 5-10 minutes.
        </p>
      </div>
    </div>
  );
}

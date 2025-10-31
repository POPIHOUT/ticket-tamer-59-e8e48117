import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { ArrowLeft, Send, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { enUS } from "date-fns/locale";

interface Ticket {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  created_at: string;
  user_id: string;
  profiles: {
    nickname: string | null;
  };
}

interface Message {
  id: string;
  ticket_id: string;
  user_id: string;
  message: string;
  created_at: string;
  profiles: {
    nickname: string | null;
    is_support: boolean;
  };
}

const Conversation = () => {
  const { ticketId } = useParams<{ ticketId: string }>();
  const navigate = useNavigate();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [user, setUser] = useState<User | null>(null);
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [isSupport, setIsSupport] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/");
        return;
      }
      setUser(user);

      // Fetch user role
      const { data: profile } = await supabase
        .from("profiles")
        .select("is_support, is_admin")
        .eq("id", user.id)
        .single();

      if (profile) {
        setIsSupport(profile.is_support || false);
        setIsAdmin(profile.is_admin || false);
      }
    };
    getUser();
  }, [navigate]);

  useEffect(() => {
    if (!ticketId || !user) return;

    fetchTicket();
    fetchMessages();

    const channel = supabase
      .channel(`conversation-${ticketId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `ticket_id=eq.${ticketId}`,
        },
        (payload) => {
          fetchMessages();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [ticketId, user]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchTicket = async () => {
    const { data, error } = await supabase
      .from("tickets")
      .select(`
        *,
        profiles (
          nickname
        )
      `)
      .eq("id", ticketId)
      .single();

    if (error) {
      console.error("Error fetching ticket:", error);
      toast.error("Error loading ticket");
      navigate("/support");
    } else {
      setTicket(data);
    }
  };

  const fetchMessages = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from("messages")
      .select(`
        *,
        profiles (
          nickname,
          is_support
        )
      `)
      .eq("ticket_id", ticketId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error fetching messages:", error);
    } else {
      setMessages(data || []);
    }
    setIsLoading(false);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user || !ticketId) return;

    setIsSending(true);

    try {
      const { error } = await supabase.from("messages").insert({
        ticket_id: ticketId,
        user_id: user.id,
        message: newMessage.trim(),
      });

      if (error) throw error;

      setNewMessage("");
      
      // Refresh ticket to see updated status if it was closed
      fetchTicket();
    } catch (error: any) {
      toast.error("Error sending message");
      console.error(error);
    } finally {
      setIsSending(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!isSupport && !isAdmin) return;

    try {
      const updates: any = { status: newStatus };
      if (newStatus === "closed") {
        updates.closed_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from("tickets")
        .update(updates)
        .eq("id", ticketId);

      if (error) throw error;

      toast.success("Status updated");
      fetchTicket();
    } catch (error: any) {
      toast.error("Error updating status");
      console.error(error);
    }
  };

  const getStatusBadge = (status: string) => {
    const getBadgeClass = () => {
      switch (status) {
        case "open":
          return "bg-success text-success-foreground hover:bg-success/90";
        case "waiting_for_response":
          return "bg-warning text-warning-foreground hover:bg-warning/90";
        case "closed":
          return "bg-destructive text-destructive-foreground hover:bg-destructive/90";
        default:
          return "";
      }
    };

    const labels = {
      open: "Open",
      in_progress: "In Progress",
      waiting_for_response: "Waiting for Response",
      closed: "Closed",
    };

    return (
      <Badge className={getBadgeClass()}>
        {labels[status as keyof typeof labels]}
      </Badge>
    );
  };

  const getPriorityBadge = (priority: string) => {
    const variants = {
      urgent: "destructive",
      high: "default",
      medium: "secondary",
      low: "outline",
    };
    const labels = {
      urgent: "Urgent",
      high: "High",
      medium: "Medium",
      low: "Low",
    };
    return (
      <Badge variant={variants[priority as keyof typeof variants] as any}>
        {labels[priority as keyof typeof labels]}
      </Badge>
    );
  };

  if (!ticket) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-secondary/5 to-accent/10">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/5 to-accent/10">
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button
              onClick={() => navigate("/support")}
              variant="ghost"
              size="icon"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex-1">
              <h1 className="text-xl font-bold">{ticket.title}</h1>
              <div className="flex items-center gap-2 mt-1">
                {(isSupport || isAdmin) ? (
                  <Select
                    value={ticket.status}
                    onValueChange={handleStatusChange}
                  >
                    <SelectTrigger className="w-[150px] h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="open">Open</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="waiting_for_response">Waiting for Response</SelectItem>
                      <SelectItem value="closed">Closed</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  getStatusBadge(ticket.status)
                )}
                {getPriorityBadge(ticket.priority)}
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-4xl">
        <Card className="mb-4">
          <CardHeader>
            <CardTitle className="text-base">Ticket Description</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
              {ticket.description}
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              Created by {ticket.profiles?.nickname || "Unknown"} on{" "}
              {format(new Date(ticket.created_at), "d MMMM yyyy, HH:mm", {
                locale: enUS,
              })}
            </p>
          </CardContent>
        </Card>

        <Card className="mb-4">
          <CardHeader>
            <CardTitle className="text-base">Conversation</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 min-h-[400px] max-h-[500px] overflow-y-auto">
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : messages.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No messages yet. Start the conversation!
                </div>
              ) : (
                messages.map((message) => {
                  const isCurrentUser = message.user_id === user?.id;
                  const isSupport = message.profiles?.is_support;

                  return (
                    <div
                      key={message.id}
                      className={`flex ${isCurrentUser ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[70%] rounded-lg px-4 py-2 ${
                          isCurrentUser
                            ? "bg-primary text-primary-foreground"
                            : isSupport
                            ? "bg-secondary text-secondary-foreground"
                            : "bg-muted"
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-medium">
                            {message.profiles?.nickname || "Unknown"}
                          </span>
                          {isSupport && (
                            <Badge variant="outline" className="text-xs px-1 py-0">
                              Support
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm whitespace-pre-wrap">
                          {message.message}
                        </p>
                        <p className="text-xs opacity-70 mt-1">
                          {format(new Date(message.created_at), "HH:mm", {
                            locale: enUS,
                          })}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>
          </CardContent>
        </Card>

        {ticket.status !== "closed" && (
          <Card>
            <CardContent className="pt-6">
              <form onSubmit={handleSendMessage} className="flex gap-2">
                <Textarea
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type your message..."
                  disabled={isSending}
                  rows={3}
                  className="flex-1"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage(e);
                    }
                  }}
                />
                <Button
                  type="submit"
                  disabled={isSending || !newMessage.trim()}
                  size="icon"
                  className="self-end"
                >
                  {isSending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </form>
              <p className="text-xs text-muted-foreground mt-2">
                Press Enter to send, Shift+Enter for new line
              </p>
            </CardContent>
          </Card>
        )}

        {ticket.status === "closed" && (
          <Card>
            <CardContent className="pt-6">
              <form onSubmit={handleSendMessage} className="flex gap-2">
                <Textarea
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type your message to reopen this ticket..."
                  disabled={isSending}
                  rows={3}
                  className="flex-1"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage(e);
                    }
                  }}
                />
                <Button
                  type="submit"
                  disabled={isSending || !newMessage.trim()}
                  size="icon"
                  className="self-end"
                >
                  {isSending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </form>
              <p className="text-xs text-muted-foreground mt-2">
                Sending a message will reopen this ticket. Press Enter to send, Shift+Enter for new line
              </p>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
};

export default Conversation;

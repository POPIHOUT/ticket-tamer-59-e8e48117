import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { UserProfileDialog } from "@/components/UserProfileDialog";
import { RatingDialog } from "@/components/RatingDialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { ArrowLeft, Send, Loader2, UserPlus, X, Bot } from "lucide-react";
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
  is_bot: boolean;
  profiles: {
    nickname: string | null;
    is_support: boolean;
  };
}

interface SupportUser {
  id: string;
  nickname: string | null;
  is_support: boolean;
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
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [isProfileDialogOpen, setIsProfileDialogOpen] = useState(false);
  const [isTakenOver, setIsTakenOver] = useState(false);
  const [supportUsers, setSupportUsers] = useState<SupportUser[]>([]);
  const [isTransferDialogOpen, setIsTransferDialogOpen] = useState(false);
  const [selectedTransferUser, setSelectedTransferUser] = useState<string>("");
  const [isRatingDialogOpen, setIsRatingDialogOpen] = useState(false);
  const [botTyping, setBotTyping] = useState(false);

  const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/hothost-ai-chat`;

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/");
        return;
      }
      setUser(user);

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
    checkTakeoverStatus();

    const messagesChannel = supabase
      .channel(`conversation-${ticketId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `ticket_id=eq.${ticketId}`,
        },
        async (payload) => {
          const { data: newMessage } = await supabase
            .from("messages")
            .select(`
              *,
              profiles (
                nickname,
                is_support
              )
            `)
            .eq("id", payload.new.id)
            .single();

          if (newMessage) {
            setMessages((prev) => [...prev, newMessage]);
          }
        }
      )
      .subscribe();

    const ticketsChannel = supabase
      .channel(`ticket-updates-${ticketId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "tickets",
          filter: `id=eq.${ticketId}`,
        },
        (payload) => {
          setTicket((prev) => prev ? { ...prev, ...payload.new } : null);
        }
      )
      .subscribe();

    const assignmentsChannel = supabase
      .channel(`assignments-${ticketId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "ticket_assignments",
          filter: `ticket_id=eq.${ticketId}`,
        },
        () => {
          checkTakeoverStatus();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(messagesChannel);
      supabase.removeChannel(ticketsChannel);
      supabase.removeChannel(assignmentsChannel);
    };
  }, [ticketId, user]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isSupport || isAdmin) {
      fetchSupportUsers();
    }
  }, [isSupport, isAdmin]);

  const checkTakeoverStatus = async () => {
    const { data } = await supabase
      .from("ticket_assignments")
      .select("*")
      .eq("ticket_id", ticketId)
      .maybeSingle();

    setIsTakenOver(!!data);
  };

  const fetchSupportUsers = async () => {
    const { data } = await supabase
      .from("profiles")
      .select("id, nickname, is_support")
      .eq("is_support", true);

    if (data) {
      setSupportUsers(data);
    }
  };

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

  const sendBotMessage = async (userMessage: string) => {
    if (isTakenOver || ticket?.priority === 'urgent') return;

    setBotTyping(true);

    try {
      const conversationHistory = messages.map(msg => ({
        role: msg.is_bot ? "assistant" : "user",
        content: msg.message
      }));

      conversationHistory.push({
        role: "user",
        content: userMessage
      });

      const response = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          messages: conversationHistory,
          ticketId: ticketId,
          userId: user?.id
        }),
      });

      if (!response.ok || !response.body) {
        throw new Error("Failed to get AI response");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = "";
      let streamDone = false;
      let assistantMessage = "";

      while (!streamDone) {
        const { done, value } = await reader.read();
        if (done) break;
        
        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);

          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") {
            streamDone = true;
            break;
          }

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) {
              assistantMessage += content;
            }
          } catch (e) {
            textBuffer = line + "\n" + textBuffer;
            break;
          }
        }
      }

      if (assistantMessage && !assistantMessage.includes('"action": "escalate"')) {
        await supabase.from("messages").insert({
          ticket_id: ticketId,
          user_id: user!.id,
          message: assistantMessage,
          is_bot: true,
        });
      }

    } catch (error) {
      console.error("Bot error:", error);
    } finally {
      setBotTyping(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user || !ticketId) return;

    setIsSending(true);

    try {
      const messageText = newMessage.trim();
      const { error } = await supabase.from("messages").insert({
        ticket_id: ticketId,
        user_id: user.id,
        message: messageText,
        is_bot: false,
      });

      if (error) throw error;

      setNewMessage("");

      // Send to bot if not taken over and not urgent
      if (!isTakenOver && ticket?.priority !== 'urgent') {
        setTimeout(() => sendBotMessage(messageText), 500);
      }
    } catch (error: any) {
      toast.error("Error sending message");
      console.error(error);
    } finally {
      setIsSending(false);
    }
  };

  const handleTakeOver = async () => {
    if (!user || !ticketId) return;

    try {
      const { error } = await supabase
        .from("ticket_assignments")
        .insert({
          ticket_id: ticketId,
          support_user_id: user.id,
        });

      if (error) throw error;

      // Get user's nickname
      const { data: profile } = await supabase
        .from("profiles")
        .select("nickname")
        .eq("id", user.id)
        .single();

      // Send system message
      await supabase.from("messages").insert({
        ticket_id: ticketId,
        user_id: user.id,
        message: `${profile?.nickname || 'Support'} has joined the chat.`,
        is_bot: true,
      });

      toast.success("Ticket taken over");
      setIsTakenOver(true);
    } catch (error: any) {
      toast.error("Error taking over ticket");
      console.error(error);
    }
  };

  const handleTransfer = async () => {
    if (!selectedTransferUser || !ticketId) return;

    try {
      // Remove current assignment
      await supabase
        .from("ticket_assignments")
        .delete()
        .eq("ticket_id", ticketId);

      // Add new assignment
      const { error } = await supabase
        .from("ticket_assignments")
        .insert({
          ticket_id: ticketId,
          support_user_id: selectedTransferUser,
        });

      if (error) throw error;

      // Get new user's nickname
      const { data: profile } = await supabase
        .from("profiles")
        .select("nickname")
        .eq("id", selectedTransferUser)
        .single();

      // Send system message
      await supabase.from("messages").insert({
        ticket_id: ticketId,
        user_id: user!.id,
        message: `Ticket has been transferred to ${profile?.nickname || 'another agent'}.`,
        is_bot: true,
      });

      toast.success("Ticket transferred");
      setIsTransferDialogOpen(false);
      setSelectedTransferUser("");
    } catch (error: any) {
      toast.error("Error transferring ticket");
      console.error(error);
    }
  };

  const handleClose = async () => {
    try {
      const { error } = await supabase
        .from("tickets")
        .update({
          status: "closed",
          closed_at: new Date().toISOString(),
        })
        .eq("id", ticketId);

      if (error) throw error;

      toast.success("Ticket closed");
      
      // Show rating dialog for customers
      if (!isSupport && !isAdmin) {
        setTimeout(() => setIsRatingDialogOpen(true), 500);
      }
    } catch (error: any) {
      toast.error("Error closing ticket");
      console.error(error);
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
        case "solved":
          return "bg-muted text-muted-foreground hover:bg-muted/90";
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
      solved: "Solved",
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
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-4 flex items-center gap-4">
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
                  <SelectItem value="solved">Solved</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>
            ) : (
              getStatusBadge(ticket.status)
            )}
            {getPriorityBadge(ticket.priority)}
          </div>
        </div>
        {(isSupport || isAdmin) && ticket.status !== "closed" && (
          <div className="flex gap-2">
            {!isTakenOver && (
              <Button onClick={handleTakeOver} variant="outline" size="sm">
                <UserPlus className="h-4 w-4 mr-2" />
                Take Over
              </Button>
            )}
            {isTakenOver && (
              <Button onClick={() => setIsTransferDialogOpen(true)} variant="outline" size="sm">
                Transfer
              </Button>
            )}
            <Button onClick={handleClose} variant="outline" size="sm">
              <X className="h-4 w-4 mr-2" />
              Close Ticket
            </Button>
          </div>
        )}
        {!isSupport && !isAdmin && ticket.status !== "closed" && (
          <Button onClick={handleClose} variant="outline" size="sm">
            Close Ticket
          </Button>
        )}
      </div>

      <div className="max-w-4xl">
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
                  const isCurrentUser = message.user_id === user?.id && !message.is_bot;
                  const isSupportMessage = message.profiles?.is_support && !message.is_bot;
                  const isBotMessage = message.is_bot;

                  return (
                    <div
                      key={message.id}
                      className={`flex ${isCurrentUser ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[70%] rounded-lg px-4 py-3 ${
                          isCurrentUser
                            ? "bg-primary text-primary-foreground"
                            : "bg-card border"
                        }`}
                      >
                        <div className="flex items-start gap-2 mb-2">
                          <div className="flex-1">
                            {isBotMessage && (
                              <div className="flex items-center gap-2 mb-1">
                                <Badge variant="secondary" className="text-xs">
                                  <Bot className="h-3 w-3 mr-1" />
                                  BOT
                                </Badge>
                                <span className="text-xs font-medium">
                                  HotHost.org
                                </span>
                              </div>
                            )}
                            {isSupportMessage && (
                              <div className="flex items-center gap-2 mb-1">
                                <Badge variant="default" className="text-xs">
                                  Support
                                </Badge>
                                <button
                                  onClick={() => {
                                    if (isSupport || isAdmin) {
                                      setSelectedUserId(message.user_id);
                                      setIsProfileDialogOpen(true);
                                    }
                                  }}
                                  className={`text-xs font-medium ${
                                    isSupport || isAdmin
                                      ? "hover:underline cursor-pointer"
                                      : ""
                                  }`}
                                >
                                  {message.profiles?.nickname || "Unknown"}
                                </button>
                              </div>
                            )}
                            {!isBotMessage && !isSupportMessage && !isCurrentUser && (
                              <button
                                onClick={() => {
                                  if (isSupport || isAdmin) {
                                    setSelectedUserId(message.user_id);
                                    setIsProfileDialogOpen(true);
                                  }
                                }}
                                className={`text-xs font-medium mb-1 block ${
                                  isSupport || isAdmin
                                    ? "hover:underline cursor-pointer"
                                    : ""
                                }`}
                              >
                                {message.profiles?.nickname || "Unknown"}
                              </button>
                            )}
                          </div>
                          <p className="text-xs opacity-70">
                            {format(new Date(message.created_at), "HH:mm", {
                              locale: enUS,
                            })}
                          </p>
                        </div>
                        <p className="text-sm whitespace-pre-wrap">
                          {message.message}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
              {botTyping && (
                <div className="flex justify-start">
                  <div className="max-w-[70%] rounded-lg px-4 py-3 bg-card border">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="secondary" className="text-xs">
                        <Bot className="h-3 w-3 mr-1" />
                        BOT
                      </Badge>
                      <span className="text-xs font-medium">HotHost.org</span>
                    </div>
                    <Loader2 className="h-4 w-4 animate-spin" />
                  </div>
                </div>
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

        <UserProfileDialog
          userId={selectedUserId}
          open={isProfileDialogOpen}
          onOpenChange={setIsProfileDialogOpen}
        />

        <RatingDialog
          ticketId={ticketId!}
          open={isRatingDialogOpen}
          onOpenChange={setIsRatingDialogOpen}
        />

        <Dialog open={isTransferDialogOpen} onOpenChange={setIsTransferDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Transfer Ticket</DialogTitle>
              <DialogDescription>
                Select a support agent to transfer this ticket to.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Support Agent</Label>
                <Select value={selectedTransferUser} onValueChange={setSelectedTransferUser}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select an agent" />
                  </SelectTrigger>
                  <SelectContent>
                    {supportUsers
                      .filter(u => u.id !== user?.id)
                      .map((supportUser) => (
                        <SelectItem key={supportUser.id} value={supportUser.id}>
                          {supportUser.nickname || "Unknown"}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsTransferDialogOpen(false);
                    setSelectedTransferUser("");
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleTransfer}
                  disabled={!selectedTransferUser}
                >
                  Transfer
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default Conversation;

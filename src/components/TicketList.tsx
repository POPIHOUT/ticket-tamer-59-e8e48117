import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { enUS } from "date-fns/locale";
import { Clock, CheckCircle2, AlertCircle } from "lucide-react";

interface Ticket {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  created_at: string;
  user_id: string;
  profiles: {
    email: string;
    nickname: string | null;
    phone: string | null;
  };
}

interface TicketListProps {
  userId: string;
  isSupport: boolean;
}

export const TicketList = ({ userId, isSupport }: TicketListProps) => {
  const navigate = useNavigate();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchTickets();

    const channel = supabase
      .channel("tickets-changes")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "tickets",
        },
        async (payload) => {
          // Fetch the full ticket with profile data
          const { data: newTicket } = await supabase
            .from("tickets")
            .select(`
              *,
              profiles (
                email,
                nickname,
                phone
              )
            `)
            .eq("id", payload.new.id)
            .single();

          if (newTicket) {
            setTickets((prev) => [newTicket, ...prev]);
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "tickets",
        },
        async (payload) => {
          // Fetch the updated ticket with profile data
          const { data: updatedTicket } = await supabase
            .from("tickets")
            .select(`
              *,
              profiles (
                email,
                nickname,
                phone
              )
            `)
            .eq("id", payload.new.id)
            .single();

          if (updatedTicket) {
            setTickets((prev) =>
              prev.map((ticket) =>
                ticket.id === updatedTicket.id ? updatedTicket : ticket
              )
            );
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "tickets",
        },
        (payload) => {
          setTickets((prev) =>
            prev.filter((ticket) => ticket.id !== payload.old.id)
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, isSupport]);

  const fetchTickets = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from("tickets")
      .select(`
        *,
        profiles (
          email,
          nickname,
          phone
        )
      `)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching tickets:", error);
    } else {
      setTickets(data || []);
    }
    setIsLoading(false);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "open":
        return <CheckCircle2 className="h-4 w-4" />;
      case "in_progress":
        return <Clock className="h-4 w-4" />;
      case "waiting_for_response":
        return <AlertCircle className="h-4 w-4" />;
      case "solved":
        return <CheckCircle2 className="h-4 w-4" />;
      case "closed":
        return <CheckCircle2 className="h-4 w-4" />;
      default:
        return null;
    }
  };

  const getStatusVariant = (status: string): "default" | "destructive" | "secondary" | "outline" => {
    switch (status) {
      case "open":
        return "default"; // Will use success color
      case "in_progress":
        return "secondary";
      case "waiting_for_response":
        return "outline"; // Will use warning color
      case "solved":
        return "secondary";
      case "closed":
        return "destructive";
      default:
        return "outline";
    }
  };

  const getPriorityVariant = (priority: string) => {
    switch (priority) {
      case "urgent":
        return "destructive";
      case "high":
        return "default";
      case "medium":
        return "secondary";
      case "low":
        return "outline";
      default:
        return "outline";
    }
  };

  const filterTickets = (status: string) => {
    if (status === "all") return tickets;
    return tickets.filter((ticket) => ticket.status === status);
  };

  const renderTicketCard = (ticket: Ticket) => (
    <Card
      key={ticket.id}
      className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:border-primary/50"
      onClick={() => navigate(`/conversation/${ticket.id}`)}
    >
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 space-y-2">
            <CardTitle className="text-lg">{ticket.title}</CardTitle>
            <CardDescription className="line-clamp-2">
              {ticket.description}
            </CardDescription>
          </div>
          <div className="flex flex-col gap-2">
            <Badge 
              variant={getStatusVariant(ticket.status)} 
              className={`gap-1 ${
                ticket.status === "open" ? "bg-success text-success-foreground hover:bg-success/90" :
                ticket.status === "waiting_for_response" ? "bg-warning text-warning-foreground hover:bg-warning/90 border-0" :
                ""
              }`}
            >
              {getStatusIcon(ticket.status)}
              {ticket.status === "open" ? "Open" : 
               ticket.status === "in_progress" ? "In Progress" : 
               ticket.status === "waiting_for_response" ? "Waiting for Response" : 
               ticket.status === "solved" ? "Solved" :
               "Closed"}
            </Badge>
            <Badge variant={getPriorityVariant(ticket.priority)}>
              {ticket.priority === "urgent" ? "Urgent" : ticket.priority === "high" ? "High" : ticket.priority === "medium" ? "Medium" : "Low"}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            {ticket.profiles?.nickname && (
              <span className="font-medium">{ticket.profiles.nickname} • </span>
            )}
            {format(new Date(ticket.created_at), "d MMMM yyyy, HH:mm", { locale: enUS })}
          </span>
        </div>
      </CardContent>
    </Card>
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-muted-foreground">Loading tickets...</div>
      </div>
    );
  }

  return (
    <>
      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid w-full grid-cols-6 mb-6">
          <TabsTrigger value="all">All ({tickets.length})</TabsTrigger>
          <TabsTrigger value="open">
            Open ({filterTickets("open").length})
          </TabsTrigger>
          <TabsTrigger value="waiting_for_response">
            Waiting ({filterTickets("waiting_for_response").length})
          </TabsTrigger>
          <TabsTrigger value="in_progress">
            In Progress ({filterTickets("in_progress").length})
          </TabsTrigger>
          <TabsTrigger value="solved">
            Solved ({filterTickets("solved").length})
          </TabsTrigger>
          <TabsTrigger value="closed">
            Closed ({filterTickets("closed").length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          {tickets.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                No tickets
              </CardContent>
            </Card>
          ) : (
            tickets.map(renderTicketCard)
          )}
        </TabsContent>

        <TabsContent value="open" className="space-y-4">
          {filterTickets("open").length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                No open tickets
              </CardContent>
            </Card>
          ) : (
            filterTickets("open").map(renderTicketCard)
          )}
        </TabsContent>

        <TabsContent value="waiting_for_response" className="space-y-4">
          {filterTickets("waiting_for_response").length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                No tickets waiting for response
              </CardContent>
            </Card>
          ) : (
            filterTickets("waiting_for_response").map(renderTicketCard)
          )}
        </TabsContent>

        <TabsContent value="in_progress" className="space-y-4">
          {filterTickets("in_progress").length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                No tickets in progress
              </CardContent>
            </Card>
          ) : (
            filterTickets("in_progress").map(renderTicketCard)
          )}
        </TabsContent>

        <TabsContent value="solved" className="space-y-4">
          {filterTickets("solved").length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                No solved tickets
              </CardContent>
            </Card>
          ) : (
            filterTickets("solved").map(renderTicketCard)
          )}
        </TabsContent>

        <TabsContent value="solved" className="space-y-4">
          {filterTickets("solved").length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                No solved tickets
              </CardContent>
            </Card>
          ) : (
            filterTickets("solved").map(renderTicketCard)
          )}
        </TabsContent>

        <TabsContent value="closed" className="space-y-4">
          {filterTickets("closed").length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                No closed tickets
              </CardContent>
            </Card>
          ) : (
            filterTickets("closed").map(renderTicketCard)
          )}
        </TabsContent>
      </Tabs>
    </>
  );
};

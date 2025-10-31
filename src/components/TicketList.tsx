import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { TicketDialog } from "./TicketDialog";
import { format } from "date-fns";
import { sk } from "date-fns/locale";
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
    nickname: string | null;
  };
}

interface TicketListProps {
  userId: string;
  isSupport: boolean;
}

export const TicketList = ({ userId, isSupport }: TicketListProps) => {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchTickets();

    const channel = supabase
      .channel("tickets-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "tickets",
        },
        () => {
          fetchTickets();
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
          nickname
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
        return <AlertCircle className="h-4 w-4" />;
      case "in_progress":
        return <Clock className="h-4 w-4" />;
      case "closed":
        return <CheckCircle2 className="h-4 w-4" />;
      default:
        return null;
    }
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "open":
        return "destructive";
      case "in_progress":
        return "default";
      case "closed":
        return "secondary";
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
      onClick={() => setSelectedTicket(ticket)}
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
            <Badge variant={getStatusVariant(ticket.status)} className="gap-1">
              {getStatusIcon(ticket.status)}
              {ticket.status === "open" ? "Otvorený" : ticket.status === "in_progress" ? "V riešení" : "Zatvorený"}
            </Badge>
            <Badge variant={getPriorityVariant(ticket.priority)}>
              {ticket.priority === "urgent" ? "Naliehavý" : ticket.priority === "high" ? "Vysoká" : ticket.priority === "medium" ? "Stredná" : "Nízka"}
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
            {format(new Date(ticket.created_at), "d. MMMM yyyy, HH:mm", { locale: sk })}
          </span>
        </div>
      </CardContent>
    </Card>
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-muted-foreground">Načítavam tickety...</div>
      </div>
    );
  }

  return (
    <>
      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid w-full grid-cols-4 mb-6">
          <TabsTrigger value="all">Všetky ({tickets.length})</TabsTrigger>
          <TabsTrigger value="open">
            Otvorené ({filterTickets("open").length})
          </TabsTrigger>
          <TabsTrigger value="in_progress">
            V riešení ({filterTickets("in_progress").length})
          </TabsTrigger>
          <TabsTrigger value="closed">
            Zatvorené ({filterTickets("closed").length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          {tickets.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                Žiadne tickety
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
                Žiadne otvorené tickety
              </CardContent>
            </Card>
          ) : (
            filterTickets("open").map(renderTicketCard)
          )}
        </TabsContent>

        <TabsContent value="in_progress" className="space-y-4">
          {filterTickets("in_progress").length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                Žiadne tickety v riešení
              </CardContent>
            </Card>
          ) : (
            filterTickets("in_progress").map(renderTicketCard)
          )}
        </TabsContent>

        <TabsContent value="closed" className="space-y-4">
          {filterTickets("closed").length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                Žiadne zatvorené tickety
              </CardContent>
            </Card>
          ) : (
            filterTickets("closed").map(renderTicketCard)
          )}
        </TabsContent>
      </Tabs>

      {selectedTicket && (
        <TicketDialog
          ticket={selectedTicket}
          userId={userId}
          isSupport={false}
          onClose={() => setSelectedTicket(null)}
        />
      )}
    </>
  );
};

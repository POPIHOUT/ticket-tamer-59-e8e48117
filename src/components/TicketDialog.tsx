import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
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
import { format } from "date-fns";
import { sk } from "date-fns/locale";
import { X, Clock, CheckCircle2, AlertCircle } from "lucide-react";

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

interface TicketDialogProps {
  ticket: Ticket;
  userId: string;
  isSupport: boolean;
  onClose: () => void;
}

export const TicketDialog = ({ ticket, userId, isSupport, onClose }: TicketDialogProps) => {
  const [status, setStatus] = useState(ticket.status);
  const [priority, setPriority] = useState(ticket.priority);
  const [isLoading, setIsLoading] = useState(false);
  const [currentIsSupport, setCurrentIsSupport] = useState(false);

  useEffect(() => {
    const fetchUserProfile = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("is_support")
        .eq("id", userId)
        .single();
      
      if (data) {
        setCurrentIsSupport(data.is_support || false);
      }
    };
    fetchUserProfile();
  }, [userId]);

  const canUpdate = currentIsSupport || ticket.user_id === userId;

  const handleClose = async () => {
    if (status === "closed" && ticket.status !== "closed") {
      setIsLoading(true);
      const { error } = await supabase
        .from("tickets")
        .update({ status: "closed", closed_at: new Date().toISOString() })
        .eq("id", ticket.id);

      if (error) {
        toast.error("Chyba pri zatváraní ticketu");
      } else {
        toast.success("Ticket zatvorený");
      }
      setIsLoading(false);
    }
    onClose();
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!canUpdate) return;

    setIsLoading(true);
    const updates: any = { status: newStatus };
    if (newStatus === "closed") {
      updates.closed_at = new Date().toISOString();
    }

    const { error } = await supabase
      .from("tickets")
      .update(updates)
      .eq("id", ticket.id);

    if (error) {
      toast.error("Chyba pri aktualizácii statusu");
    } else {
      setStatus(newStatus);
      toast.success("Status aktualizovaný");
    }
    setIsLoading(false);
  };

  const handlePriorityChange = async (newPriority: string) => {
    if (!currentIsSupport) return;

    setIsLoading(true);
    const { error } = await supabase
      .from("tickets")
      .update({ priority: newPriority })
      .eq("id", ticket.id);

    if (error) {
      toast.error("Chyba pri aktualizácii priority");
    } else {
      setPriority(newPriority);
      toast.success("Priorita aktualizovaná");
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

  return (
    <Dialog open onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-2 flex-1">
              <DialogTitle className="text-2xl">{ticket.title}</DialogTitle>
              <DialogDescription>
                Vytvorené {format(new Date(ticket.created_at), "d. MMMM yyyy, HH:mm", { locale: sk })}
              </DialogDescription>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleClose}
              className="h-8 w-8"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {currentIsSupport && (
            <div className="space-y-2 p-4 bg-muted/50 rounded-lg">
              <p className="text-sm font-medium">Kontaktné údaje</p>
              <div className="space-y-1 text-sm">
                <p><span className="font-medium">Display Name:</span> {ticket.profiles?.nickname || "N/A"}</p>
                <p><span className="font-medium">Email:</span> {ticket.profiles?.email}</p>
                <p><span className="font-medium">Tel.č.:</span> {ticket.profiles?.phone || "N/A"}</p>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label>Popis</Label>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap bg-muted/30 p-4 rounded-lg">
              {ticket.description}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Status</Label>
              {currentIsSupport ? (
                <Select
                  value={status}
                  onValueChange={handleStatusChange}
                  disabled={isLoading}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="open">
                      <div className="flex items-center gap-2">
                        {getStatusIcon("open")}
                        Otvorený
                      </div>
                    </SelectItem>
                    <SelectItem value="in_progress">
                      <div className="flex items-center gap-2">
                        {getStatusIcon("in_progress")}
                        V riešení
                      </div>
                    </SelectItem>
                    <SelectItem value="closed">
                      <div className="flex items-center gap-2">
                        {getStatusIcon("closed")}
                        Zatvorený
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <div className="flex items-center gap-2 h-10 px-3 border rounded-md bg-muted/30">
                  {getStatusIcon(status)}
                  <span>
                    {status === "open" ? "Otvorený" : status === "in_progress" ? "V riešení" : "Zatvorený"}
                  </span>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label>Priorita</Label>
              {currentIsSupport ? (
                <Select
                  value={priority}
                  onValueChange={handlePriorityChange}
                  disabled={isLoading}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Nízka</SelectItem>
                    <SelectItem value="medium">Stredná</SelectItem>
                    <SelectItem value="high">Vysoká</SelectItem>
                    <SelectItem value="urgent">Naliehavá</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <div className="flex items-center h-10 px-3 border rounded-md bg-muted/30">
                  {priority === "urgent" ? "Naliehavá" : priority === "high" ? "Vysoká" : priority === "medium" ? "Stredná" : "Nízka"}
                </div>
              )}
            </div>
          </div>

          {ticket.user_id === userId && status !== "closed" && (
            <div className="pt-4 border-t">
              <Button
                onClick={() => handleStatusChange("closed")}
                variant="outline"
                className="w-full"
                disabled={isLoading}
              >
                Zatvoriť ticket
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

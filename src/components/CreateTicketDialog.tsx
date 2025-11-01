import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface CreateTicketDialogProps {
  userId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTicketCreated?: (ticketId: string) => void;
}

export const CreateTicketDialog = ({
  userId,
  open,
  onOpenChange,
  onTicketCreated,
}: CreateTicketDialogProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("medium");
  const [initialMessage, setInitialMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { data, error } = await supabase
        .from("tickets")
        .insert({
          user_id: userId,
          title,
          description,
          priority,
          status: "open",
          initial_message: initialMessage.trim() || null,
        })
        .select()
        .single();

      if (error) throw error;

      // If there's an initial message, send it
      if (data && initialMessage.trim()) {
        const { error: messageError } = await supabase.from("messages").insert({
          ticket_id: data.id,
          user_id: userId,
          message: initialMessage.trim(),
        });

        if (messageError) {
          console.error("Error sending initial message:", messageError);
        }
      }

      // Get user profile for email
      const { data: profileData } = await supabase
        .from("profiles")
        .select("nickname, email")
        .eq("id", userId)
        .single();

      // Send email notification
      if (data && profileData) {
        try {
          await supabase.functions.invoke("send-ticket-email", {
            body: {
              ticketId: data.id,
              title,
              description,
              priority,
              userName: profileData.nickname || "Používateľ",
              userEmail: profileData.email,
              appOrigin: window.location.origin,
            },
          });
          console.log("Email notification sent successfully");
        } catch (emailError) {
          console.error("Error sending email notification:", emailError);
          // Don't fail the ticket creation if email fails
        }
      }

      toast.success("Ticket created!");
      setTitle("");
      setDescription("");
      setPriority("medium");
      setInitialMessage("");
      onOpenChange(false);
      
      if (data && onTicketCreated) {
        onTicketCreated(data.id);
      }
    } catch (error: any) {
      toast.error("Error creating ticket");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create New Ticket</DialogTitle>
          <DialogDescription>
            Describe your issue or request
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              placeholder="Brief description of the issue"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="priority">Priority</Label>
            <Select value={priority} onValueChange={setPriority} disabled={isLoading}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Detailed description of the issue..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              disabled={isLoading}
              rows={4}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="initialMessage">Initial Message (Optional)</Label>
            <Textarea
              id="initialMessage"
              placeholder="Add your first message here..."
              value={initialMessage}
              onChange={(e) => setInitialMessage(e.target.value)}
              disabled={isLoading}
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Ticket"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

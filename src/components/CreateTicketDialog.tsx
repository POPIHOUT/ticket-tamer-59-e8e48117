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
}

export const CreateTicketDialog = ({
  userId,
  open,
  onOpenChange,
}: CreateTicketDialogProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("medium");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { error } = await supabase.from("tickets").insert({
        user_id: userId,
        title,
        description,
        priority,
        status: "open",
      });

      if (error) throw error;

      toast.success("Ticket vytvorený!");
      setTitle("");
      setDescription("");
      setPriority("medium");
      onOpenChange(false);
    } catch (error: any) {
      toast.error("Chyba pri vytváraní ticketu");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Vytvoriť nový ticket</DialogTitle>
          <DialogDescription>
            Popíšte váš problém alebo požiadavku
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Názov</Label>
            <Input
              id="title"
              placeholder="Stručný popis problému"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="priority">Priorita</Label>
            <Select value={priority} onValueChange={setPriority} disabled={isLoading}>
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
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Popis</Label>
            <Textarea
              id="description"
              placeholder="Detailný popis problému..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              disabled={isLoading}
              rows={6}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Zrušiť
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Vytváram...
                </>
              ) : (
                "Vytvoriť ticket"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

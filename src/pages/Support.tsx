import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User, Session } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { LogOut, Plus } from "lucide-react";
import { TicketList } from "@/components/TicketList";
import { CreateTicketDialog } from "@/components/CreateTicketDialog";
import { UserProfile } from "@/components/UserProfile";

const Support = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isSupport, setIsSupport] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          setTimeout(() => {
            fetchUserProfile(session.user.id);
          }, 0);
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        fetchUserProfile(session.user.id);
      } else {
        navigate("/");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const fetchUserProfile = async (userId: string) => {
    const { data, error } = await supabase
      .from("profiles")
      .select("is_support, is_admin")
      .eq("id", userId)
      .single();

    if (error) {
      console.error("Error fetching profile:", error);
      return;
    }

    if (data) {
      setIsSupport(data.is_support || false);
      setIsAdmin(data.is_admin || false);
    }
  };

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error("Error signing out");
    } else {
      toast.success("Signed out");
      navigate("/");
    }
  };

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/5 to-accent/10">
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold text-primary">Support Tickets</h1>
            {isSupport && (
              <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium">
                Support
              </span>
            )}
            {isAdmin && (
              <span className="px-3 py-1 bg-accent/10 text-accent rounded-full text-sm font-medium">
                Admin
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <UserProfile userId={user.id} isSupport={isSupport} isAdmin={isAdmin} />
            <Button
              onClick={() => setIsCreateDialogOpen(true)}
              size="sm"
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              New Ticket
            </Button>
            <Button
              onClick={handleSignOut}
              variant="outline"
              size="sm"
              className="gap-2"
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <TicketList userId={user.id} isSupport={isSupport} />
      </main>

      <CreateTicketDialog
        userId={user.id}
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onTicketCreated={(ticketId) => navigate(`/conversation/${ticketId}`)}
      />
    </div>
  );
};

export default Support;

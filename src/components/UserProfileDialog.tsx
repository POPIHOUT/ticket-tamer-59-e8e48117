import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { User, Mail, Phone, Calendar } from "lucide-react";
import { format } from "date-fns";
import { enUS } from "date-fns/locale";

interface UserProfileDialogProps {
  userId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface UserProfile {
  nickname: string | null;
  email: string;
  phone: string | null;
  full_name: string | null;
  created_at: string;
}

export const UserProfileDialog = ({ userId, open, onOpenChange }: UserProfileDialogProps) => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (userId && open) {
      fetchProfile();
    }
  }, [userId, open]);

  const fetchProfile = async () => {
    if (!userId) return;
    
    setIsLoading(true);
    const { data, error } = await supabase
      .from("profiles")
      .select("nickname, email, phone, full_name, created_at")
      .eq("id", userId)
      .single();

    if (!error && data) {
      setProfile(data);
    }
    setIsLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>User Profile</DialogTitle>
        </DialogHeader>
        {isLoading ? (
          <div className="py-8 text-center text-muted-foreground">Loading...</div>
        ) : profile ? (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <User className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Nickname</p>
                <p className="font-medium">{profile.nickname || "Not set"}</p>
              </div>
            </div>
            {profile.full_name && (
              <div className="flex items-center gap-3">
                <User className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Full Name</p>
                  <p className="font-medium">{profile.full_name}</p>
                </div>
              </div>
            )}
            <div className="flex items-center gap-3">
              <Mail className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="font-medium">{profile.email}</p>
              </div>
            </div>
            {profile.phone && (
              <div className="flex items-center gap-3">
                <Phone className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Phone</p>
                  <p className="font-medium">{profile.phone}</p>
                </div>
              </div>
            )}
            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Member Since</p>
                <p className="font-medium">
                  {format(new Date(profile.created_at), "d MMMM yyyy", {
                    locale: enUS,
                  })}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="py-8 text-center text-muted-foreground">
            Profile not found
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

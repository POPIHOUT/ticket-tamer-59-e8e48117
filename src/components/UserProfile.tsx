import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { toast } from "sonner";
import { User, Loader2 } from "lucide-react";

interface UserProfileProps {
  userId: string;
  isSupport: boolean;
  isAdmin: boolean;
}

interface Profile {
  email: string;
  full_name: string | null;
  nickname: string | null;
  phone: string | null;
}

export const UserProfile = ({ userId, isSupport, isAdmin }: UserProfileProps) => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    full_name: "",
    nickname: "",
    phone: "",
  });

  useEffect(() => {
    fetchProfile();
  }, [userId]);

  const fetchProfile = async () => {
    const { data, error } = await supabase
      .from("profiles")
      .select("email, full_name, nickname, phone")
      .eq("id", userId)
      .single();

    if (error) {
      console.error("Error fetching profile:", error);
    } else {
      setProfile(data);
      setFormData({
        full_name: data.full_name || "",
        nickname: data.nickname || "",
        phone: data.phone || "",
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const { error } = await supabase
      .from("profiles")
      .update(formData)
      .eq("id", userId);

    if (error) {
      toast.error("Chyba pri aktualizácii profilu");
    } else {
      toast.success("Profil aktualizovaný");
      fetchProfile();
      setIsEditing(false);
    }
    setIsLoading(false);
  };

  const getInitials = () => {
    if (!profile?.full_name) return "U";
    return profile.full_name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="rounded-full">
          <Avatar>
            <AvatarFallback className="bg-primary text-primary-foreground">
              {getInitials()}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Môj profil</DialogTitle>
          <DialogDescription>
            {isEditing ? "Upravte svoje údaje" : "Zobraziť informácie o profile"}
          </DialogDescription>
        </DialogHeader>

        {profile && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Email</Label>
              <Input value={profile.email} disabled className="bg-muted" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="full_name">Celé meno</Label>
              <Input
                id="full_name"
                value={formData.full_name}
                onChange={(e) =>
                  setFormData({ ...formData, full_name: e.target.value })
                }
                disabled={!isEditing || isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="nickname">Prezývka</Label>
              <Input
                id="nickname"
                value={formData.nickname}
                onChange={(e) =>
                  setFormData({ ...formData, nickname: e.target.value })
                }
                disabled={!isEditing || isLoading}
              />
            </div>

            {(isSupport || isAdmin) && (
              <div className="space-y-2">
                <Label htmlFor="phone">Telefónne číslo</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                  disabled={!isEditing || isLoading}
                />
              </div>
            )}

            <div className="flex justify-end gap-2 pt-4">
              {isEditing ? (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsEditing(false);
                      setFormData({
                        full_name: profile.full_name || "",
                        nickname: profile.nickname || "",
                        phone: profile.phone || "",
                      });
                    }}
                    disabled={isLoading}
                  >
                    Zrušiť
                  </Button>
                  <Button type="submit" disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Ukladám...
                      </>
                    ) : (
                      "Uložiť zmeny"
                    )}
                  </Button>
                </>
              ) : (
                <Button type="button" onClick={() => setIsEditing(true)}>
                  Upraviť profil
                </Button>
              )}
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};

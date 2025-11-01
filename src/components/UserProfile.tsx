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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { User, Loader2, Upload } from "lucide-react";

interface UserProfileProps {
  userId: string;
  isSupport: boolean;
  isAdmin: boolean;
}

interface Profile {
  email: string;
  nickname: string | null;
  phone: string | null;
  avatar_url: string | null;
}

export const UserProfile = ({ userId, isSupport, isAdmin }: UserProfileProps) => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [formData, setFormData] = useState({
    nickname: "",
    phone: "",
  });

  useEffect(() => {
    fetchProfile();
  }, [userId]);

  const fetchProfile = async () => {
    const { data, error } = await supabase
      .from("profiles")
      .select("email, nickname, phone, avatar_url")
      .eq("id", userId)
      .single();

    if (error) {
      console.error("Error fetching profile:", error);
    } else {
      setProfile(data);
      setFormData({
        nickname: data.nickname || "",
        phone: data.phone || "",
      });
    }
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error("File size must be less than 2MB");
      return;
    }

    setIsUploading(true);

    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${userId}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("avatars")
        .getPublicUrl(fileName);

      const { error: updateError } = await supabase
        .from("profiles")
        .update({ avatar_url: publicUrl })
        .eq("id", userId);

      if (updateError) throw updateError;

      toast.success("Avatar updated successfully");
      fetchProfile();
    } catch (error: any) {
      toast.error("Error uploading avatar");
      console.error(error);
    } finally {
      setIsUploading(false);
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
      toast.error("Error updating profile");
    } else {
      toast.success("Profile updated");
      fetchProfile();
      setIsEditing(false);
    }
    setIsLoading(false);
  };

  const getInitials = () => {
    if (!profile?.nickname) return "U";
    return profile.nickname
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
            <AvatarImage src={profile?.avatar_url || undefined} alt={profile?.nickname || "User"} />
            <AvatarFallback className="bg-primary text-primary-foreground">
              {getInitials()}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>My Profile</DialogTitle>
          <DialogDescription>
            {isEditing ? "Edit your profile information" : "View your profile information"}
          </DialogDescription>
        </DialogHeader>

        {profile && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex flex-col items-center gap-4">
              <Avatar className="h-24 w-24">
                <AvatarImage src={profile.avatar_url || undefined} alt={profile.nickname || "User"} />
                <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
                  {getInitials()}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col items-center gap-2">
                <Label htmlFor="avatar-upload" className="cursor-pointer">
                  <div className="flex items-center gap-2 text-sm text-primary hover:underline">
                    <Upload className="h-4 w-4" />
                    {isUploading ? "Uploading..." : "Change Avatar"}
                  </div>
                </Label>
                <Input
                  id="avatar-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarUpload}
                  disabled={isUploading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Email</Label>
              <Input value={profile.email} disabled className="bg-muted" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="nickname">Display Name</Label>
              <Input
                id="nickname"
                value={formData.nickname}
                onChange={(e) =>
                  setFormData({ ...formData, nickname: e.target.value })
                }
                disabled={!isEditing || isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="+421 XXX XXX XXX"
                value={formData.phone}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
                disabled={!isEditing || isLoading}
              />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              {isEditing ? (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsEditing(false);
                      setFormData({
                        nickname: profile.nickname || "",
                        phone: profile.phone || "",
                      });
                    }}
                    disabled={isLoading}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      "Save Changes"
                    )}
                  </Button>
                </>
              ) : (
                <Button type="button" onClick={() => setIsEditing(true)}>
                  Edit Profile
                </Button>
              )}
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};

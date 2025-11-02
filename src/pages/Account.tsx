import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { UserProfile } from "@/components/UserProfile";
import { TwoFactorAuth } from "@/components/TwoFactorAuth";

const Account = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSupport, setIsSupport] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
      } else {
        setUser(user);
        
        // Fetch user role
        const { data: profile } = await supabase
          .from("profiles")
          .select("is_support, is_admin")
          .eq("id", user.id)
          .single();

        if (profile) {
          setIsSupport(profile.is_support || false);
          setIsAdmin(profile.is_admin || false);
        }
      }
      setLoading(false);
    };
    checkAuth();
  }, [navigate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Account Settings</h1>
        <p className="text-muted-foreground mt-1">Manage your profile and account settings</p>
      </div>

      <UserProfile userId={user?.id} isSupport={isSupport} isAdmin={isAdmin} />
      
      <TwoFactorAuth userId={user?.id} />
    </div>
  );
};

export default Account;

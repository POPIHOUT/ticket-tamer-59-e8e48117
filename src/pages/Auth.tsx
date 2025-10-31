import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Loader2, TicketIcon } from "lucide-react";

const Auth = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [loginInput, setLoginInput] = useState("");
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        navigate("/support");
      }
    };
    checkSession();
  }, [navigate]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("email")
        .eq("nickname", loginInput)
        .single();

      if (profileError || !profile) {
        toast.error("Display Name nenájdený");
        setIsLoading(false);
        return;
      }

      const { error } = await supabase.auth.signInWithPassword({
        email: profile.email,
        password,
      });

      if (error) {
        toast.error(error.message);
      } else {
        toast.success("Prihlásenie úspešné!");
        navigate("/support");
      }
    } catch (error: any) {
      toast.error("Nastala chyba pri prihlasovaní");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { data: existingProfile } = await supabase
        .from("profiles")
        .select("id")
        .eq("nickname", displayName)
        .maybeSingle();

      if (existingProfile) {
        toast.error("Display Name už existuje");
        setIsLoading(false);
        return;
      }

      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            nickname: displayName,
          },
          emailRedirectTo: `${window.location.origin}/support`,
        },
      });

      if (error) {
        toast.error(error.message);
      } else {
        toast.success("Registrácia úspešná! Presmerovanie...");
        navigate("/support");
      }
    } catch (error: any) {
      toast.error("Nastala chyba pri registrácii");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-secondary/5 to-accent/10 p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="space-y-4 text-center">
          <div className="mx-auto bg-primary/10 w-16 h-16 rounded-2xl flex items-center justify-center">
            <TicketIcon className="w-8 h-8 text-primary" />
          </div>
          <CardTitle className="text-3xl font-bold">Support Ticket System</CardTitle>
          <CardDescription className="text-base">
            Prihláste sa alebo vytvorte nový účet
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="signin" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="signin">Prihlásenie</TabsTrigger>
              <TabsTrigger value="signup">Registrácia</TabsTrigger>
            </TabsList>

            <TabsContent value="signin">
              <form onSubmit={handleSignIn} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signin-name">Display Name</Label>
                  <Input
                    id="signin-name"
                    type="text"
                    placeholder="VášDisplayName"
                    value={loginInput}
                    onChange={(e) => setLoginInput(e.target.value)}
                    required
                    disabled={isLoading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signin-password">Heslo</Label>
                  <Input
                    id="signin-password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={isLoading}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Prihlasujem...
                    </>
                  ) : (
                    "Prihlásiť sa"
                  )}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup">
              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-displayname">Display Name *</Label>
                  <Input
                    id="signup-displayname"
                    type="text"
                    placeholder="VášDisplayName"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    required
                    disabled={isLoading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-email">E-mail *</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    placeholder="vas@email.sk"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={isLoading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Heslo *</Label>
                  <Input
                    id="signup-password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={isLoading}
                    minLength={6}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Registrujem...
                    </>
                  ) : (
                    "Vytvoriť účet"
                  )}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;

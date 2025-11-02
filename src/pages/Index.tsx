import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, Server, Cpu, HardDrive, Loader2 } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
      } else {
        setUser(user);
      }
      setLoading(false);
    };
    checkAuth();
  }, [navigate]);

  const servers = [
    {
      name: "7.C",
      image: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80",
      cpu: "5.74 %",
      ram: "2.92 GiB",
      disk: "1.54 GiB"
    },
    {
      name: "DiddyBot",
      image: "https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?w=800&q=80",
      cpu: "0.00 %",
      ram: "44.42 MiB",
      disk: "34.42 MiB"
    },
    {
      name: "HotHost.org",
      image: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&q=80",
      cpu: "Installing",
      ram: "",
      disk: "",
      isInstalling: true
    }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <Alert className="border-warning/20 bg-warning/10 text-warning-foreground">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          We would like to inform you that the Player List and Plugin Installer will not work until Monday 0:00. Thank you for your understanding.
        </AlertDescription>
      </Alert>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {servers.map((server, index) => (
          <Card 
            key={index}
            className="group relative overflow-hidden border-white/10 bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-xl hover:border-primary/30 transition-all duration-300 cursor-pointer hover:shadow-xl hover:shadow-primary/10"
          >
            <div className="relative h-40 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent z-10" />
              <img 
                src={server.image} 
                alt={server.name}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
              />
              <div className="absolute top-4 left-4 z-20 flex items-center gap-2">
                <Server className="h-5 w-5 text-white" />
                <span className="text-white font-semibold text-lg drop-shadow-lg">{server.name}</span>
              </div>
            </div>
            
            <CardContent className="p-4">
              {server.isInstalling ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="h-5 w-5 animate-spin text-primary mr-2" />
                  <span className="text-muted-foreground">Installing</span>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-4">
                  <div className="flex flex-col items-center">
                    <Cpu className="h-4 w-4 text-muted-foreground mb-1" />
                    <span className="text-sm font-medium">{server.cpu}</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <Server className="h-4 w-4 text-muted-foreground mb-1" />
                    <span className="text-sm font-medium">{server.ram}</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <HardDrive className="h-4 w-4 text-muted-foreground mb-1" />
                    <span className="text-sm font-medium">{server.disk}</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="text-center text-muted-foreground text-sm pt-8">
        <p>Pterodactyl® © 2015 - 2025  •  Blueprint © 2023 - 2025</p>
      </div>
    </div>
  );
};

export default Index;

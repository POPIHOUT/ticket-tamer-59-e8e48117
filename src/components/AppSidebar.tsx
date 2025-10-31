import { Home, User, LogOut, TicketIcon, Globe, MessageCircle } from "lucide-react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

const navigationItems = [
  { title: "Home", url: "/support", icon: Home, isExternal: false },
];

const externalItems = [
  { title: "Dashboard", url: "https://dash.hothost.org/", icon: Globe },
  { title: "Discord", url: "https://discord.gg/auwYgPaadT", icon: MessageCircle },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const navigate = useNavigate();
  const location = useLocation();
  const currentPath = location.pathname;
  const collapsed = state === "collapsed";

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error("Error signing out");
    } else {
      toast.success("Successfully signed out");
      navigate("/");
    }
  };

  return (
    <Sidebar collapsible="icon">
      <SidebarContent className="glass-strong border-r border-white/10">
        <div className={`p-4 border-b border-white/10 flex items-center backdrop-blur-xl ${collapsed ? 'justify-center' : 'gap-3'}`}>
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/30">
            <TicketIcon className="h-5 w-5 text-primary-foreground" />
          </div>
          {!collapsed && (
            <span className="font-bold text-lg text-sidebar-foreground">Support</span>
          )}
        </div>

        <SidebarGroup className="mt-4">
          <SidebarGroupContent>
            <SidebarMenu className="space-y-2">
              {navigationItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={currentPath === item.url}
                    className={`glass hover:glass-strong ${collapsed ? 'justify-center' : ''}`}
                    tooltip={item.title}
                  >
                    <NavLink to={item.url} end className="flex items-center w-full">
                      <item.icon className="h-5 w-5 flex-shrink-0" />
                      {!collapsed && <span className="ml-2 font-medium">{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}

              <div className="pt-2 mt-2 border-t border-white/10">
                {externalItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      className={`glass hover:glass-strong ${collapsed ? 'justify-center' : ''}`}
                      tooltip={item.title}
                    >
                      <a href={item.url} target="_blank" rel="noopener noreferrer" className="flex items-center w-full">
                        <item.icon className="h-5 w-5 flex-shrink-0" />
                        {!collapsed && <span className="ml-2 font-medium">{item.title}</span>}
                      </a>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </div>

              <div className="pt-4 mt-4 border-t border-white/10">
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    className={`glass hover:glass-strong hover:bg-destructive/20 text-destructive ${collapsed ? 'justify-center' : ''}`}
                    tooltip="Logout"
                  >
                    <button onClick={handleLogout} className="flex items-center w-full">
                      <LogOut className="h-5 w-5 flex-shrink-0" />
                      {!collapsed && <span className="ml-2 font-medium">Logout</span>}
                    </button>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </div>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
import { Home, User, LogOut, TicketIcon } from "lucide-react";
import { NavLink, useNavigate } from "react-router-dom";
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

const items = [
  { title: "Home", url: "/support", icon: Home },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const navigate = useNavigate();
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
    <Sidebar className={collapsed ? "w-16" : "w-64"} collapsible="icon">
      <SidebarContent className="glass-strong border-r border-white/10">
        <div className="p-4 border-b border-white/10 flex items-center gap-3 backdrop-blur-xl">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/30">
            <TicketIcon className="h-5 w-5 text-primary-foreground" />
          </div>
          {!collapsed && (
            <span className="font-bold text-lg text-sidebar-foreground">Support</span>
          )}
        </div>

        <SidebarGroup className="mt-4">
          <SidebarGroupContent>
            <SidebarMenu className="space-y-2 px-3">
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end
                      className={({ isActive }) =>
                        `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 ${
                          isActive
                            ? "bg-gradient-to-r from-primary to-accent text-primary-foreground shadow-lg shadow-primary/30 backdrop-blur-xl"
                            : "glass hover:glass-strong text-sidebar-foreground hover:translate-x-1"
                        }`
                      }
                    >
                      <item.icon className="h-5 w-5 flex-shrink-0" />
                      {!collapsed && <span className="font-medium">{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}

              <div className="pt-4 mt-4 border-t border-white/10">
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 glass hover:glass-strong hover:bg-destructive/20 text-destructive hover:translate-x-1 w-full"
                    >
                      <LogOut className="h-5 w-5 flex-shrink-0" />
                      {!collapsed && <span className="font-medium">Logout</span>}
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
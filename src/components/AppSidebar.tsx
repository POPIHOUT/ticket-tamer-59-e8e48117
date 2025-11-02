import { Home, User, LogOut, Activity } from "lucide-react";
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
  { title: "Home", url: "/support", icon: Home },
  { title: "Status", url: "https://status.hothost.org/", icon: Activity, external: true },
  { title: "Account", url: "/account", icon: User },
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
    <Sidebar collapsible="icon" className="border-r-0">
      <SidebarContent className="bg-[#0a0d1a]/95 backdrop-blur-xl border-r border-white/5">
        {/* Logo Section */}
        <div className={`p-4 border-b border-white/5 flex items-center justify-center transition-all duration-200 ${collapsed ? 'py-6' : 'py-4'}`}>
          {collapsed ? (
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/30">
              <span className="text-xl font-bold text-primary-foreground">H</span>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/30">
                <span className="text-xl font-bold text-primary-foreground">H</span>
              </div>
              <span className="font-bold text-xl text-foreground">HotHost</span>
            </div>
          )}
        </div>

        <SidebarGroup className="pt-4">
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1 px-3">
              {navigationItems.map((item) => {
                const isActive = !item.external && currentPath === item.url;
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      className={`
                        rounded-xl transition-all duration-200 hover:bg-primary/10
                        ${isActive ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20' : 'text-muted-foreground hover:text-foreground'}
                        ${collapsed ? 'justify-center px-3 py-3' : 'justify-start px-4 py-3'}
                      `}
                      tooltip={item.title}
                    >
                      {item.external ? (
                        <a href={item.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 w-full">
                          <item.icon className="h-5 w-5 flex-shrink-0" />
                          {!collapsed && <span className="font-medium">{item.title}</span>}
                        </a>
                      ) : (
                        <NavLink to={item.url} end className="flex items-center gap-3 w-full">
                          <item.icon className="h-5 w-5 flex-shrink-0" />
                          {!collapsed && <span className="font-medium">{item.title}</span>}
                        </NavLink>
                      )}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}

              <div className="pt-4 mt-4 border-t border-white/5">
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    className={`
                      rounded-xl transition-all duration-200 hover:bg-destructive/10 text-muted-foreground hover:text-destructive
                      ${collapsed ? 'justify-center px-3 py-3' : 'justify-start px-4 py-3'}
                    `}
                    tooltip="Logout"
                  >
                    <button onClick={handleLogout} className="flex items-center gap-3 w-full">
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

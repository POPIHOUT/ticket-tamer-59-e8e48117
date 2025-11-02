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
                        ${collapsed ? 'justify-center w-full' : 'justify-start'}
                      `}
                      tooltip={collapsed ? item.title : undefined}
                    >
                      {item.external ? (
                        <a href={item.url} target="_blank" rel="noopener noreferrer" className={`flex items-center w-full ${collapsed ? 'justify-center py-3 px-3' : 'gap-3 px-4 py-3'}`}>
                          <item.icon className="h-5 w-5 flex-shrink-0" />
                          {!collapsed && <span className="font-medium">{item.title}</span>}
                        </a>
                      ) : (
                        <NavLink to={item.url} end className={`flex items-center w-full ${collapsed ? 'justify-center py-3 px-3' : 'gap-3 px-4 py-3'}`}>
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
                      ${collapsed ? 'justify-center w-full' : 'justify-start'}
                    `}
                    tooltip={collapsed ? "Logout" : undefined}
                  >
                    <button onClick={handleLogout} className={`flex items-center w-full ${collapsed ? 'justify-center py-3 px-3' : 'gap-3 px-4 py-3'}`}>
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

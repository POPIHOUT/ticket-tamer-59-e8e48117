import { Home, User, LogOut, Headphones, CreditCard, Activity } from "lucide-react";
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
  { title: "Home", url: "/", icon: Home },
  { title: "Support", url: "/support", icon: Headphones },
  { title: "Billing", url: "/billing", icon: CreditCard },
  { title: "Status", url: "/status", icon: Activity },
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
                const isActive = currentPath === item.url;
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      className={`
                        rounded-xl transition-all duration-200 hover:bg-primary/10
                        ${isActive ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20' : 'text-muted-foreground hover:text-foreground'}
                        ${collapsed ? 'justify-center' : 'justify-start'}
                      `}
                      tooltip={item.title}
                    >
                      <NavLink to={item.url} end className="flex items-center gap-3 px-4 py-3 w-full">
                        <item.icon className="h-5 w-5 flex-shrink-0" />
                        {!collapsed && <span className="font-medium">{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}

              <div className="pt-4 mt-4 border-t border-white/5">
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    className={`
                      rounded-xl transition-all duration-200 hover:bg-muted/50 text-muted-foreground hover:text-foreground
                      ${collapsed ? 'justify-center' : 'justify-start'}
                    `}
                    tooltip="Account"
                  >
                    <NavLink to="/account" className="flex items-center gap-3 px-4 py-3 w-full">
                      <User className="h-5 w-5 flex-shrink-0" />
                      {!collapsed && <span className="font-medium">Account</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>

                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    className={`
                      rounded-xl transition-all duration-200 hover:bg-destructive/10 text-muted-foreground hover:text-destructive
                      ${collapsed ? 'justify-center' : 'justify-start'}
                    `}
                    tooltip="Logout"
                  >
                    <button onClick={handleLogout} className="flex items-center gap-3 px-4 py-3 w-full">
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

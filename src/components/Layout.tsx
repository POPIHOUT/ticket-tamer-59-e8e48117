import { ReactNode } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-[#0a0d1a]">
        <AppSidebar />
        <div className="flex-1 flex flex-col">
          <header className="h-14 border-b border-white/5 bg-[#0f1423]/80 backdrop-blur-sm sticky top-0 z-10 flex items-center justify-between px-4">
            <SidebarTrigger className="text-muted-foreground hover:text-foreground" />
            <Button 
              variant="ghost" 
              size="sm"
              className="gap-2 text-muted-foreground hover:text-foreground"
              asChild
            >
              <a href="https://discord.gg/auwYgPaadT" target="_blank" rel="noopener noreferrer">
                <MessageCircle className="h-4 w-4" />
                <span className="hidden sm:inline">Discord</span>
              </a>
            </Button>
          </header>
          <main className="flex-1 overflow-x-hidden bg-gradient-to-br from-[#0a0d1a] via-[#0f1423] to-[#0a0d1a]">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
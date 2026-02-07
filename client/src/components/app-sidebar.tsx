import { useLocation, Link } from "wouter";
import { BookOpen, Users, FileText, Sparkles, History, Settings, PenTool, RefreshCw } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const creativeItems = [
  { title: "Histórias", url: "/", icon: BookOpen },
  { title: "Personagens", url: "/characters", icon: Users },
  { title: "Roteiros", url: "/scripts", icon: FileText },
];

const aiItems = [
  { title: "Prompts", url: "/prompts", icon: Sparkles },
  { title: "Histórico de IA", url: "/executions", icon: History },
];

const settingsItems = [
  { title: "Perfil Criativo", url: "/profile", icon: Settings },
];

export function AppSidebar() {
  const [location] = useLocation();
  const { toast } = useToast();
  const [isResetting, setIsResetting] = useState(false);
  const [open, setOpen] = useState(false);

  const handleReset = async () => {
    try {
      setIsResetting(true);
      await apiRequest("POST", "/api/admin/reset");
      queryClient.invalidateQueries();
      toast({ title: "Reset de fábrica concluído", description: "O banco de dados foi limpo e a semente foi reiniciada." });
      setOpen(false);
    } catch (error: any) {
      toast({ title: "Erro ao resetar", description: error.message, variant: "destructive" });
    } finally {
      setIsResetting(false);
    }
  };

  const isActive = (url: string) => {
    if (url === "/") return location === "/";
    return location.startsWith(url);
  };

  return (
    <Sidebar>
      <SidebarHeader className="p-4">
        <Link href="/" data-testid="link-home">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary">
              <PenTool className="h-4 w-4 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-sm font-bold tracking-tight">StoryForge</h1>
              <p className="text-[11px] text-muted-foreground">Estúdio de Escrita Criativa</p>
            </div>
          </div>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Criativo</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {creativeItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild data-active={isActive(item.url)}>
                    <Link href={item.url} data-testid={`link-nav-${item.title.toLowerCase()}`}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel>Motor de IA</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {aiItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild data-active={isActive(item.url)}>
                    <Link href={item.url} data-testid={`link-nav-${item.title.toLowerCase().replace(" ", "-")}`}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel>Configurações</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {settingsItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild data-active={isActive(item.url)}>
                    <Link href={item.url} data-testid={`link-nav-${item.title.toLowerCase().replace(" ", "-")}`}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="p-4 space-y-4">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="w-full text-[11px] gap-2" data-testid="button-admin-reset">
              <RefreshCw className="h-3 w-3" />
              Reset de Fábrica
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Reset de Fábrica</DialogTitle>
              <DialogDescription>
                Isso apagará permanentemente todos os dados personalizados e restaurará as histórias e personagens padrão. Esta ação não pode ser desfeita.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setOpen(false)} disabled={isResetting}>
                Cancelar
              </Button>
              <Button variant="destructive" onClick={handleReset} disabled={isResetting}>
                {isResetting ? "Resetando..." : "Confirmar Reset"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        <p className="text-[11px] text-muted-foreground">v1.0 - Usuário Único</p>
      </SidebarFooter>
    </Sidebar>
  );
}

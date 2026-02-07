import { useLocation, Link } from "wouter";
import { BookOpen, Users, FileText, Sparkles, History, Settings, PenTool, RefreshCw, LogOut, Cpu } from "lucide-react";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
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
import { useAuth } from "@/hooks/use-auth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { CreativeProfile } from "@shared/schema";

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
  const { user, logout } = useAuth();
  const [isResetting, setIsResetting] = useState(false);
  const [open, setOpen] = useState(false);

  const { data: profiles } = useQuery<CreativeProfile[]>({
    queryKey: ["/api/profiles"],
  });

  const activateProfileMutation = useMutation({
    mutationFn: async (profileId: number) => {
      await apiRequest("POST", `/api/profiles/${profileId}/activate`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/profiles"] });
      toast({ title: "Perfil ativado" });
    },
  });

  const activeProfile = profiles?.find((p) => p.active);

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

  const userInitials = user
    ? [user.firstName, user.lastName].filter(Boolean).map((n) => n?.[0]).join("").toUpperCase() || "U"
    : "U";
  const userName = user
    ? [user.firstName, user.lastName].filter(Boolean).join(" ") || "Usuário"
    : "Usuário";

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

        {profiles && profiles.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel>Perfil Ativo</SidebarGroupLabel>
            <SidebarGroupContent>
              <div className="px-2 space-y-2">
                <Select
                  value={activeProfile?.id?.toString() || ""}
                  onValueChange={(val) => activateProfileMutation.mutate(parseInt(val))}
                  data-testid="select-active-profile"
                >
                  <SelectTrigger className="text-xs" data-testid="select-active-profile-trigger">
                    <SelectValue placeholder="Selecione um perfil" />
                  </SelectTrigger>
                  <SelectContent>
                    {profiles.map((p) => (
                      <SelectItem key={p.id} value={p.id.toString()} data-testid={`select-profile-${p.id}`}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {activeProfile && (
                  <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground px-1">
                    <Cpu className="h-3 w-3 shrink-0" />
                    <span className="truncate">{activeProfile.model}</span>
                    <span className="shrink-0">T:{activeProfile.temperature}</span>
                  </div>
                )}
              </div>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

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
      <SidebarFooter className="p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Avatar className="h-7 w-7">
            {user?.profileImageUrl && <AvatarImage src={user.profileImageUrl} alt={userName} />}
            <AvatarFallback className="text-xs">{userInitials}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium truncate" data-testid="text-user-name">{userName}</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => logout()}
            data-testid="button-logout"
            title="Sair"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
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
      </SidebarFooter>
    </Sidebar>
  );
}

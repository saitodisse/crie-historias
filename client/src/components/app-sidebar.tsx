import { useLocation, Link } from "wouter";
import { BookOpen, Users, FileText, Sparkles, History, Settings, PenTool } from "lucide-react";
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

const creativeItems = [
  { title: "Stories", url: "/", icon: BookOpen },
  { title: "Characters", url: "/characters", icon: Users },
  { title: "Scripts", url: "/scripts", icon: FileText },
];

const aiItems = [
  { title: "Prompts", url: "/prompts", icon: Sparkles },
  { title: "AI History", url: "/executions", icon: History },
];

const settingsItems = [
  { title: "Creative Profile", url: "/profile", icon: Settings },
];

export function AppSidebar() {
  const [location] = useLocation();

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
              <p className="text-[11px] text-muted-foreground">Creative Writing Studio</p>
            </div>
          </div>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Creative</SidebarGroupLabel>
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
          <SidebarGroupLabel>AI Engine</SidebarGroupLabel>
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
          <SidebarGroupLabel>Settings</SidebarGroupLabel>
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
      <SidebarFooter className="p-4">
        <p className="text-[11px] text-muted-foreground">v1.0 - Single User</p>
      </SidebarFooter>
    </Sidebar>
  );
}

import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/lib/theme-provider";
import { ThemeToggle } from "@/components/theme-toggle";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { useAuth } from "@/hooks/use-auth";
import NotFound from "@/pages/not-found";
import ProjectsPage from "@/pages/projects";
import ProjectDetailPage from "@/pages/project-detail";
import CharactersPage from "@/pages/characters";
import CharacterDetailPage from "@/pages/character-detail";
import ScriptsPage from "@/pages/scripts";
import ScriptDetailPage from "@/pages/script-detail";
import PromptsPage from "@/pages/prompts";
import PromptDetailPage from "@/pages/prompt-detail";
import ExecutionsPage from "@/pages/executions";
import ProfilePage from "@/pages/profile";
import LandingPage from "@/pages/landing";
import SignInPage from "@/pages/sign-in";
import SignUpPage from "@/pages/sign-up";
import WizardIdea from "@/pages/wizard/idea";
import WizardCast from "@/pages/wizard/cast";
import WizardScript from "@/pages/wizard/script";
import SettingsPage from "@/pages/settings";
import { Loader2 } from "lucide-react";

function Router() {
  return (
    <Switch>
      <Route path="/" component={ProjectsPage} />
      <Route path="/projects" component={ProjectsPage} />
      <Route path="/projects/:id" component={ProjectDetailPage} />
      <Route path="/characters" component={CharactersPage} />
      <Route path="/characters/:id" component={CharacterDetailPage} />
      <Route path="/scripts" component={ScriptsPage} />
      <Route path="/scripts/:id" component={ScriptDetailPage} />
      <Route path="/prompts" component={PromptsPage} />
      <Route path="/prompts/:id" component={PromptDetailPage} />
      <Route path="/executions" component={ExecutionsPage} />
      <Route path="/profile" component={ProfilePage} />
      <Route path="/settings" component={SettingsPage} />
      <Route path="/wizard/idea" component={WizardIdea} />
      <Route path="/wizard/characters" component={WizardCast} />
      <Route path="/wizard/script" component={WizardScript} />
      <Route component={NotFound} />
    </Switch>
  );
}

function UnauthenticatedRouter() {
  return (
    <Switch>
      <Route path="/" component={LandingPage} />
      <Route path="/sign-in" component={SignInPage} />
      <Route path="/sign-up" component={SignUpPage} />
      <Route component={LandingPage} />
    </Switch>
  );
}

function AuthenticatedApp() {
  const style = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };

  return (
    <SidebarProvider style={style as React.CSSProperties}>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-50 flex items-center justify-between gap-2 border-b bg-background p-2 backdrop-blur-sm support-[backdrop-filter]:bg-background/60">
            <SidebarTrigger data-testid="button-sidebar-toggle" />
            <ThemeToggle />
          </header>
          <main className="flex-1">
            <Router />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

function AppContent() {
  const { isLoading, isAuthenticated } = useAuth();

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <UnauthenticatedRouter />;
  }

  return <AuthenticatedApp />;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <TooltipProvider>
          <AppContent />
          <Toaster />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;

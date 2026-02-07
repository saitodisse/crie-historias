import { PenTool, BookOpen, Users, Sparkles, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ThemeToggle } from "@/components/theme-toggle";

const features = [
  {
    icon: BookOpen,
    title: "Gerencie Suas Histórias",
    description: "Organize histórias, premissas, tons e gêneros em um só lugar.",
  },
  {
    icon: Users,
    title: "Crie Personagens",
    description: "Dê vida aos seus personagens com descrições, personalidades e históricos.",
  },
  {
    icon: FileText,
    title: "Escreva Roteiros",
    description: "Crie roteiros manuais ou gerados por IA vinculados às suas histórias.",
  },
  {
    icon: Sparkles,
    title: "IA Assistente",
    description: "Use OpenAI, Gemini ou OpenRouter para gerar conteúdo com auditoria completa.",
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="flex items-center justify-between gap-2 p-4 border-b sticky top-0 z-50 bg-background">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary">
            <PenTool className="h-4 w-4 text-primary-foreground" />
          </div>
          <h1 className="text-lg font-bold tracking-tight">StoryForge</h1>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Button asChild data-testid="button-login-header">
            <a href="/sign-in">Entrar</a>
          </Button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-16">
        <div className="text-center space-y-4 mb-16">
          <h2 className="text-4xl font-bold tracking-tight font-serif">
            Estúdio de Escrita Criativa
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Plataforma completa para escritores criativos com geração de conteúdo assistida por IA,
            gerenciamento de histórias, personagens e roteiros.
          </p>
          <div className="pt-4">
            <Button size="lg" asChild data-testid="button-login-hero">
              <a href="/sign-in">Comece a Escrever</a>
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {features.map((f) => (
            <Card key={f.title}>
              <CardContent className="p-6 flex items-start gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-primary/10">
                  <f.icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">{f.title}</h3>
                  <p className="text-sm text-muted-foreground">{f.description}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
}

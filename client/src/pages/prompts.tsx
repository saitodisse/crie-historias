import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Sparkles, Search, ChevronRight } from "lucide-react";
import type { Prompt } from "@shared/schema";
import { useQueryState, parseAsString } from "nuqs";

const categoryColors: Record<string, string> = {
  character: "bg-blue-500/10 text-blue-700 dark:text-blue-400",
  project: "bg-amber-500/10 text-amber-700 dark:text-amber-400",
  script: "bg-green-500/10 text-green-700 dark:text-green-400",
  refinement: "bg-purple-500/10 text-purple-700 dark:text-purple-400",
};

const categoryLabels: Record<string, string> = {
  character: "Personagem",
  project: "Projeto",
  script: "Roteiro",
  refinement: "Refinamento",
};

export default function PromptsPage() {
  const [, navigate] = useLocation();
  const [search, setSearch] = useQueryState("q", parseAsString.withDefault(""));
  const [category, setCategory] = useQueryState(
    "category",
    parseAsString.withDefault("all")
  );

  const { data: prompts, isLoading } = useQuery<Prompt[]>({
    queryKey: ["/api/prompts"],
  });

  const filtered = prompts?.filter((p) => {
    const matchSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.content.toLowerCase().includes(search.toLowerCase());
    const matchCategory = category === "all" || p.category === category;
    return matchSearch && matchCategory;
  });

  return (
    <div className="flex h-full flex-col">
      <div className="flex flex-wrap items-center justify-between gap-4 p-6 pb-4">
        <div>
          <h1
            className="text-2xl font-bold tracking-tight"
            data-testid="text-prompts-title"
          >
            Prompts
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Modelos de prompt configuráveis para geração por IA
          </p>
        </div>
        <Button
          onClick={() => navigate("/prompts/new")}
          data-testid="button-create-prompt"
        >
          <Plus className="mr-2 h-4 w-4" />
          Novo Prompt
        </Button>
      </div>

      <div className="flex flex-wrap gap-3 px-6 pb-4">
        <div className="relative min-w-[200px] flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar prompts..."
            className="pl-9"
            data-testid="input-search-prompts"
          />
        </div>
        <Tabs value={category} onValueChange={(v) => setCategory(v)}>
          <TabsList>
            <TabsTrigger value="all">Todos</TabsTrigger>
            <TabsTrigger value="project">Projeto</TabsTrigger>
            <TabsTrigger value="character">Personagem</TabsTrigger>
            <TabsTrigger value="script">Roteiro</TabsTrigger>
            <TabsTrigger value="refinement">Refinamento</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="flex-1 overflow-auto px-6 pb-6">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardContent className="pt-4">
                  <Skeleton className="mb-2 h-5 w-32" />
                  <Skeleton className="h-16 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filtered && filtered.length > 0 ? (
          <div className="space-y-3">
            {filtered.map((prompt) => (
              <Card
                key={prompt.id}
                className="hover-elevate group cursor-pointer"
                onClick={() => navigate(`/prompts/${prompt.id}`)}
                data-testid={`card-prompt-${prompt.id}`}
              >
                <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0 pb-2">
                  <div className="flex min-w-0 flex-wrap items-center gap-2">
                    <Sparkles className="h-4 w-4 shrink-0 text-primary" />
                    <h3 className="text-sm font-semibold">{prompt.name}</h3>
                    <Badge
                      variant="secondary"
                      className={categoryColors[prompt.category] || ""}
                    >
                      {categoryLabels[prompt.category] || prompt.category}
                    </Badge>
                    <Badge variant="secondary">
                      {prompt.type === "system"
                        ? "Sistema"
                        : prompt.type === "task"
                          ? "Tarefa"
                          : "Auxiliar"}
                    </Badge>
                    {!prompt.active && (
                      <Badge variant="secondary" className="opacity-50">
                        Inativo
                      </Badge>
                    )}
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                </CardHeader>
                <CardContent>
                  <pre className="max-h-20 overflow-hidden whitespace-pre-wrap rounded-md bg-muted p-2 font-mono text-[10px] text-muted-foreground">
                    {prompt.content}
                  </pre>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
              <Sparkles className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold">Nenhum prompt encontrado</h3>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">
              Crie modelos de prompt configuráveis para geração de conteúdo por
              IA.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { FileText, Trash2, BookOpen } from "lucide-react";
import type { Script } from "@shared/schema";

interface ScriptWithProject extends Script {
  projectTitle?: string;
}

export default function ScriptsPage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const { data: scripts, isLoading } = useQuery<ScriptWithProject[]>({
    queryKey: ["/api/scripts"],
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/scripts/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/scripts"] });
      toast({ title: "Roteiro removido" });
    },
  });

  const typeColors: Record<string, string> = {
    synopsis: "bg-blue-500/10 text-blue-700 dark:text-blue-400",
    outline: "bg-amber-500/10 text-amber-700 dark:text-amber-400",
    detailed: "bg-green-500/10 text-green-700 dark:text-green-400",
  };

  const typeLabels: Record<string, string> = {
    synopsis: "Sinopse",
    outline: "Esboço",
    detailed: "Detalhado",
  };

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1
            className="text-2xl font-bold tracking-tight"
            data-testid="text-scripts-title"
          >
            Roteiros
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Todos os roteiros vinculados aos seus Projetos
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {isLoading ? (
          [1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="flex items-center gap-4 py-4">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-5 w-16" />
              </CardContent>
            </Card>
          ))
        ) : scripts && scripts.length > 0 ? (
          scripts?.map((script) => (
            <Card
              key={script.id}
              className="hover-elevate cursor-pointer"
              onClick={() => navigate(`/scripts/${script.id}`)}
              data-testid={`card-script-${script.id}`}
            >
              <CardContent className="flex items-center justify-between gap-4 py-4">
                <div className="flex min-w-0 items-center gap-3">
                  <FileText className="h-5 w-5 shrink-0 text-primary" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{script.title}</p>
                    {script.projectTitle && (
                      <div className="mt-0.5 flex items-center gap-1">
                        <BookOpen className="h-3 w-3 text-muted-foreground" />
                        <p className="text-xs text-muted-foreground">
                          {script.projectTitle}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge
                    variant="secondary"
                    className={typeColors[script.type] || ""}
                  >
                    {typeLabels[script.type] || script.type}
                  </Badge>
                  <Badge variant="secondary">
                    {script.origin === "ai" ? "IA" : "Manual"}
                  </Badge>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (window.confirm("Remover este roteiro?"))
                        deleteMutation.mutate(script.id);
                    }}
                    data-testid={`button-delete-script-${script.id}`}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
              <FileText className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold">Nenhum roteiro encontrado</h3>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">
              Os roteiros são criados dentro dos Projetos. Vá para um Projeto
              para criar um.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

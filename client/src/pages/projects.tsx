import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Plus, BookOpen, Search, ChevronRight, Sparkles } from "lucide-react";
import type { Project } from "@shared/schema";

const statusColors: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  "in-development": "bg-primary/10 text-primary",
  finished: "bg-green-500/10 text-green-700 dark:text-green-400",
};

const statusLabels: Record<string, string> = {
  draft: "Rascunho",
  "in-development": "Em Desenvolvimento",
  finished: "Finalizado",
};

export default function ProjectsPage() {
  const [, navigate] = useLocation();
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [premise, setPremise] = useState("");
  const [tone, setTone] = useState("");
  const [status, setStatus] = useState("draft");
  const { toast } = useToast();

  const { data: projects, isLoading } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/projects", {
        title,
        premise,
        tone,
        status,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      setOpen(false);
      setTitle("");
      setPremise("");
      setTone("");
      setStatus("draft");
      toast({ title: "Projeto criado com sucesso" });
    },
    onError: (err: Error) => {
      toast({
        title: "Erro ao criar projeto",
        description: err.message,
        variant: "destructive",
      });
    },
  });

  const filtered = projects?.filter(
    (p) =>
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.premise?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1
            className="text-2xl font-bold tracking-tight"
            data-testid="text-projects-title"
          >
            Projetos
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Gerencie seus projetos e narrativas criativas
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="border-primary/50 text-primary hover:bg-primary/5"
            onClick={() => navigate("/wizard/idea")}
            data-testid="button-wizard"
          >
            <Sparkles className="mr-2 h-4 w-4" />
            Wizard de Projeto
          </Button>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button data-testid="button-create-project">
                <Plus className="mr-2 h-4 w-4" />
                Novo Projeto
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Criar Novo Projeto</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-2">
                <div className="space-y-2">
                  <Label>Título</Label>
                  <Input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Título do projeto..."
                    data-testid="input-project-title"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Premissa</Label>
                  <Textarea
                    value={premise}
                    onChange={(e) => setPremise(e.target.value)}
                    placeholder="Sobre o que é este projeto?"
                    className="resize-none"
                    rows={3}
                    data-testid="input-project-premise"
                  />
                </div>
                <div className="flex gap-4">
                  <div className="flex-1 space-y-2">
                    <Label>Tom / Gênero</Label>
                    <Input
                      value={tone}
                      onChange={(e) => setTone(e.target.value)}
                      placeholder="ex: Fantasia Épica, Ficção Científica"
                      data-testid="input-project-tone"
                    />
                  </div>
                  <div className="flex-1 space-y-2">
                    <Label>Status</Label>
                    <Select value={status} onValueChange={setStatus}>
                      <SelectTrigger data-testid="select-project-status">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="draft">Rascunho</SelectItem>
                        <SelectItem value="in-development">
                          Em Desenvolvimento
                        </SelectItem>
                        <SelectItem value="finished">Finalizado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Button
                  className="w-full"
                  onClick={() => createMutation.mutate()}
                  disabled={!title.trim() || createMutation.isPending}
                  data-testid="button-submit-project"
                >
                  {createMutation.isPending ? "Criando..." : "Criar Projeto"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar projetos..."
          className="pl-9"
          data-testid="input-search-projects"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {isLoading ? (
          [1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0 pb-2">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-5 w-16" />
              </CardHeader>
              <CardContent>
                <Skeleton className="mb-2 h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
              </CardContent>
            </Card>
          ))
        ) : filtered && filtered.length > 0 ? (
          filtered?.map((project) => (
            <Card
              key={project.id}
              className="hover-elevate group cursor-pointer"
              onClick={() => navigate(`/projects/${project.id}`)}
              data-testid={`card-project-${project.id}`}
            >
              <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0 pb-2">
                <div className="flex min-w-0 items-center gap-2">
                  <BookOpen className="h-4 w-4 shrink-0 text-primary" />
                  <h3 className="truncate text-sm font-semibold">
                    {project.title}
                  </h3>
                </div>
                <Badge
                  variant="secondary"
                  className={statusColors[project.status] || ""}
                >
                  {statusLabels[project.status] || project.status}
                </Badge>
              </CardHeader>
              <CardContent>
                {project.premise ? (
                  <p className="line-clamp-2 text-sm text-muted-foreground">
                    {project.premise}
                  </p>
                ) : (
                  <p className="text-sm italic text-muted-foreground">
                    Sem premissa
                  </p>
                )}
                {project.tone && (
                  <p className="mt-2 text-xs text-muted-foreground">
                    {project.tone}
                  </p>
                )}
                <div className="mt-3 flex items-center justify-end">
                  <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="col-span-full flex flex-col items-center justify-center py-20 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
              <BookOpen className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold">Nenhum projeto encontrado</h3>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">
              Crie seu primeiro projeto para começar a construir seu universo
              criativo.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

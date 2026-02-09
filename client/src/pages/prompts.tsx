import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Plus, Sparkles, Search, Pencil, Trash2, X, Copy } from "lucide-react";
import type { Prompt } from "@shared/schema";

const categoryColors: Record<string, string> = {
  character: "bg-blue-500/10 text-blue-700 dark:text-blue-400",
  Project: "bg-amber-500/10 text-amber-700 dark:text-amber-400",
  script: "bg-green-500/10 text-green-700 dark:text-green-400",
  refinement: "bg-purple-500/10 text-purple-700 dark:text-purple-400",
};

const categoryLabels: Record<string, string> = {
  character: "Personagem",
  Project: "Projeto",
  script: "Roteiro",
  refinement: "Refinamento",
};

const PromptForm = ({
  form,
  setForm,
  isCreate,
  onSubmit,
  isPending,
}: {
  form: any;
  setForm: (f: any) => void;
  isCreate: boolean;
  onSubmit: () => void;
  isPending: boolean;
}) => (
  <div className="space-y-4">
    <div className="space-y-2">
      <Label>Nome</Label>
      <Input
        value={form.name}
        onChange={(e) => setForm({ ...form, name: e.target.value })}
        placeholder="ex: Gerar Sinopse"
        data-testid="input-prompt-name"
      />
    </div>
    <div className="flex gap-4">
      <div className="flex-1 space-y-2">
        <Label>Categoria</Label>
        <Select
          value={form.category}
          onValueChange={(v) => setForm({ ...form, category: v })}
        >
          <SelectTrigger data-testid="select-prompt-category">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="character">Personagem</SelectItem>
            <SelectItem value="Project">Projeto</SelectItem>
            <SelectItem value="script">Roteiro</SelectItem>
            <SelectItem value="refinement">Refinamento</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="flex-1 space-y-2">
        <Label>Tipo</Label>
        <Select
          value={form.type}
          onValueChange={(v) => setForm({ ...form, type: v })}
        >
          <SelectTrigger data-testid="select-prompt-type">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="system">Sistema</SelectItem>
            <SelectItem value="task">Tarefa</SelectItem>
            <SelectItem value="auxiliary">Auxiliar</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
    <div className="space-y-2">
      <Label>Conteúdo</Label>
      <Textarea
        value={form.content}
        onChange={(e) => setForm({ ...form, content: e.target.value })}
        placeholder="Escreva seu modelo de prompt aqui. Use {{Project.title}}, {{character.name}} etc. para variáveis."
        rows={8}
        className="font-mono text-sm"
        data-testid="input-prompt-content"
      />
    </div>
    <div className="flex items-center gap-2">
      <Switch
        checked={form.active}
        onCheckedChange={(checked) => setForm({ ...form, active: checked })}
        data-testid="switch-prompt-active"
      />
      <Label>Ativo</Label>
    </div>
    <Button
      className="w-full"
      onClick={onSubmit}
      disabled={!form.name.trim() || !form.content.trim() || isPending}
      data-testid="button-submit-prompt"
    >
      {isCreate
        ? isPending
          ? "Criando..."
          : "Criar Prompt"
        : isPending
          ? "Salvando..."
          : "Salvar Alterações"}
    </Button>
  </div>
);

export default function PromptsPage() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [createOpen, setCreateOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState({
    name: "",
    category: "Project",
    type: "task",
    content: "",
    active: true,
  });
  const { toast } = useToast();

  const { data: prompts, isLoading } = useQuery<Prompt[]>({
    queryKey: ["/api/prompts"],
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/prompts", form);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/prompts"] });
      setCreateOpen(false);
      resetForm();
      toast({ title: "Prompt criado" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("PATCH", `/api/prompts/${editingId}`, form);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/prompts"] });
      setEditingId(null);
      resetForm();
      toast({ title: "Prompt atualizado" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/prompts/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/prompts"] });
      toast({ title: "Prompt removido" });
    },
  });

  const resetForm = () =>
    setForm({
      name: "",
      category: "Project",
      type: "task",
      content: "",
      active: true,
    });

  const startEditing = (p: Prompt) => {
    setEditingId(p.id);
    setForm({
      name: p.name,
      category: p.category,
      type: p.type,
      content: p.content,
      active: p.active,
    });
  };

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
        <Dialog
          open={createOpen}
          onOpenChange={(o) => {
            setCreateOpen(o);
            if (!o) resetForm();
          }}
        >
          <DialogTrigger asChild>
            <Button data-testid="button-create-prompt">
              <Plus className="mr-2 h-4 w-4" />
              Novo Prompt
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Criar Prompt</DialogTitle>
            </DialogHeader>
            <PromptForm
              isCreate
              form={form}
              setForm={setForm}
              onSubmit={() => createMutation.mutate()}
              isPending={createMutation.isPending}
            />
          </DialogContent>
        </Dialog>
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
        <Tabs value={category} onValueChange={setCategory}>
          <TabsList>
            <TabsTrigger value="all">Todos</TabsTrigger>
            <TabsTrigger value="Project">Projeto</TabsTrigger>
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
              <Card key={prompt.id} data-testid={`card-prompt-${prompt.id}`}>
                {editingId === prompt.id ? (
                  <CardContent className="space-y-3 pt-4">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="text-sm font-semibold">
                        Editando: {prompt.name}
                      </h3>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => {
                          setEditingId(null);
                          resetForm();
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    <PromptForm
                      isCreate={false}
                      form={form}
                      setForm={setForm}
                      onSubmit={() => updateMutation.mutate()}
                      isPending={updateMutation.isPending}
                    />
                  </CardContent>
                ) : (
                  <>
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
                        <span className="text-xs text-muted-foreground">
                          v{prompt.version}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => {
                            navigator.clipboard.writeText(prompt.content);
                            toast({
                              title: "Copiado para a área de transferência",
                            });
                          }}
                          data-testid={`button-copy-prompt-${prompt.id}`}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => startEditing(prompt)}
                          data-testid={`button-edit-prompt-${prompt.id}`}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => {
                            if (window.confirm(`Remover "${prompt.name}"?`))
                              deleteMutation.mutate(prompt.id);
                          }}
                          data-testid={`button-delete-prompt-${prompt.id}`}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <pre className="max-h-32 overflow-auto whitespace-pre-wrap rounded-md bg-muted p-3 font-mono text-xs text-muted-foreground">
                        {prompt.content}
                      </pre>
                    </CardContent>
                  </>
                )}
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

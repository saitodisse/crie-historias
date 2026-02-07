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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import {
  Plus,
  Users,
  Search,
  Pencil,
  Trash2,
  X,
  Sparkles,
  Copy,
  Send,
  MessageSquare,
} from "lucide-react";
import type { Character, AIExecution } from "@shared/schema";

interface AIResult {
  execution: AIExecution;
  result: string;
}

const CharacterForm = ({
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
        placeholder="Nome do personagem..."
        data-testid="input-char-name"
      />
    </div>
    <div className="space-y-2">
      <Label>Descrição Física</Label>
      <Textarea
        value={form.description}
        onChange={(e) => setForm({ ...form, description: e.target.value })}
        placeholder="Aparência, porte físico, características marcantes..."
        rows={2}
        className="resize-none"
        data-testid="input-char-description"
      />
    </div>
    <div className="space-y-2">
      <Label>Personalidade</Label>
      <Textarea
        value={form.personality}
        onChange={(e) => setForm({ ...form, personality: e.target.value })}
        placeholder="Traços, temperamento, peculiaridades..."
        rows={2}
        className="resize-none"
        data-testid="input-char-personality"
      />
    </div>
    <div className="space-y-2">
      <Label>Histórico (Background)</Label>
      <Textarea
        value={form.background}
        onChange={(e) => setForm({ ...form, background: e.target.value })}
        placeholder="História de vida, motivações, segredos..."
        rows={2}
        className="resize-none"
        data-testid="input-char-background"
      />
    </div>
    <div className="space-y-2">
      <Label>Notas</Label>
      <Textarea
        value={form.notes}
        onChange={(e) => setForm({ ...form, notes: e.target.value })}
        placeholder="Notas adicionais..."
        rows={2}
        className="resize-none"
        data-testid="input-char-notes"
      />
    </div>
    <Button
      className="w-full"
      onClick={onSubmit}
      disabled={!form.name.trim() || isPending}
      data-testid="button-submit-character"
    >
      {isCreate
        ? isPending
          ? "Criando..."
          : "Criar Personagem"
        : isPending
          ? "Salvando..."
          : "Salvar Alterações"}
    </Button>
  </div>
);

export default function CharactersPage() {
  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState({
    name: "",
    description: "",
    personality: "",
    background: "",
    notes: "",
  });
  const [aiDialogOpen, setAiDialogOpen] = useState(false);
  const [aiCharId, setAiCharId] = useState<number | null>(null);
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiResult, setAiResult] = useState<AIResult | null>(null);
  const { toast } = useToast();

  const { data: characters, isLoading } = useQuery<Character[]>({
    queryKey: ["/api/characters"],
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/characters", form);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/characters"] });
      setCreateOpen(false);
      resetForm();
      toast({ title: "Personagem criado" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("PATCH", `/api/characters/${editingId}`, form);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/characters"] });
      setEditingId(null);
      resetForm();
      toast({ title: "Personagem atualizado" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/characters/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/characters"] });
      toast({ title: "Personagem removido" });
    },
  });

  const generateMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/ai/generate", {
        characterId: aiCharId,
        userPrompt: aiPrompt,
        type: "character",
      });
      return res.json() as Promise<AIResult>;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/characters"] });
      queryClient.invalidateQueries({ queryKey: ["/api/executions"] });
      setAiResult(data);
    },
    onError: (err: Error) => {
      toast({
        title: "Geração falhou",
        description: err.message,
        variant: "destructive",
      });
    },
  });

  const resetForm = () =>
    setForm({
      name: "",
      description: "",
      personality: "",
      background: "",
      notes: "",
    });

  const startEditing = (char: Character) => {
    setEditingId(char.id);
    setForm({
      name: char.name,
      description: char.description || "",
      personality: char.personality || "",
      background: char.background || "",
      notes: char.notes || "",
    });
  };

  const filtered = characters?.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.description?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex h-full flex-col">
      <div className="flex flex-wrap items-center justify-between gap-4 p-6 pb-4">
        <div>
          <h1
            className="text-2xl font-bold tracking-tight"
            data-testid="text-characters-title"
          >
            Personagens
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Personagens que podem ser vinculados a qualquer história
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
            <Button data-testid="button-create-character">
              <Plus className="mr-2 h-4 w-4" />
              Novo Personagem
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Criar Personagem</DialogTitle>
              <DialogDescription>
                Preencha os dados do novo personagem.
              </DialogDescription>
            </DialogHeader>
            <CharacterForm
              isCreate
              form={form}
              setForm={setForm}
              onSubmit={() => createMutation.mutate()}
              isPending={createMutation.isPending}
            />
          </DialogContent>
        </Dialog>
      </div>

      <div className="px-6 pb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar personagens..."
            className="pl-9"
            data-testid="input-search-characters"
          />
        </div>
      </div>

      <div className="flex-1 overflow-auto px-6 pb-6">
        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardContent className="pt-4">
                  <Skeleton className="mb-2 h-5 w-32" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="mt-1 h-4 w-2/3" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filtered && filtered.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((char) => (
              <Card key={char.id} data-testid={`card-character-${char.id}`}>
                {editingId === char.id ? (
                  <CardContent className="space-y-3 pt-4">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="text-sm font-semibold">
                        Editando: {char.name}
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
                    <CharacterForm
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
                      <div className="flex min-w-0 items-center gap-2">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
                          <Users className="h-4 w-4 text-primary" />
                        </div>
                        <div className="min-w-0">
                          <h3 className="truncate text-sm font-semibold">
                            {char.name}
                          </h3>
                          {!char.active && (
                            <Badge variant="secondary" className="text-xs">
                              Inativo
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => {
                            setAiCharId(char.id);
                            setAiDialogOpen(true);
                          }}
                          data-testid={`button-ai-char-${char.id}`}
                        >
                          <Sparkles className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => startEditing(char)}
                          data-testid={`button-edit-char-${char.id}`}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => {
                            if (window.confirm(`Remover "${char.name}"?`))
                              deleteMutation.mutate(char.id);
                          }}
                          data-testid={`button-delete-char-${char.id}`}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {char.description && (
                        <p className="mb-1 line-clamp-2 text-sm text-muted-foreground">
                          {char.description}
                        </p>
                      )}
                      {char.personality && (
                        <p className="text-xs text-muted-foreground">
                          <span className="font-medium">Personalidade:</span>{" "}
                          {char.personality}
                        </p>
                      )}
                      {char.background && (
                        <p className="mt-1 text-xs text-muted-foreground">
                          <span className="font-medium">Histórico:</span>{" "}
                          {char.background}
                        </p>
                      )}
                    </CardContent>
                  </>
                )}
              </Card>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
              <Users className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold">
              Nenhum personagem encontrado
            </h3>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">
              Crie personagens reutilizáveis que podem ser compartilhados entre
              múltiplas histórias.
            </p>
          </div>
        )}
      </div>

      <Dialog
        open={aiDialogOpen}
        onOpenChange={(o) => {
          setAiDialogOpen(o);
          if (!o) {
            setAiResult(null);
            setAiPrompt("");
          }
        }}
      >
        <DialogContent className="max-h-[85vh] max-w-3xl">
          <DialogHeader>
            <DialogTitle>Gerar com IA</DialogTitle>
            <DialogDescription>
              Os dados do personagem serão enviados como contexto para a IA.
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[65vh]">
            <div className="space-y-4 pr-4">
              {!aiResult ? (
                <>
                  <div className="space-y-2">
                    <Label>
                      O que você gostaria de gerar para este personagem?
                    </Label>
                    <Textarea
                      value={aiPrompt}
                      onChange={(e) => setAiPrompt(e.target.value)}
                      placeholder="ex: Expanda o histórico deste personagem, desenvolva suas motivações..."
                      rows={4}
                      data-testid="input-ai-char-prompt"
                    />
                  </div>
                  <Button
                    className="w-full"
                    onClick={() => generateMutation.mutate()}
                    disabled={!aiPrompt.trim() || generateMutation.isPending}
                    data-testid="button-submit-ai-char"
                  >
                    <Send className="mr-2 h-4 w-4" />
                    {generateMutation.isPending
                      ? "Gerando..."
                      : "Enviar para IA"}
                  </Button>
                </>
              ) : (
                <>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="secondary">
                      {aiResult.execution.model}
                    </Badge>
                    <Badge variant="outline">
                      {JSON.stringify(
                        (aiResult.execution.parameters as any)?.maxTokens || 0
                      )}{" "}
                      tokens máx.
                    </Badge>
                  </div>

                  <div>
                    <div className="mb-1 flex items-center justify-between gap-2">
                      <Label className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Send className="h-3 w-3" /> Enviado (Prompt Final)
                      </Label>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          navigator.clipboard.writeText(
                            aiResult.execution.finalPrompt
                          );
                          toast({ title: "Prompt copiado" });
                        }}
                      >
                        <Copy className="mr-1 h-3 w-3" />
                        Copiar
                      </Button>
                    </div>
                    <pre
                      className="mt-1 max-h-32 overflow-auto whitespace-pre-wrap rounded-md bg-muted p-3 font-mono text-xs"
                      data-testid="text-ai-sent"
                    >
                      {aiResult.execution.finalPrompt}
                    </pre>
                  </div>

                  {aiResult.execution.systemPromptSnapshot && (
                    <div>
                      <Label className="text-xs text-muted-foreground">
                        Prompt de Sistema
                      </Label>
                      <pre className="mt-1 max-h-24 overflow-auto whitespace-pre-wrap rounded-md bg-muted p-3 font-mono text-xs">
                        {aiResult.execution.systemPromptSnapshot}
                      </pre>
                    </div>
                  )}

                  <Separator />

                  <div>
                    <div className="mb-1 flex items-center justify-between gap-2">
                      <Label className="flex items-center gap-1 text-xs text-muted-foreground">
                        <MessageSquare className="h-3 w-3" /> Recebido
                        (Resultado)
                      </Label>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          if (aiResult.result) {
                            navigator.clipboard.writeText(aiResult.result);
                            toast({ title: "Resultado copiado" });
                          }
                        }}
                      >
                        <Copy className="mr-1 h-3 w-3" />
                        Copiar
                      </Button>
                    </div>
                    {aiResult.result ? (
                      <div
                        className="prose prose-sm max-w-none whitespace-pre-wrap rounded-md bg-muted p-4 font-serif dark:prose-invert"
                        data-testid="text-ai-result"
                      >
                        {aiResult.result}
                      </div>
                    ) : (
                      <div
                        className="rounded-md bg-destructive/10 p-4 text-sm text-destructive"
                        data-testid="text-ai-empty"
                      >
                        A IA retornou um resultado vazio. Tente um modelo
                        diferente ou reformule o prompt.
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setAiResult(null)}
                      data-testid="button-ai-new-prompt"
                    >
                      Novo Prompt
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={() => {
                        setAiDialogOpen(false);
                        setAiResult(null);
                        setAiPrompt("");
                      }}
                    >
                      Fechar
                    </Button>
                  </div>
                </>
              )}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
}

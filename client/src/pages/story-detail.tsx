import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation, useParams } from "wouter";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  ArrowLeft,
  Save,
  Trash2,
  FileText,
  Users,
  Sparkles,
  Plus,
  UserPlus,
  X,
  Copy,
  Send,
  MessageSquare,
} from "lucide-react";
import type { Story, Character, Script, AIExecution } from "@shared/schema";

interface StoryDetail extends Story {
  characters?: Character[];
  scripts?: Script[];
  aiExecutions?: AIExecution[];
}

interface AIResult {
  execution: AIExecution;
  result: string;
}

export default function StoryDetailPage() {
  const params = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const storyId = parseInt(params.id);

  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState("");
  const [premise, setPremise] = useState("");
  const [tone, setTone] = useState("");
  const [status, setStatus] = useState("draft");
  const [addCharOpen, setAddCharOpen] = useState(false);
  const [scriptDialogOpen, setScriptDialogOpen] = useState(false);
  const [scriptTitle, setScriptTitle] = useState("");
  const [scriptType, setScriptType] = useState("synopsis");
  const [scriptContent, setScriptContent] = useState("");
  const [aiDialogOpen, setAiDialogOpen] = useState(false);
  const [aiUserPrompt, setAiUserPrompt] = useState("");
  const [aiResult, setAiResult] = useState<AIResult | null>(null);

  const { data: story, isLoading } = useQuery<StoryDetail>({
    queryKey: ["/api/stories", storyId],
    enabled: !!storyId,
  });

  const { data: allCharacters } = useQuery<Character[]>({
    queryKey: ["/api/characters"],
  });

  const updateMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("PATCH", `/api/stories/${storyId}`, {
        title,
        premise,
        tone,
        status,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/stories", storyId] });
      queryClient.invalidateQueries({ queryKey: ["/api/stories"] });
      setEditing(false);
      toast({ title: "História atualizada" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("DELETE", `/api/stories/${storyId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/stories"] });
      navigate("/");
      toast({ title: "História removida" });
    },
  });

  const addCharMutation = useMutation({
    mutationFn: async (characterId: number) => {
      await apiRequest("POST", `/api/stories/${storyId}/characters`, {
        characterId,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/stories", storyId] });
      setAddCharOpen(false);
      toast({ title: "Personagem vinculado à história" });
    },
  });

  const removeCharMutation = useMutation({
    mutationFn: async (characterId: number) => {
      await apiRequest(
        "DELETE",
        `/api/stories/${storyId}/characters/${characterId}`
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/stories", storyId] });
      toast({ title: "Vínculo removido" });
    },
  });

  const createScriptMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/scripts", {
        storyId,
        title: scriptTitle,
        type: scriptType,
        content: scriptContent,
        origin: "manual",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/stories", storyId] });
      setScriptDialogOpen(false);
      setScriptTitle("");
      setScriptContent("");
      toast({ title: "Roteiro criado" });
    },
  });

  const generateMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/ai/generate", {
        storyId,
        userPrompt: aiUserPrompt,
        type: "story",
      });
      return res.json() as Promise<AIResult>;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/stories", storyId] });
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

  const startEditing = () => {
    if (story) {
      setTitle(story.title);
      setPremise(story.premise || "");
      setTone(story.tone || "");
      setStatus(story.status);
      setEditing(true);
    }
  };

  const linkedCharIds = new Set(story?.characters?.map((c) => c.id) || []);
  const availableChars =
    allCharacters?.filter((c) => !linkedCharIds.has(c.id) && c.active) || [];

  if (isLoading) {
    return (
      <div className="space-y-6 p-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-9 w-9" />
          <Skeleton className="h-7 w-48" />
        </div>
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (!story) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-muted-foreground">História não encontrada</p>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col overflow-auto">
      <div className="flex flex-wrap items-center justify-between gap-4 p-6 pb-4">
        <div className="flex items-center gap-3">
          <Button
            size="icon"
            variant="ghost"
            onClick={() => navigate("/")}
            data-testid="button-back-stories"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          {editing ? (
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="h-auto py-1 text-xl font-bold"
              data-testid="input-edit-title"
            />
          ) : (
            <h1
              className="text-2xl font-bold tracking-tight"
              data-testid="text-story-title"
            >
              {story.title}
            </h1>
          )}
        </div>
        <div className="flex items-center gap-2">
          {editing ? (
            <>
              <Button
                variant="ghost"
                onClick={() => setEditing(false)}
                data-testid="button-cancel-edit"
              >
                Cancelar
              </Button>
              <Button
                onClick={() => updateMutation.mutate()}
                disabled={updateMutation.isPending}
                data-testid="button-save-story"
              >
                <Save className="mr-2 h-4 w-4" />
                Salvar
              </Button>
            </>
          ) : (
            <>
              <Dialog
                open={aiDialogOpen}
                onOpenChange={(o) => {
                  setAiDialogOpen(o);
                  if (!o) {
                    setAiResult(null);
                    setAiUserPrompt("");
                  }
                }}
              >
                <DialogTrigger asChild>
                  <Button variant="outline" data-testid="button-ai-generate">
                    <Sparkles className="mr-2 h-4 w-4" />
                    Gerar com IA
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-h-[85vh] max-w-3xl">
                  <DialogHeader>
                    <DialogTitle>Gerar Conteúdo com IA</DialogTitle>
                    <DialogDescription>
                      Contexto da história será enviado automaticamente junto
                      com seu prompt.
                    </DialogDescription>
                  </DialogHeader>
                  <ScrollArea className="max-h-[65vh]">
                    <div className="space-y-4 pr-4">
                      {!aiResult ? (
                        <>
                          <div className="space-y-2">
                            <Label>O que você gostaria de gerar?</Label>
                            <Textarea
                              value={aiUserPrompt}
                              onChange={(e) => setAiUserPrompt(e.target.value)}
                              placeholder="ex: Expanda a premissa em uma sinopse detalhada, sugira reviravoltas..."
                              rows={4}
                              data-testid="input-ai-prompt"
                            />
                          </div>
                          <Button
                            className="w-full"
                            onClick={() => generateMutation.mutate()}
                            disabled={
                              !aiUserPrompt.trim() || generateMutation.isPending
                            }
                            data-testid="button-submit-ai"
                          >
                            <Send className="mr-2 h-4 w-4" />
                            {generateMutation.isPending
                              ? "Gerando..."
                              : "Enviar para IA"}
                          </Button>
                        </>
                      ) : (
                        <>
                          <div>
                            <div className="mb-2 flex flex-wrap items-center gap-2">
                              <Badge variant="secondary">
                                {aiResult.execution.model}
                              </Badge>
                              <Badge variant="outline">
                                {JSON.stringify(
                                  (aiResult.execution.parameters as any)
                                    ?.maxTokens || 0
                                )}{" "}
                                tokens máx.
                              </Badge>
                            </div>
                          </div>

                          <div>
                            <div className="mb-1 flex items-center justify-between gap-2">
                              <Label className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Send className="h-3 w-3" /> Enviado (Prompt
                                Final)
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
                                    navigator.clipboard.writeText(
                                      aiResult.result
                                    );
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
                                A IA retornou um resultado vazio. Tente um
                                modelo diferente ou reformule o prompt.
                              </div>
                            )}
                          </div>

                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              onClick={() => {
                                setAiResult(null);
                              }}
                              data-testid="button-ai-new-prompt"
                            >
                              Novo Prompt
                            </Button>
                            <Button
                              variant="ghost"
                              onClick={() => {
                                setAiDialogOpen(false);
                                setAiResult(null);
                                setAiUserPrompt("");
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
              <Button
                variant="outline"
                onClick={startEditing}
                data-testid="button-edit-story"
              >
                Editar
              </Button>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => {
                  if (
                    window.confirm(
                      "Deseja remover esta história e todos os seus roteiros?"
                    )
                  ) {
                    deleteMutation.mutate();
                  }
                }}
                data-testid="button-delete-story"
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="px-6 pb-4">
        <Card>
          <CardContent className="pt-4">
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <Label className="text-xs text-muted-foreground">Status</Label>
                {editing ? (
                  <Select value={status} onValueChange={setStatus}>
                    <SelectTrigger className="mt-1">
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
                ) : (
                  <p className="mt-1 text-sm capitalize">
                    {story.status === "draft"
                      ? "Rascunho"
                      : story.status === "in-development"
                        ? "Em Desenvolvimento"
                        : "Finalizado"}
                  </p>
                )}
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">
                  Tom / Gênero
                </Label>
                {editing ? (
                  <Input
                    value={tone}
                    onChange={(e) => setTone(e.target.value)}
                    className="mt-1"
                  />
                ) : (
                  <p className="mt-1 text-sm">
                    {story.tone || "Não especificado"}
                  </p>
                )}
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">
                  Criado em
                </Label>
                <p className="mt-1 text-sm">
                  {new Date(story.createdAt).toLocaleDateString("pt-BR")}
                </p>
              </div>
            </div>
            <div className="mt-4">
              <Label className="text-xs text-muted-foreground">Premissa</Label>
              {editing ? (
                <Textarea
                  value={premise}
                  onChange={(e) => setPremise(e.target.value)}
                  className="mt-1 resize-none"
                  rows={3}
                />
              ) : (
                <p className="mt-1 whitespace-pre-wrap text-sm">
                  {story.premise || "Nenhuma premissa definida"}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex-1 px-6 pb-6">
        <Tabs defaultValue="characters">
          <TabsList>
            <TabsTrigger value="characters" data-testid="tab-characters">
              <Users className="mr-2 h-4 w-4" />
              Personagens ({story.characters?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="scripts" data-testid="tab-scripts">
              <FileText className="mr-2 h-4 w-4" />
              Roteiros ({story.scripts?.length || 0})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="characters" className="mt-4">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
              <p className="text-sm text-muted-foreground">
                Personagens vinculados a esta história
              </p>
              <Dialog open={addCharOpen} onOpenChange={setAddCharOpen}>
                <DialogTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    data-testid="button-add-character"
                  >
                    <UserPlus className="mr-2 h-4 w-4" />
                    Vincular Personagem
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Vincular Personagem à História</DialogTitle>
                    <DialogDescription>
                      Selecione um personagem para vincular a esta história.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="max-h-[50vh] space-y-2 overflow-auto pt-2">
                    {availableChars.length > 0 ? (
                      availableChars.map((char) => (
                        <Card
                          key={char.id}
                          className="hover-elevate cursor-pointer"
                          onClick={() => addCharMutation.mutate(char.id)}
                        >
                          <CardContent className="flex items-center justify-between py-3">
                            <div>
                              <p className="text-sm font-medium">{char.name}</p>
                              <p className="max-w-xs truncate text-xs text-muted-foreground">
                                {char.description || "Sem descrição"}
                              </p>
                            </div>
                            <Plus className="h-4 w-4 text-muted-foreground" />
                          </CardContent>
                        </Card>
                      ))
                    ) : (
                      <p className="py-4 text-center text-sm text-muted-foreground">
                        Nenhum personagem disponível. Crie um na seção de
                        Personagens primeiro.
                      </p>
                    )}
                  </div>
                </DialogContent>
              </Dialog>
            </div>
            {story.characters && story.characters.length > 0 ? (
              <div className="grid gap-3 sm:grid-cols-2">
                {story.characters.map((char) => (
                  <Card
                    key={char.id}
                    data-testid={`card-linked-char-${char.id}`}
                  >
                    <CardContent className="flex items-center justify-between py-3">
                      <div className="min-w-0">
                        <p className="text-sm font-medium">{char.name}</p>
                        <p className="truncate text-xs text-muted-foreground">
                          {char.personality ||
                            char.description ||
                            "Sem detalhes"}
                        </p>
                      </div>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => removeCharMutation.mutate(char.id)}
                        data-testid={`button-remove-char-${char.id}`}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center py-8 text-center">
                <Users className="mb-2 h-8 w-8 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  Nenhum personagem vinculado
                </p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="scripts" className="mt-4">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
              <p className="text-sm text-muted-foreground">
                Roteiros derivados desta história
              </p>
              <Dialog
                open={scriptDialogOpen}
                onOpenChange={setScriptDialogOpen}
              >
                <DialogTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    data-testid="button-create-script"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Novo Roteiro
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Criar Roteiro</DialogTitle>
                    <DialogDescription>
                      Crie um novo roteiro vinculado a esta história.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 pt-2">
                    <div className="flex gap-4">
                      <div className="flex-1 space-y-2">
                        <Label>Título</Label>
                        <Input
                          value={scriptTitle}
                          onChange={(e) => setScriptTitle(e.target.value)}
                          placeholder="Título do roteiro..."
                          data-testid="input-script-title"
                        />
                      </div>
                      <div className="w-40 space-y-2">
                        <Label>Tipo</Label>
                        <Select
                          value={scriptType}
                          onValueChange={setScriptType}
                        >
                          <SelectTrigger data-testid="select-script-type">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="synopsis">Sinopse</SelectItem>
                            <SelectItem value="outline">Esboço</SelectItem>
                            <SelectItem value="detailed">Detalhado</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Conteúdo</Label>
                      <Textarea
                        value={scriptContent}
                        onChange={(e) => setScriptContent(e.target.value)}
                        placeholder="Escreva o conteúdo do roteiro..."
                        rows={10}
                        className="font-mono text-sm"
                        data-testid="input-script-content"
                      />
                    </div>
                    <Button
                      className="w-full"
                      onClick={() => createScriptMutation.mutate()}
                      disabled={
                        !scriptTitle.trim() || createScriptMutation.isPending
                      }
                      data-testid="button-submit-script"
                    >
                      Criar Roteiro
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
            {story.scripts && story.scripts.length > 0 ? (
              <div className="space-y-3">
                {story.scripts.map((script) => (
                  <Card
                    key={script.id}
                    className="hover-elevate cursor-pointer"
                    onClick={() => navigate(`/scripts/${script.id}`)}
                    data-testid={`card-script-${script.id}`}
                  >
                    <CardContent className="flex items-center justify-between py-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <FileText className="h-4 w-4 shrink-0 text-primary" />
                        <div className="min-w-0">
                          <p className="text-sm font-medium">{script.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {script.type === "synopsis"
                              ? "Sinopse"
                              : script.type === "outline"
                                ? "Esboço"
                                : "Detalhado"}{" "}
                            -{" "}
                            {script.origin === "ai"
                              ? "Gerado por IA"
                              : "Manual"}
                          </p>
                        </div>
                      </div>
                      <Badge variant="secondary">
                        {script.type === "synopsis"
                          ? "Sinopse"
                          : script.type === "outline"
                            ? "Esboço"
                            : "Detalhado"}
                      </Badge>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center py-8 text-center">
                <FileText className="mb-2 h-8 w-8 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  Nenhum roteiro encontrado
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

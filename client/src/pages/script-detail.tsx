import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation, useParams } from "wouter";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent } from "@/components/ui/card";
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
  Sparkles,
  Copy,
  Send,
  MessageSquare,
  Wand2,
} from "lucide-react";
import { Markdown } from "@/components/markdown";
import type { Script, AIExecution, Prompt } from "@shared/schema";

interface ScriptDetail extends Script {
  projectTitle?: string;
  promptIds?: number[];
}

interface AIResult {
  execution: AIExecution;
  result: string;
}

export default function ScriptDetailPage() {
  const params = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const scriptId = parseInt(params.id);

  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState("");
  const [type, setType] = useState("synopsis");
  const [content, setContent] = useState("");
  const [aiOpen, setAiOpen] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [selectedPromptIds, setSelectedPromptIds] = useState<number[]>([]);
  const [aiResult, setAiResult] = useState<AIResult | null>(null);
  const [adjustOpen, setAdjustOpen] = useState(false);
  const [adjustPrompt, setAdjustPrompt] = useState("");
  const [adjustResult, setAdjustResult] = useState<AIResult | null>(null);
  const [isApplyingAdjust, setIsApplyingAdjust] = useState(false);

  const { data: allPrompts } = useQuery<Prompt[]>({
    queryKey: ["/api/prompts"],
  });

  const scriptPrompts = (allPrompts || []).filter(
    (p) => p.category === "script" && p.active
  );

  const { data: script, isLoading } = useQuery<ScriptDetail>({
    queryKey: ["/api/scripts", scriptId],
    enabled: !!scriptId,
  });

  // Sync selected prompts when script loads
  useState(() => {
    if (script?.promptIds) {
      setSelectedPromptIds(script.promptIds);
    }
  });

  // Re-sync if script data changes and not editing
  const [lastLoadedId, setLastLoadedId] = useState<number | null>(null);
  if (script && script.id !== lastLoadedId) {
    if (script.promptIds) setSelectedPromptIds(script.promptIds);
    setLastLoadedId(script.id);
  }

  const updateMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("PATCH", `/api/scripts/${scriptId}`, {
        title,
        type,
        content,
        promptIds: selectedPromptIds,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/scripts", scriptId] });
      queryClient.invalidateQueries({ queryKey: ["/api/scripts"] });
      setEditing(false);
      toast({ title: "Roteiro atualizado" });
    },
  });

  const generateMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/ai/generate", {
        scriptId,
        projectId: script?.projectId,
        userPrompt: aiPrompt,
        promptIds: selectedPromptIds,
        type: "script",
      });
      return res.json() as Promise<AIResult>;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/scripts", scriptId] });
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

  const deleteMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("DELETE", `/api/scripts/${scriptId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/scripts"] });
      navigate("/scripts");
      toast({ title: "Roteiro removido" });
    },
  });

  const adjustMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/ai/generate", {
        scriptId,
        projectId: script?.projectId,
        userPrompt: adjustPrompt,
        type: "script-adjustment",
      });
      return res.json() as Promise<AIResult>;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/executions"] });
      setAdjustResult(data);
    },
    onError: (err: Error) => {
      toast({
        title: "Ajuste falhou",
        description: err.message,
        variant: "destructive",
      });
    },
  });

  const applyAdjustment = () => {
    if (adjustResult?.result) {
      try {
        const parsed = JSON.parse(adjustResult.result);
        if (parsed.content) {
          setContent(parsed.content);
          setEditing(true);
          setAdjustOpen(false);
          setAdjustResult(null);
          setAdjustPrompt("");
          toast({ title: "Ajuste aplicado", description: "O conteúdo foi atualizado. Não esqueça de salvar." });
        }
      } catch (e) {
        // Fallback if not valid JSON or missing content
        setContent(adjustResult.result);
        setEditing(true);
        setAdjustOpen(false);
        setAdjustResult(null);
        setAdjustPrompt("");
        toast({ title: "Ajuste aplicado", description: "O conteúdo foi atualizado. Não esqueça de salvar." });
      }
    }
  };

  const startEditing = () => {
    if (script) {
      setTitle(script.title);
      setType(script.type);
      setContent(script.content || "");
      setEditing(true);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6 p-6">
        <Skeleton className="h-7 w-48" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!script) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-muted-foreground">Roteiro não encontrado</p>
      </div>
    );
  }

  const typeLabels: Record<string, string> = {
    synopsis: "Sinopse",
    outline: "Esboço",
    detailed: "Detalhado",
  };

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button
            size="icon"
            variant="ghost"
            onClick={() => navigate("/scripts")}
            data-testid="button-back-scripts"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            {editing ? (
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="h-auto py-1 text-xl font-bold"
              />
            ) : (
              <h1
                className="text-2xl font-bold tracking-tight"
                data-testid="text-script-title"
              >
                {script.title}
              </h1>
            )}
            {script.projectTitle && (
              <p className="mt-0.5 text-sm text-muted-foreground">
                Projeto: {script.projectTitle}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {editing ? (
            <>
              <Button variant="ghost" onClick={() => setEditing(false)}>
                Cancelar
              </Button>
              <Button
                onClick={() => updateMutation.mutate()}
                disabled={updateMutation.isPending}
              >
                <Save className="mr-2 h-4 w-4" />
                Salvar
              </Button>
            </>
          ) : (
            <>
              <Dialog
                open={aiOpen}
                onOpenChange={(o) => {
                  setAiOpen(o);
                  if (!o) {
                    setAiResult(null);
                    setAiPrompt("");
                  }
                }}
              >
                <DialogTrigger asChild>
                  <Button variant="outline" data-testid="button-ai-script">
                    <Sparkles className="mr-2 h-4 w-4" />
                    Gerar com IA
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-h-[85vh] max-w-3xl">
                  <DialogHeader>
                    <DialogTitle>Gerar Conteúdo do Roteiro</DialogTitle>
                    <DialogDescription>
                      O roteiro e projeto associado serão enviados como
                      contexto.
                    </DialogDescription>
                  </DialogHeader>
                  <ScrollArea className="max-h-[65vh]">
                    <div className="space-y-4 pr-4">
                      {!aiResult ? (
                        <>
                          <Textarea
                            value={aiPrompt}
                            onChange={(e) => setAiPrompt(e.target.value)}
                            placeholder="ex: Expanda isto em um roteiro completo, adicione mais diálogos..."
                            rows={4}
                            data-testid="input-ai-script-prompt"
                          />

                          <div className="space-y-2">
                            <Label className="text-sm font-medium">
                              Prompts Adicionais (Categoria Roteiro)
                            </Label>
                            <div className="flex flex-wrap gap-2">
                              {scriptPrompts.map((p) => {
                                const isSelected = selectedPromptIds.includes(
                                  p.id
                                );
                                return (
                                  <Button
                                    key={p.id}
                                    variant={
                                      isSelected ? "secondary" : "outline"
                                    }
                                    size="sm"
                                    className={`h-auto flex-col items-start px-3 py-2 text-left ${
                                      isSelected
                                        ? "border-primary/50 bg-primary/10"
                                        : ""
                                    }`}
                                    onClick={() => {
                                      setSelectedPromptIds((prev) =>
                                        prev.includes(p.id)
                                          ? prev.filter((id) => id !== p.id)
                                          : [...prev, p.id]
                                      );
                                    }}
                                  >
                                    <div className="flex w-full items-center justify-between gap-2">
                                      <span className="text-xs font-semibold leading-tight">
                                        {p.name}
                                      </span>
                                      <Badge
                                        variant="outline"
                                        className="h-4 px-1 text-[9px] uppercase leading-none"
                                      >
                                        {p.type}
                                      </Badge>
                                    </div>
                                    <span className="mt-1 line-clamp-1 text-[10px] text-muted-foreground">
                                      {p.content}
                                    </span>
                                  </Button>
                                );
                              })}
                            </div>
                            {scriptPrompts.length === 0 && (
                              <p className="text-xs italic text-muted-foreground">
                                Nenhum prompt de roteiro encontrado em
                                biblioteca.
                              </p>
                            )}
                          </div>
                          <Button
                            className="w-full"
                            onClick={() => generateMutation.mutate()}
                            disabled={
                              !aiPrompt.trim() || generateMutation.isPending
                            }
                            data-testid="button-submit-ai-script"
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
                                (aiResult.execution.parameters as any)
                                  ?.maxTokens || 0
                              )}{" "}
                              tokens máx.
                            </Badge>
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
                                className="rounded-md bg-muted p-4"
                                data-testid="text-ai-result"
                              >
                                <Markdown className="prose-sm font-serif dark:prose-invert">
                                  {aiResult.result}
                                </Markdown>
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
                              onClick={() => setAiResult(null)}
                              data-testid="button-ai-new-prompt"
                            >
                              Novo Prompt
                            </Button>
                            <Button
                              variant="ghost"
                              onClick={() => {
                                setAiOpen(false);
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

              <Dialog
                open={adjustOpen}
                onOpenChange={(o) => {
                  setAdjustOpen(o);
                  if (!o) {
                    setAdjustResult(null);
                    setAdjustPrompt("");
                  }
                }}
              >
                <DialogTrigger asChild>
                  <Button variant="outline" data-testid="button-adjust-ai-script">
                    <Wand2 className="mr-2 h-4 w-4" />
                    Ajustar com IA
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-h-[85vh] max-w-3xl">
                  <DialogHeader>
                    <DialogTitle>Ajustar Roteiro com IA</DialogTitle>
                    <DialogDescription>
                      O conteúdo atual do roteiro será enviado para a IA junto com suas instruções.
                    </DialogDescription>
                  </DialogHeader>
                  <ScrollArea className="max-h-[65vh]">
                    <div className="space-y-4 pr-4">
                      {!adjustResult ? (
                        <>
                          <Textarea
                            value={adjustPrompt}
                            onChange={(e) => setAdjustPrompt(e.target.value)}
                            placeholder="ex: Traduza para português, reescreva em um tom mais dramático, melhore os diálogos..."
                            rows={4}
                            data-testid="input-adjust-ai-script-prompt"
                          />
                          <Button
                            className="w-full"
                            onClick={() => adjustMutation.mutate()}
                            disabled={
                              !adjustPrompt.trim() || adjustMutation.isPending
                            }
                            data-testid="button-submit-adjust-ai-script"
                          >
                            <Send className="mr-2 h-4 w-4" />
                            {adjustMutation.isPending
                              ? "Processando..."
                              : "Enviar para IA"}
                          </Button>
                        </>
                      ) : (
                        <>
                          <div>
                            <Label className="text-xs text-muted-foreground">Sugestão da IA</Label>
                            <div className="mt-1 rounded-md bg-muted p-4">
                              <Markdown className="prose-sm font-serif dark:prose-invert">
                                {(() => {
                                  try {
                                    const parsed = JSON.parse(adjustResult.result);
                                    return parsed.content || adjustResult.result;
                                  } catch (e) {
                                    return adjustResult.result;
                                  }
                                })()}
                              </Markdown>
                            </div>
                          </div>

                          <div className="flex gap-2">
                            <Button
                              className="flex-1"
                              onClick={applyAdjustment}
                              data-testid="button-apply-adjust"
                            >
                              Aplicar Sugestão
                            </Button>
                            <Button
                              variant="outline"
                              onClick={() => setAdjustResult(null)}
                            >
                              Novo Prompt
                            </Button>
                            <Button
                              variant="ghost"
                              onClick={() => {
                                setAdjustOpen(false);
                                setAdjustResult(null);
                                setAdjustPrompt("");
                              }}
                            >
                              Descartar
                            </Button>
                          </div>
                        </>
                      )}
                    </div>
                  </ScrollArea>
                </DialogContent>
              </Dialog>
              <Button variant="outline" onClick={startEditing}>
                Editar
              </Button>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => {
                  if (window.confirm("Remover este roteiro?"))
                    deleteMutation.mutate();
                }}
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        {editing ? (
          <Select value={type} onValueChange={setType}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="synopsis">Sinopse</SelectItem>
              <SelectItem value="outline">Esboço</SelectItem>
              <SelectItem value="detailed">Detalhado</SelectItem>
            </SelectContent>
          </Select>
        ) : (
          <>
            <Badge variant="secondary">
              {typeLabels[script.type] || script.type}
            </Badge>
            <Badge variant="secondary">
              {script.origin === "ai" ? "Gerado por IA" : "Manual"}
            </Badge>
          </>
        )}
      </div>

      <div className="flex-1">
        <Card className="h-full">
          <CardContent className="h-full pt-4">
            {editing ? (
              <Textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="min-h-[400px] resize-none font-mono text-sm"
                placeholder="Escreva o conteúdo do roteiro..."
                data-testid="input-edit-script-content"
              />
            ) : (
              <div className="font-serif">
                <Markdown className="prose-sm dark:prose-invert">
                  {script.content ||
                    "Sem conteúdo ainda. Clique em Editar para começar a escrever."}
                </Markdown>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

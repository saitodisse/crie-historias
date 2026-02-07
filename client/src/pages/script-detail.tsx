import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation, useParams } from "wouter";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Save, Trash2, Sparkles, Copy, Send, MessageSquare } from "lucide-react";
import type { Script, AIExecution } from "@shared/schema";

interface ScriptDetail extends Script {
  storyTitle?: string;
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
  const [aiResult, setAiResult] = useState<AIResult | null>(null);

  const { data: script, isLoading } = useQuery<ScriptDetail>({
    queryKey: ["/api/scripts", scriptId],
    enabled: !!scriptId,
  });

  const updateMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("PATCH", `/api/scripts/${scriptId}`, { title, type, content });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/scripts", scriptId] });
      queryClient.invalidateQueries({ queryKey: ["/api/scripts"] });
      setEditing(false);
      toast({ title: "Roteiro atualizado" });
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

  const generateMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/ai/generate", {
        scriptId,
        storyId: script?.storyId,
        userPrompt: aiPrompt,
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
      toast({ title: "Geração falhou", description: err.message, variant: "destructive" });
    },
  });

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
      <div className="p-6 space-y-6">
        <Skeleton className="h-7 w-48" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!script) {
    return (
      <div className="flex items-center justify-center h-full">
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
    <div className="flex flex-col h-full overflow-auto">
      <div className="flex items-center justify-between gap-4 flex-wrap p-6 pb-4">
        <div className="flex items-center gap-3">
          <Button size="icon" variant="ghost" onClick={() => navigate("/scripts")} data-testid="button-back-scripts">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            {editing ? (
              <Input value={title} onChange={(e) => setTitle(e.target.value)} className="text-xl font-bold h-auto py-1" />
            ) : (
              <h1 className="text-2xl font-bold tracking-tight" data-testid="text-script-title">{script.title}</h1>
            )}
            {script.storyTitle && (
              <p className="text-sm text-muted-foreground mt-0.5">História: {script.storyTitle}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {editing ? (
            <>
              <Button variant="ghost" onClick={() => setEditing(false)}>Cancelar</Button>
              <Button onClick={() => updateMutation.mutate()} disabled={updateMutation.isPending}>
                <Save className="h-4 w-4 mr-2" />
                Salvar
              </Button>
            </>
          ) : (
            <>
              <Dialog open={aiOpen} onOpenChange={(o) => { setAiOpen(o); if (!o) { setAiResult(null); setAiPrompt(""); } }}>
                <DialogTrigger asChild>
                  <Button variant="outline" data-testid="button-ai-script">
                    <Sparkles className="h-4 w-4 mr-2" />
                    Gerar com IA
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-3xl max-h-[85vh]">
                  <DialogHeader>
                    <DialogTitle>Gerar Conteúdo do Roteiro</DialogTitle>
                    <DialogDescription>O roteiro e história associada serão enviados como contexto.</DialogDescription>
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
                          <Button
                            className="w-full"
                            onClick={() => generateMutation.mutate()}
                            disabled={!aiPrompt.trim() || generateMutation.isPending}
                            data-testid="button-submit-ai-script"
                          >
                            <Send className="h-4 w-4 mr-2" />
                            {generateMutation.isPending ? "Gerando..." : "Enviar para IA"}
                          </Button>
                        </>
                      ) : (
                        <>
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge variant="secondary">{aiResult.execution.model}</Badge>
                            <Badge variant="outline">
                              {JSON.stringify((aiResult.execution.parameters as any)?.maxTokens || 0)} tokens máx.
                            </Badge>
                          </div>

                          <div>
                            <div className="flex items-center justify-between gap-2 mb-1">
                              <Label className="text-xs text-muted-foreground flex items-center gap-1">
                                <Send className="h-3 w-3" /> Enviado (Prompt Final)
                              </Label>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => {
                                  navigator.clipboard.writeText(aiResult.execution.finalPrompt);
                                  toast({ title: "Prompt copiado" });
                                }}
                              >
                                <Copy className="h-3 w-3 mr-1" />
                                Copiar
                              </Button>
                            </div>
                            <pre className="mt-1 text-xs bg-muted rounded-md p-3 whitespace-pre-wrap font-mono max-h-32 overflow-auto" data-testid="text-ai-sent">
                              {aiResult.execution.finalPrompt}
                            </pre>
                          </div>

                          {aiResult.execution.systemPromptSnapshot && (
                            <div>
                              <Label className="text-xs text-muted-foreground">Prompt de Sistema</Label>
                              <pre className="mt-1 text-xs bg-muted rounded-md p-3 whitespace-pre-wrap font-mono max-h-24 overflow-auto">
                                {aiResult.execution.systemPromptSnapshot}
                              </pre>
                            </div>
                          )}

                          <Separator />

                          <div>
                            <div className="flex items-center justify-between gap-2 mb-1">
                              <Label className="text-xs text-muted-foreground flex items-center gap-1">
                                <MessageSquare className="h-3 w-3" /> Recebido (Resultado)
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
                                <Copy className="h-3 w-3 mr-1" />
                                Copiar
                              </Button>
                            </div>
                            {aiResult.result ? (
                              <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap font-serif bg-muted rounded-md p-4" data-testid="text-ai-result">
                                {aiResult.result}
                              </div>
                            ) : (
                              <div className="bg-destructive/10 text-destructive text-sm rounded-md p-4" data-testid="text-ai-empty">
                                A IA retornou um resultado vazio. Tente um modelo diferente ou reformule o prompt.
                              </div>
                            )}
                          </div>

                          <div className="flex gap-2">
                            <Button variant="outline" onClick={() => setAiResult(null)} data-testid="button-ai-new-prompt">
                              Novo Prompt
                            </Button>
                            <Button variant="ghost" onClick={() => { setAiOpen(false); setAiResult(null); setAiPrompt(""); }}>
                              Fechar
                            </Button>
                          </div>
                        </>
                      )}
                    </div>
                  </ScrollArea>
                </DialogContent>
              </Dialog>
              <Button variant="outline" onClick={startEditing}>Editar</Button>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => { if (window.confirm("Remover este roteiro?")) deleteMutation.mutate(); }}
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="px-6 pb-4 flex items-center gap-2">
        {editing ? (
          <Select value={type} onValueChange={setType}>
            <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="synopsis">Sinopse</SelectItem>
              <SelectItem value="outline">Esboço</SelectItem>
              <SelectItem value="detailed">Detalhado</SelectItem>
            </SelectContent>
          </Select>
        ) : (
          <>
            <Badge variant="secondary">{typeLabels[script.type] || script.type}</Badge>
            <Badge variant="secondary">{script.origin === "ai" ? "Gerado por IA" : "Manual"}</Badge>
          </>
        )}
      </div>

      <div className="flex-1 px-6 pb-6">
        <Card className="h-full">
          <CardContent className="pt-4 h-full">
            {editing ? (
              <Textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="font-mono text-sm min-h-[400px] resize-none"
                placeholder="Escreva o conteúdo do roteiro..."
                data-testid="input-edit-script-content"
              />
            ) : (
              <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap font-serif" data-testid="text-script-content">
                {script.content || "Sem conteúdo ainda. Clique em Editar para começar a escrever."}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

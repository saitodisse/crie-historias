import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Send, RotateCcw, Copy, Check } from "lucide-react";
import { Markdown } from "@/components/markdown";
import type { Prompt, AIExecution } from "@shared/schema";

interface AIResult {
  execution: AIExecution;
  result: string;
}

interface ScriptGeneratorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  scriptId: number;
  projectId?: number;
  availablePrompts: Prompt[];
  initialPromptIds?: number[];
  onPromptSelectionChange?: (ids: number[]) => void;
  onSuccess?: (result: AIResult) => void;
}

export function ScriptGeneratorDialog({
  open,
  onOpenChange,
  scriptId,
  projectId,
  availablePrompts,
  initialPromptIds = [],
  onPromptSelectionChange,
  onSuccess,
}: ScriptGeneratorDialogProps) {
  const { toast } = useToast();
  const [userPrompt, setUserPrompt] = useState("");
  const [selectedPromptIds, setSelectedPromptIds] =
    useState<number[]>(initialPromptIds);
  const [aiResult, setAiResult] = useState<AIResult | null>(null);

  // Reset state when dialog opens/closes
  useEffect(() => {
    if (open) {
      setSelectedPromptIds(initialPromptIds);
      if (!aiResult) setUserPrompt("");
    }
  }, [open, initialPromptIds]);

  const generateMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/ai/generate", {
        scriptId,
        projectId,
        userPrompt,
        promptIds: selectedPromptIds,
        type: "script",
      });
      return res.json() as Promise<AIResult>;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/scripts", scriptId] });
      queryClient.invalidateQueries({ queryKey: ["/api/executions"] });
      setAiResult(data);
      if (onSuccess) onSuccess(data);
      toast({ title: "Conteúdo gerado com sucesso!" });
    },
    onError: (err: Error) => {
      toast({
        title: "Falha na geração",
        description: err.message,
        variant: "destructive",
      });
    },
  });

  const handlePromptToggle = (promptId: number) => {
    const newSelection = selectedPromptIds.includes(promptId)
      ? selectedPromptIds.filter((id) => id !== promptId)
      : [...selectedPromptIds, promptId];

    setSelectedPromptIds(newSelection);
    if (onPromptSelectionChange) {
      onPromptSelectionChange(newSelection);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({ title: "Copiado para a área de transferência" });
    } catch (err) {
      toast({ title: "Erro ao copiar", variant: "destructive" });
    }
  };

  const resetState = () => {
    setAiResult(null);
    setUserPrompt("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex h-[85vh] max-w-3xl flex-col gap-0 p-0">
        <DialogHeader className="border-b p-6 pb-4">
          <DialogTitle>Gerar Conteúdo do Roteiro</DialogTitle>
          <DialogDescription>
            Utilize a IA para criar ou expandir seu roteiro. O contexto do
            projeto será incluído automaticamente.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 p-6">
          <div className="space-y-6">
            {!aiResult ? (
              // Input Mode
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="user-prompt">Instruções para a IA</Label>
                  <Textarea
                    id="user-prompt"
                    placeholder="Descreva o que você quer que a IA escreva (ex: 'Crie uma cena de diálogo intenso entre o protagonista e o antagonista...')"
                    value={userPrompt}
                    onChange={(e) => setUserPrompt(e.target.value)}
                    className="min-h-[120px] resize-none text-base"
                  />
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Prompts Auxiliares</Label>
                    <span className="text-xs text-muted-foreground">
                      {selectedPromptIds.length} selecionado(s)
                    </span>
                  </div>

                  {availablePrompts.length > 0 ? (
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                      {availablePrompts.map((prompt) => (
                        <div
                          key={prompt.id}
                          className={`flex cursor-pointer items-start space-x-3 rounded-md border p-3 transition-colors hover:bg-muted/50 ${
                            selectedPromptIds.includes(prompt.id)
                              ? "border-primary/40 bg-muted"
                              : "bg-card"
                          }`}
                          onClick={() => handlePromptToggle(prompt.id)}
                        >
                          <Checkbox
                            id={`prompt-${prompt.id}`}
                            checked={selectedPromptIds.includes(prompt.id)}
                            onCheckedChange={() =>
                              handlePromptToggle(prompt.id)
                            }
                          />
                          <div className="grid gap-1.5 leading-none">
                            <label
                              htmlFor={`prompt-${prompt.id}`}
                              className="cursor-pointer text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                            >
                              {prompt.name}
                            </label>
                            <p className="line-clamp-2 text-xs text-muted-foreground">
                              {prompt.content}
                            </p>
                            <Badge
                              variant="outline"
                              className="h-5 w-fit px-1.5 text-[10px]"
                            >
                              {prompt.type}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="rounded-md border bg-muted/20 p-4 text-center text-sm italic text-muted-foreground">
                      Nenhum prompt auxiliar disponível para roteiros.
                    </div>
                  )}
                </div>
              </div>
            ) : (
              // Result Mode
              <div className="space-y-6">
                <div className="mb-4 flex items-center gap-2">
                  <Badge variant="secondary" className="text-xs">
                    Modelo: {aiResult.execution.model}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    {(aiResult.execution.parameters as any)?.maxTokens || 0}{" "}
                    tokens
                  </Badge>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="flex items-center gap-2 text-muted-foreground">
                      <Send className="h-3 w-3" /> Prompt Enviado
                    </Label>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        copyToClipboard(aiResult.execution.finalPrompt)
                      }
                      className="h-6 text-xs"
                    >
                      <Copy className="mr-1 h-3 w-3" /> Copiar
                    </Button>
                  </div>
                  <div className="max-h-[100px] overflow-y-auto whitespace-pre-wrap rounded-md bg-muted p-3 font-mono text-xs">
                    {aiResult.execution.finalPrompt}
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="flex items-center gap-2 font-medium text-primary">
                      Resultado Gerado
                    </Label>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(aiResult.result)}
                      className="h-6 text-xs"
                    >
                      <Copy className="mr-1 h-3 w-3" /> Copiar
                    </Button>
                  </div>
                  <div className="min-h-[200px] rounded-md border bg-card p-4">
                    <Markdown className="prose-sm max-w-none dark:prose-invert">
                      {aiResult.result}
                    </Markdown>
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        <DialogFooter className="z-10 border-t bg-background/95 p-6 pt-4 backdrop-blur">
          {!aiResult ? (
            <div className="flex w-full justify-end gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button
                onClick={() => generateMutation.mutate()}
                disabled={generateMutation.isPending || !userPrompt.trim()}
                className="min-w-[120px]"
              >
                {generateMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Gerando...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Gerar Roteiro
                  </>
                )}
              </Button>
            </div>
          ) : (
            <div className="flex w-full items-center justify-between">
              <Button variant="outline" onClick={resetState}>
                <RotateCcw className="mr-2 h-4 w-4" />
                Novo Prompt
              </Button>
              <div className="flex gap-2">
                <Button variant="secondary" onClick={() => onOpenChange(false)}>
                  Fechar
                </Button>
                <Button
                  onClick={() => {
                    copyToClipboard(aiResult.result);
                    onOpenChange(false);
                  }}
                >
                  <Check className="mr-2 h-4 w-4" />
                  Copiar e Fechar
                </Button>
              </div>
            </div>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

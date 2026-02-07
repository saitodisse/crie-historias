import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { History, Search, Eye, RefreshCw, Copy, Clock, Cpu } from "lucide-react";
import type { AIExecution } from "@shared/schema";

interface ExecutionWithContext extends AIExecution {
  storyTitle?: string;
  characterName?: string;
  scriptTitle?: string;
  promptName?: string;
}

export default function ExecutionsPage() {
  const [search, setSearch] = useState("");
  const [selectedExec, setSelectedExec] = useState<ExecutionWithContext | null>(null);
  const { toast } = useToast();

  const { data: executions, isLoading } = useQuery<ExecutionWithContext[]>({
    queryKey: ["/api/executions"],
  });

  const rerunMutation = useMutation({
    mutationFn: async (exec: ExecutionWithContext) => {
      const res = await apiRequest("POST", "/api/ai/rerun", { executionId: exec.id });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/executions"] });
      toast({ title: "Re-execução concluída" });
    },
    onError: (err: Error) => {
      toast({ title: "Re-execução falhou", description: err.message, variant: "destructive" });
    },
  });

  const filtered = executions?.filter(
    (e) =>
      e.userPrompt.toLowerCase().includes(search.toLowerCase()) ||
      e.result?.toLowerCase().includes(search.toLowerCase()) ||
      e.storyTitle?.toLowerCase().includes(search.toLowerCase()) ||
      e.characterName?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between gap-4 flex-wrap p-6 pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" data-testid="text-executions-title">Histórico de IA</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Trilha de auditoria completa de todas as execuções de IA
          </p>
        </div>
      </div>

      <div className="px-6 pb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar execuções..."
            className="pl-9"
            data-testid="input-search-executions"
          />
        </div>
      </div>

      <div className="flex-1 overflow-auto px-6 pb-6">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardContent className="pt-4">
                  <Skeleton className="h-5 w-48 mb-2" />
                  <Skeleton className="h-4 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filtered && filtered.length > 0 ? (
          <div className="space-y-3">
            {filtered.map((exec) => (
              <Card key={exec.id} data-testid={`card-execution-${exec.id}`}>
                <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0 pb-2">
                  <div className="flex items-center gap-2 min-w-0 flex-wrap">
                    <History className="h-4 w-4 text-primary shrink-0" />
                    <span className="text-xs text-muted-foreground font-mono">#{exec.id}</span>
                    <div className="flex items-center gap-1">
                      <Cpu className="h-3 w-3 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">{exec.model}</span>
                    </div>
                    {exec.storyTitle && <Badge variant="secondary">{exec.storyTitle}</Badge>}
                    {exec.characterName && <Badge variant="secondary">{exec.characterName}</Badge>}
                    {exec.scriptTitle && <Badge variant="secondary">{exec.scriptTitle}</Badge>}
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => setSelectedExec(exec)}
                      data-testid={`button-view-exec-${exec.id}`}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => rerunMutation.mutate(exec)}
                      disabled={rerunMutation.isPending}
                      data-testid={`button-rerun-exec-${exec.id}`}
                    >
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm line-clamp-1 mb-1">{exec.userPrompt}</p>
                  {exec.result && (
                    <p className="text-xs text-muted-foreground line-clamp-2">{exec.result}</p>
                  )}
                  <div className="flex items-center gap-1 mt-2">
                    <Clock className="h-3 w-3 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">
                      {new Date(exec.createdAt).toLocaleString('pt-BR')}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted mb-4">
              <History className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold">Nenhuma execução encontrada</h3>
            <p className="text-sm text-muted-foreground mt-1 max-w-sm">
              As execuções de IA aparecerão aqui após você gerar conteúdo.
            </p>
          </div>
        )}
      </div>

      <Dialog open={!!selectedExec} onOpenChange={() => setSelectedExec(null)}>
        <DialogContent className="max-w-3xl max-h-[85vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              Execução #{selectedExec?.id}
            </DialogTitle>
          </DialogHeader>
          {selectedExec && (
            <ScrollArea className="max-h-[65vh]">
              <div className="space-y-4 pr-4">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="secondary">{selectedExec.model}</Badge>
                  {selectedExec.storyTitle && <Badge variant="outline">{selectedExec.storyTitle}</Badge>}
                  {selectedExec.characterName && <Badge variant="outline">{selectedExec.characterName}</Badge>}
                  {selectedExec.promptName && <Badge variant="outline">{selectedExec.promptName}</Badge>}
                  <span className="text-xs text-muted-foreground ml-auto">
                    {new Date(selectedExec.createdAt).toLocaleString('pt-BR')}
                  </span>
                </div>

                {selectedExec.systemPromptSnapshot && (
                  <div>
                    <Label className="text-xs text-muted-foreground">Snapshot do Prompt de Sistema</Label>
                    <pre className="mt-1 text-xs bg-muted rounded-md p-3 whitespace-pre-wrap font-mono max-h-32 overflow-auto">
                      {selectedExec.systemPromptSnapshot}
                    </pre>
                  </div>
                )}

                <div>
                  <Label className="text-xs text-muted-foreground">Prompt do Usuário</Label>
                  <pre className="mt-1 text-xs bg-muted rounded-md p-3 whitespace-pre-wrap font-mono">
                    {selectedExec.userPrompt}
                  </pre>
                </div>

                <div>
                  <Label className="text-xs text-muted-foreground">Prompt Final Montado</Label>
                  <pre className="mt-1 text-xs bg-muted rounded-md p-3 whitespace-pre-wrap font-mono max-h-40 overflow-auto">
                    {selectedExec.finalPrompt}
                  </pre>
                </div>

                {selectedExec.parameters && (
                  <div>
                    <Label className="text-xs text-muted-foreground">Parâmetros</Label>
                    <pre className="mt-1 text-xs bg-muted rounded-md p-3 whitespace-pre-wrap font-mono">
                      {JSON.stringify(selectedExec.parameters as any, null, 2)}
                    </pre>
                  </div>
                )}

                <Separator />

                <div>
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <Label className="text-xs text-muted-foreground">Resultado</Label>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        if (selectedExec.result) {
                          navigator.clipboard.writeText(selectedExec.result);
                          toast({ title: "Resultado copiado" });
                        }
                      }}
                    >
                      <Copy className="h-3 w-3 mr-1" />
                      Copiar
                    </Button>
                  </div>
                  <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap font-serif bg-muted rounded-md p-4">
                    {selectedExec.result || "Sem resultado"}
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      rerunMutation.mutate(selectedExec);
                      setSelectedExec(null);
                    }}
                    disabled={rerunMutation.isPending}
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Re-executar
                  </Button>
                </div>
              </div>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

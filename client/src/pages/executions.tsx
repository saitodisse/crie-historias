import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import {
  History,
  Search,
  Eye,
  RefreshCw,
  Copy,
  Clock,
  Cpu,
} from "lucide-react";
import { Markdown } from "@/components/markdown";
import type { AIExecution } from "@shared/schema";

interface ExecutionWithContext extends AIExecution {
  projectTitle?: string;
  characterName?: string;
  scriptTitle?: string;
  promptName?: string;
}

export default function ExecutionsPage() {
  const [search, setSearch] = useState("");
  const [selectedExec, setSelectedExec] = useState<ExecutionWithContext | null>(
    null
  );
  const { toast } = useToast();

  const { data: executions, isLoading } = useQuery<ExecutionWithContext[]>({
    queryKey: ["/api/executions"],
  });

  const rerunMutation = useMutation({
    mutationFn: async (exec: ExecutionWithContext) => {
      const res = await apiRequest("POST", "/api/ai/rerun", {
        executionId: exec.id,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/executions"] });
      toast({ title: "Re-execução concluída" });
    },
    onError: (err: Error) => {
      toast({
        title: "Re-execução falhou",
        description: err.message,
        variant: "destructive",
      });
    },
  });

  const filtered = executions?.filter(
    (e) =>
      e.userPrompt.toLowerCase().includes(search.toLowerCase()) ||
      e.result?.toLowerCase().includes(search.toLowerCase()) ||
      e.projectTitle?.toLowerCase().includes(search.toLowerCase()) ||
      e.characterName?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1
            className="text-2xl font-bold tracking-tight"
            data-testid="text-executions-title"
          >
            Histórico de IA
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Trilha de auditoria completa de todas as execuções de IA
          </p>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar execuções..."
          className="pl-9"
          data-testid="input-search-executions"
        />
      </div>

      <div className="space-y-3">
        {isLoading ? (
          [1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="pt-4">
                <Skeleton className="mb-2 h-5 w-48" />
                <Skeleton className="h-4 w-full" />
              </CardContent>
            </Card>
          ))
        ) : filtered && filtered.length > 0 ? (
          filtered?.map((exec) => (
            <Card key={exec.id} data-testid={`card-execution-${exec.id}`}>
              <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0 pb-2">
                <div className="flex min-w-0 flex-wrap items-center gap-2">
                  <History className="h-4 w-4 shrink-0 text-primary" />
                  <span className="font-mono text-xs text-muted-foreground">
                    #{exec.id}
                  </span>
                  <div className="flex items-center gap-1">
                    <Cpu className="h-3 w-3 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">
                      {exec.model}
                    </span>
                  </div>
                  {exec.projectTitle && (
                    <Badge variant="secondary">{exec.projectTitle}</Badge>
                  )}
                  {exec.characterName && (
                    <Badge variant="secondary">{exec.characterName}</Badge>
                  )}
                  {exec.scriptTitle && (
                    <Badge variant="secondary">{exec.scriptTitle}</Badge>
                  )}
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
                <p className="mb-1 line-clamp-1 text-sm">{exec.userPrompt}</p>
                {exec.result && (
                  <p className="line-clamp-2 text-xs text-muted-foreground">
                    {exec.result}
                  </p>
                )}
                <div className="mt-2 flex items-center gap-1">
                  <Clock className="h-3 w-3 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">
                    {new Date(exec.createdAt).toLocaleString("pt-BR")}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
              <History className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold">
              Nenhuma execução encontrada
            </h3>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">
              As execuções de IA aparecerão aqui após você gerar conteúdo.
            </p>
          </div>
        )}
      </div>

      <Dialog open={!!selectedExec} onOpenChange={() => setSelectedExec(null)}>
        <DialogContent className="max-h-[85vh] max-w-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              Execução #{selectedExec?.id}
            </DialogTitle>
          </DialogHeader>
          {selectedExec && (
            <ScrollArea className="max-h-[65vh]">
              <div className="space-y-4 pr-4">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="secondary">{selectedExec!.model}</Badge>
                  {selectedExec!.projectTitle && (
                    <Badge variant="outline">{selectedExec!.projectTitle}</Badge>
                  )}
                  {selectedExec!.characterName && (
                    <Badge variant="outline">
                      {selectedExec!.characterName}
                    </Badge>
                  )}
                  {selectedExec!.promptName && (
                    <Badge variant="outline">{selectedExec!.promptName}</Badge>
                  )}
                  <span className="ml-auto text-xs text-muted-foreground">
                    {new Date(selectedExec!.createdAt).toLocaleString("pt-BR")}
                  </span>
                </div>

                {selectedExec!.systemPromptSnapshot && (
                  <div>
                    <Label className="text-xs text-muted-foreground">
                      Snapshot do Prompt de Sistema
                    </Label>
                    <pre className="mt-1 max-h-32 overflow-auto whitespace-pre-wrap rounded-md bg-muted p-3 font-mono text-xs">
                      {selectedExec!.systemPromptSnapshot}
                    </pre>
                  </div>
                )}

                <div>
                  <Label className="text-xs text-muted-foreground">
                    Prompt do Usuário
                  </Label>
                  <pre className="mt-1 whitespace-pre-wrap rounded-md bg-muted p-3 font-mono text-xs">
                    {selectedExec!.userPrompt}
                  </pre>
                </div>

                <div>
                  <Label className="text-xs text-muted-foreground">
                    Prompt Final Montado
                  </Label>
                  <pre className="mt-1 max-h-40 overflow-auto whitespace-pre-wrap rounded-md bg-muted p-3 font-mono text-xs">
                    {selectedExec!.finalPrompt}
                  </pre>
                </div>

                {Boolean(selectedExec!.parameters) && (
                  <div>
                    <Label className="text-xs text-muted-foreground">
                      Parâmetros
                    </Label>
                    <pre className="mt-1 whitespace-pre-wrap rounded-md bg-muted p-3 font-mono text-xs">
                      {JSON.stringify(selectedExec!.parameters as any, null, 2)}
                    </pre>
                  </div>
                )}

                <Separator />

                <div>
                  <div className="mb-1 flex items-center justify-between gap-2">
                    <Label className="text-xs text-muted-foreground">
                      Resultado
                    </Label>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        if (selectedExec!.result) {
                          navigator.clipboard.writeText(selectedExec!.result);
                          toast({ title: "Resultado copiado" });
                        }
                      }}
                    >
                      <Copy className="mr-1 h-3 w-3" />
                      Copiar
                    </Button>
                  </div>
                  <div className="rounded-md bg-muted p-4">
                    <Markdown className="prose-sm font-serif dark:prose-invert">
                      {selectedExec!.result || "Sem resultado"}
                    </Markdown>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      rerunMutation.mutate(selectedExec!);
                      setSelectedExec(null);
                    }}
                    disabled={rerunMutation.isPending}
                  >
                    <RefreshCw className="mr-2 h-4 w-4" />
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

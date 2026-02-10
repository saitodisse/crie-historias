import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation, useParams } from "wouter";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Save, Trash2, Sparkles } from "lucide-react";
import type { Prompt } from "@shared/schema";
import { useState, useEffect } from "react";

export default function PromptDetailPage() {
  const params = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const isNew = params.id === "new";
  const promptId = isNew ? null : parseInt(params.id!);

  const [form, setForm] = useState({
    name: "",
    category: "Project",
    type: "task",
    content: "",
    active: true,
  });

  const { data: prompt, isLoading } = useQuery<Prompt>({
    queryKey: ["/api/prompts", promptId],
    enabled: !!promptId,
  });

  useEffect(() => {
    if (prompt) {
      setForm({
        name: prompt.name || "",
        category: (prompt.category as any) || "Project",
        type: (prompt.type as any) || "task",
        content: prompt.content || "",
        active: prompt.active ?? true,
      });
    }
  }, [prompt]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (isNew) {
        await apiRequest("POST", "/api/prompts", form);
      } else {
        await apiRequest("PATCH", `/api/prompts/${promptId}`, form);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/prompts"] });
      if (promptId) {
        queryClient.invalidateQueries({ queryKey: ["/api/prompts", promptId] });
      }
      toast({ title: isNew ? "Prompt criado" : "Prompt atualizado" });
      navigate("/prompts");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("DELETE", `/api/prompts/${promptId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/prompts"] });
      toast({ title: "Prompt removido" });
      navigate("/prompts");
    },
  });

  if (!isNew && isLoading) {
    return (
      <div className="space-y-6 p-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-9 w-9" />
          <Skeleton className="h-7 w-48" />
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button
            size="icon"
            variant="ghost"
            onClick={() => navigate("/prompts")}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold tracking-tight">
            {isNew ? "Novo Prompt" : prompt?.name}
          </h1>
        </div>
        <div className="flex gap-2">
          {!isNew && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                if (window.confirm(`Remover "${prompt?.name}"?`)) {
                  deleteMutation.mutate();
                }
              }}
            >
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          )}
          <Button
            onClick={() => saveMutation.mutate()}
            disabled={
              saveMutation.isPending ||
              !form.name.trim() ||
              !form.content.trim()
            }
          >
            <Save className="mr-2 h-4 w-4" />
            {isNew ? "Criar" : "Salvar"}
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Conteúdo do Prompt</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Nome do Modelo</Label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="ex: Expandir Sinopse"
                />
              </div>
              <div className="space-y-2">
                <Label>Corpo do Prompt</Label>
                <Textarea
                  value={form.content}
                  onChange={(e) =>
                    setForm({ ...form, content: e.target.value })
                  }
                  placeholder="Escreva as instruções para a IA. Use {{Project.title}}, {{character.name}} etc. como placeholders."
                  rows={15}
                  className="font-mono text-sm leading-relaxed"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Configurações</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Categoria</Label>
                <Select
                  value={form.category}
                  onValueChange={(v) => setForm({ ...form, category: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="character">Personagem</SelectItem>
                    <SelectItem value="Project">Projeto</SelectItem>
                    <SelectItem value="script">Roteiro</SelectItem>
                    <SelectItem value="refinement">Refinamento</SelectItem>
                    <SelectItem value="GLOBAL">GLOBAL (Alica em tudo)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Tipo</Label>
                <Select
                  value={form.type}
                  onValueChange={(v) => setForm({ ...form, type: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="system">Sistema</SelectItem>
                    <SelectItem value="task">Tarefa</SelectItem>
                    <SelectItem value="auxiliary">Auxiliar</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between pt-2">
                <div className="space-y-0.5">
                  <Label>Status Ativo</Label>
                  <p className="text-xs text-muted-foreground">
                    O prompt estará disponível para uso.
                  </p>
                </div>
                <Switch
                  checked={form.active}
                  onCheckedChange={(checked) =>
                    setForm({ ...form, active: checked })
                  }
                />
              </div>
            </CardContent>
          </Card>

          <Card className="border-dashed bg-muted/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Variáveis Disponíveis</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-1 font-mono text-xs text-muted-foreground">
                <li>{"{{Project.title}}"}</li>
                <li>{"{{Project.premise}}"}</li>
                <li>{"{{character.name}}"}</li>
                <li>{"{{character.description}}"}</li>
                <li>{"{{userPrompt}}"}</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

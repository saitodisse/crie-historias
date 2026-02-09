import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation, useParams } from "wouter";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Save, Trash2, Sparkles } from "lucide-react";
import type { Character, AIExecution } from "@shared/schema";
import { useState, useEffect } from "react";

interface AIResult {
  execution: AIExecution;
  result: string;
}

export default function CharacterDetailPage() {
  const params = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const isNew = params.id === "new";
  const characterId = isNew ? null : parseInt(params.id!);

  const [form, setForm] = useState({
    name: "",
    description: "",
    personality: "",
    background: "",
    notes: "",
  });
  const [genPrompt, setGenPrompt] = useState("");

  const { data: character, isLoading } = useQuery<Character>({
    queryKey: ["/api/characters", characterId],
    enabled: !!characterId,
  });

  useEffect(() => {
    if (character) {
      setForm({
        name: character.name,
        description: character.description || "",
        personality: character.personality || "",
        background: character.background || "",
        notes: character.notes || "",
      });
    }
  }, [character]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (isNew) {
        await apiRequest("POST", "/api/characters", form);
      } else {
        await apiRequest("PATCH", `/api/characters/${characterId}`, form);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/characters"] });
      if (characterId) {
        queryClient.invalidateQueries({
          queryKey: ["/api/characters", characterId],
        });
      }
      toast({ title: isNew ? "Personagem criado" : "Personagem atualizado" });
      navigate("/characters");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("DELETE", `/api/characters/${characterId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/characters"] });
      toast({ title: "Personagem removido" });
      navigate("/characters");
    },
  });

  const genMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/ai/generate", {
        userPrompt: genPrompt,
        type: "character-generation",
      });
      return res.json() as Promise<AIResult>;
    },
    onSuccess: (data) => {
      try {
        let jsonStr = data.result.trim();
        if (jsonStr.startsWith("```json")) {
          jsonStr = jsonStr.replace(/^```json/, "").replace(/```$/, "");
        } else {
          const firstBrace = jsonStr.indexOf("{");
          const lastBrace = jsonStr.lastIndexOf("}");
          if (firstBrace !== -1 && lastBrace !== -1) {
            jsonStr = jsonStr.substring(firstBrace, lastBrace + 1);
          }
        }
        const parsed = JSON.parse(jsonStr);
        setForm({
          ...form,
          name: parsed.name || form.name,
          description: parsed.description || form.description,
          personality: parsed.personality || form.personality,
          background: parsed.background || form.background,
          notes: parsed.notes || form.notes,
        });
        toast({ title: "Campos preenchidos com IA!" });
      } catch (e) {
        toast({
          title: "Erro ao processar resposta da IA",
          description: "O formato retornado não é válido.",
          variant: "destructive",
        });
      }
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
    <div className="flex h-full flex-col overflow-auto">
      <div className="flex items-center justify-between p-6 pb-4">
        <div className="flex items-center gap-3">
          <Button
            size="icon"
            variant="ghost"
            onClick={() => navigate("/characters")}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold tracking-tight">
            {isNew ? "Novo Personagem" : character?.name}
          </h1>
        </div>
        <div className="flex gap-2">
          {!isNew && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                if (window.confirm(`Remover "${character?.name}"?`)) {
                  deleteMutation.mutate();
                }
              }}
            >
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          )}
          <Button
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending || !form.name.trim()}
          >
            <Save className="mr-2 h-4 w-4" />
            {isNew ? "Criar" : "Salvar"}
          </Button>
        </div>
      </div>

      <div className="grid gap-6 p-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Informações Básicas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Nome</Label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Nome do personagem..."
                />
              </div>
              <div className="space-y-2">
                <Label>Descrição Física</Label>
                <Textarea
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                  placeholder="Aparência, trajes, idade..."
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label>Personalidade</Label>
                <Textarea
                  value={form.personality}
                  onChange={(e) =>
                    setForm({ ...form, personality: e.target.value })
                  }
                  placeholder="Comportamento, virtudes, defeitos..."
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label>Histórico (Background)</Label>
                <Textarea
                  value={form.background}
                  onChange={(e) =>
                    setForm({ ...form, background: e.target.value })
                  }
                  placeholder="Origem, traumas, objetivos..."
                  rows={4}
                />
              </div>
              <div className="space-y-2">
                <Label>Notas</Label>
                <Textarea
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  placeholder="Notas internas, curiosidades..."
                  rows={2}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="border-primary/20 bg-primary/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-primary">
                <Sparkles className="h-4 w-4" />
                Magia da IA
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Descreva brevemente quem é o personagem e a IA preencherá os
                campos para você.
              </p>
              <Textarea
                value={genPrompt}
                onChange={(e) => setGenPrompt(e.target.value)}
                placeholder="Ex: Um pirata cibernético com braço mecânico que busca redenção..."
                className="bg-background"
                rows={4}
              />
              <Button
                variant="secondary"
                className="w-full"
                onClick={() => genMutation.mutate()}
                disabled={genMutation.isPending || !genPrompt.trim()}
              >
                {genMutation.isPending ? "Gerando..." : "Assistente Criativo"}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

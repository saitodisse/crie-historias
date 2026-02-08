import { useState } from "react";
import { useLocation, useSearch } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import WizardLayout from "./layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Sparkles,
  ChevronLeft,
  FileText,
  RefreshCw,
  Rocket,
  Wand2,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import type { Story, Prompt, AIExecution, Script } from "@shared/schema";

interface AIResult {
  execution: AIExecution;
  result: string;
}

export default function WizardScript() {
  const [, navigate] = useLocation();
  const search = useSearch();
  const params = new URLSearchParams(search);
  const storyId = parseInt(params.get("storyId") || "0");
  const { toast } = useToast();

  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");
  const [selectedStyleIds, setSelectedStyleIds] = useState<number[]>([]);

  const { data: story } = useQuery<Story>({
    queryKey: [`/api/stories/${storyId}`],
    enabled: !!storyId,
  });

  const { data: prompts, isLoading: isLoadingPrompts } = useQuery<Prompt[]>({
    queryKey: ["/api/prompts"],
  });

  const templates =
    prompts?.filter((p) => p.category === "script-template") || [];
  const styles = prompts?.filter((p) => p.category === "script-style") || [];

  const generateMutation = useMutation({
    mutationFn: async () => {
      const template = templates.find(
        (t) => t.id.toString() === selectedTemplateId
      );
      const selectedStyles = styles.filter((s) =>
        selectedStyleIds.includes(s.id)
      );

      const combinedPrompt = `
        FORMATO/ESTRUTURA: ${template?.content || "Siga uma estrutura narrativa padrão."}
        ESTILO/TEMA: ${selectedStyles.map((s) => s.content).join(" ")}

        POR FAVOR, GERE O ROTEIRO COMPLETO PARA A HISTÓRIA E PERSONAGEM(S) PROVIDOS NO CONTEXTO.
      `;

      const res = await apiRequest("POST", "/api/ai/generate", {
        storyId,
        userPrompt: combinedPrompt,
        type: "wizard-script",
      });
      return res.json() as Promise<AIResult>;
    },
    onSuccess: async (data) => {
      // Create the script record
      const scriptRes = await apiRequest("POST", "/api/scripts", {
        storyId,
        title: `Roteiro Final - ${story?.title}`,
        type: "detailed",
        content: data.result,
        origin: "ai",
      });
      const newScript = (await scriptRes.json()) as Script;

      toast({ title: "Roteiro gerado com sucesso!" });
      navigate(`/scripts/${newScript.id}`);
    },
    onError: (err: Error) => {
      toast({
        title: "Falha na geração",
        description: err.message,
        variant: "destructive",
      });
    },
  });

  const toggleStyle = (id: number) => {
    setSelectedStyleIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  if (isLoadingPrompts) {
    return (
      <WizardLayout step={3}>
        <div className="flex justify-center py-20">
          <RefreshCw className="h-10 w-10 animate-spin text-primary" />
        </div>
      </WizardLayout>
    );
  }

  return (
    <WizardLayout step={3}>
      <div className="space-y-8">
        <div className="space-y-1">
          <h2 className="text-2xl font-semibold">Decisões Finais</h2>
          <p className="text-muted-foreground">
            Escolha o formato do roteiro e aplique estilos adicionais.
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-2">
          {/* Formato */}
          <Card className="border-primary/20 bg-primary/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-primary">
                <FileText className="h-5 w-5" />
                Formato do Roteiro
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Label>Selecione a Estrutura</Label>
              <Select
                value={selectedTemplateId}
                onValueChange={setSelectedTemplateId}
              >
                <SelectTrigger className="bg-background">
                  <SelectValue placeholder="Escolha um formato..." />
                </SelectTrigger>
                <SelectContent>
                  {templates.map((t) => (
                    <SelectItem key={t.id} value={t.id.toString()}>
                      {t.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedTemplateId && (
                <p className="rounded-md border bg-background p-3 text-xs italic text-muted-foreground">
                  {
                    templates.find(
                      (t) => t.id.toString() === selectedTemplateId
                    )?.content
                  }
                </p>
              )}
            </CardContent>
          </Card>

          {/* Estilos */}
          <Card className="border-purple-400/20 bg-purple-400/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-purple-600">
                <Wand2 className="h-5 w-5" />
                Estilos e "Lentes"
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Label>Aplique um ou mais estilos</Label>
              <div className="space-y-3">
                {styles.map((s) => (
                  <div
                    key={s.id}
                    className="flex cursor-pointer items-center space-x-3 rounded-md border bg-background p-3 transition-colors hover:border-purple-400/50"
                    onClick={() => toggleStyle(s.id)}
                  >
                    <Checkbox
                      id={`style-${s.id}`}
                      checked={selectedStyleIds.includes(s.id)}
                      onCheckedChange={() => toggleStyle(s.id)}
                    />
                    <label
                      htmlFor={`style-${s.id}`}
                      className="cursor-pointer text-sm font-medium leading-none"
                    >
                      {s.name}
                    </label>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-between border-t pt-6 font-sans">
          <Button
            variant="ghost"
            onClick={() => navigate(`/wizard/characters?storyId=${storyId}`)}
            disabled={generateMutation.isPending}
          >
            <ChevronLeft className="mr-2 h-4 w-4" />
            Voltar
          </Button>
          <Button
            size="lg"
            className="bg-gradient-to-r from-primary to-purple-600 px-12 shadow-lg transition-all hover:opacity-90 active:scale-95"
            disabled={!selectedTemplateId || generateMutation.isPending}
            onClick={() => generateMutation.mutate()}
          >
            {generateMutation.isPending ? (
              <>
                <RefreshCw className="mr-2 h-5 w-5 animate-spin" />
                Escrevendo seu Épico...
              </>
            ) : (
              <>
                <Rocket className="mr-2 h-5 w-5" />
                Gerar Roteiro Final
              </>
            )}
          </Button>
        </div>
      </div>
    </WizardLayout>
  );
}

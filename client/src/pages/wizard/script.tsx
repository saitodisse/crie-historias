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
import type { Project, Prompt, AIExecution, Script } from "@shared/schema";

interface AIResult {
  execution: AIExecution;
  result: string;
}

export default function WizardScript() {
  const [, navigate] = useLocation();
  const search = useSearch();
  const params = new URLSearchParams(search);
  const projectId = parseInt(params.get("projectId") || "0");
  const { toast } = useToast();

  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");
  const [selectedStyleIds, setSelectedStyleIds] = useState<number[]>([]);
  const [selectedPromptIds, setSelectedPromptIds] = useState<number[]>([]);

  const { data: Project } = useQuery<Project>({
    queryKey: [`/api/projects/${projectId}`],
    enabled: !!projectId,
  });

  const { data: prompts, isLoading: isLoadingPrompts } = useQuery<Prompt[]>({
    queryKey: ["/api/prompts"],
  });

  const templates =
    prompts?.filter((p) => p.category === "script-template") || [];
  const styles = prompts?.filter((p) => p.category === "script-style") || [];
  const libraryPrompts = prompts?.filter((p) => p.category === "script") || [];

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

        POR FAVOR, GERE O ROTEIRO COMPLETO PARA A Projeto E PERSONAGEM(S) PROVIDOS NO CONTEXTO.
      `;

      const payload = {
        projectId,
        userPrompt: combinedPrompt,
        promptIds: selectedPromptIds,
        type: "wizard-script",
      };
      console.log(
        "[Wizard Event] Final Script Generation Started",
        JSON.stringify(payload, null, 2)
      );

      const res = await apiRequest("POST", "/api/ai/generate", payload);
      return res.json() as Promise<AIResult>;
    },
    onSuccess: async (data) => {
      let scriptContent = data.result;
      let scriptTitle = `Roteiro Final - ${Project?.title}`;

      try {
        // Clean markdown code blocks if present (though backend should have handled it, extra safety)
        let jsonStr = data.result.trim();
        if (jsonStr.startsWith("```json")) {
          jsonStr = jsonStr.replace(/^```json/, "").replace(/```$/, "");
        } else if (jsonStr.startsWith("```")) {
          jsonStr = jsonStr.replace(/^```/, "").replace(/```$/, "");
        }

        const parsed = JSON.parse(jsonStr);
        if (parsed.content) scriptContent = parsed.content;
        if (parsed.title) scriptTitle = parsed.title;
      } catch (e) {
        console.warn("Could not parse AI response as JSON, using raw text:", e);
      }

      // Create the script record
      const scriptRes = await apiRequest("POST", "/api/scripts", {
        projectId,
        title: scriptTitle,
        type: "detailed",
        content: scriptContent,
        origin: "ai",
        promptIds: selectedPromptIds,
      });
      const newScript = (await scriptRes.json()) as Script;
      console.log(
        "[Wizard Event] Script Saved Successfully",
        JSON.stringify(newScript, null, 2)
      );

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
      <div className="space-y-6 md:space-y-8">
        <div className="space-y-1">
          <h2 className="text-xl font-semibold md:text-2xl">Decisões Finais</h2>
          <p className="text-sm text-muted-foreground md:text-base">
            Escolha o formato do roteiro e aplique estilos adicionais.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 md:gap-8">
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

        {/* Biblioteca de Prompts */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <Label className="text-base font-semibold">
              Prompts da Biblioteca (Roteiro)
            </Label>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {libraryPrompts.map((p) => {
              const isSelected = selectedPromptIds.includes(p.id);
              return (
                <div
                  key={p.id}
                  className={cn(
                    "flex cursor-pointer flex-col gap-2 rounded-lg border bg-background p-4 transition-all hover:bg-accent",
                    isSelected &&
                      "border-primary bg-primary/5 ring-1 ring-primary"
                  )}
                  onClick={() => {
                    setSelectedPromptIds((prev) =>
                      prev.includes(p.id)
                        ? prev.filter((id) => id !== p.id)
                        : [...prev, p.id]
                    );
                  }}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{p.name}</span>
                    <Badge
                      variant="outline"
                      className="h-4 text-[10px] uppercase"
                    >
                      {p.type}
                    </Badge>
                  </div>
                  <p className="line-clamp-2 text-xs italic text-muted-foreground">
                    {p.content}
                  </p>
                </div>
              );
            })}
          </div>
          {libraryPrompts.length === 0 && (
            <p className="text-sm italic text-muted-foreground">
              Nenhum prompt da biblioteca disponível nesta categoria.
            </p>
          )}
        </div>

        <div className="flex flex-col-reverse justify-between gap-4 border-t pt-6 font-sans md:flex-row">
          <Button
            variant="ghost"
            onClick={() =>
              navigate(`/wizard/characters?projectId=${projectId}`)
            }
            disabled={generateMutation.isPending}
            className="w-full md:w-auto"
          >
            <ChevronLeft className="mr-2 h-4 w-4" />
            Voltar
          </Button>
          <Button
            size="lg"
            className="w-full bg-gradient-to-r from-primary to-purple-600 shadow-lg transition-all hover:opacity-90 active:scale-95 md:w-auto md:px-12"
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

import { useState } from "react";
import { useLocation, useSearch } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import WizardLayout from "./layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Check,
  Plus,
  UserPlus,
  ChevronRight,
  ChevronLeft,
  RefreshCw,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import type { Character, Project } from "@shared/schema";

export default function WizardCast() {
  const [, navigate] = useLocation();
  const search = useSearch();
  const params = new URLSearchParams(search);
  const projectId = parseInt(params.get("projectId") || "0");
  const { toast } = useToast();

  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  const { data: Project } = useQuery<Project>({
    queryKey: [`/api/projects/${projectId}`],
    enabled: !!projectId,
  });

  const {
    data: characters,
    isLoading,
    refetch,
  } = useQuery<Character[]>({
    queryKey: ["/api/characters"],
  });

  const linkMutation = useMutation({
    mutationFn: async () => {
      // Link each selected character to the Project
      // Ideally this would be a batch operation, but using existing endpoints:
      await Promise.all(
        selectedIds.map((id) =>
          apiRequest("POST", `/api/projects/${projectId}/characters`, {
            characterId: id,
          })
        )
      );
    },
    onSuccess: () => {
      console.log(
        "[Wizard Event] Characters Linked Successfully",
        JSON.stringify({ selectedIds, projectId }, null, 2)
      );
      queryClient.invalidateQueries({
        queryKey: [`/api/projects/${projectId}`],
      });
      const charIdsQuery = selectedIds.join(",");
      navigate(`/wizard/script?projectId=${projectId}&charIds=${charIdsQuery}`);
    },
    onError: (err: Error) => {
      toast({
        title: "Erro ao vincular personagens",
        description: err.message,
        variant: "destructive",
      });
    },
  });

  const toggleCharacter = (id: number) => {
    setSelectedIds((prev) => {
      const next = prev.includes(id)
        ? prev.filter((i) => i !== id)
        : [...prev, id];
      console.log(
        "[Wizard State] Character Selection Updated",
        JSON.stringify(next)
      );
      return next;
    });
  };

  if (isLoading) {
    return (
      <WizardLayout step={2}>
        <div className="flex justify-center py-20">
          <RefreshCw className="h-10 w-10 animate-spin text-primary" />
        </div>
      </WizardLayout>
    );
  }

  return (
    <WizardLayout step={2}>
      <div className="space-y-6 md:space-y-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1">
            <h2 className="text-xl font-semibold md:text-2xl">
              Quem participará da Projeto?
            </h2>
            <p className="text-sm text-muted-foreground md:text-base">
              Selecione os personagens que estarão presentes no roteiro.
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() => window.open("/characters", "_blank")}
            className="group w-full md:w-auto"
          >
            <UserPlus className="mr-2 h-4 w-4 transition-transform group-hover:scale-110" />
            Criar Novo
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {characters?.map((char) => {
            const isSelected = selectedIds.includes(char.id);
            return (
              <motion.div
                key={char.id}
                whileHover={{ y: -4 }}
                whileTap={{ scale: 0.98 }}
              >
                <Card
                  className={cn(
                    "relative h-full cursor-pointer overflow-hidden transition-all duration-300",
                    isSelected
                      ? "border-primary bg-primary/5 ring-2 ring-primary"
                      : "hover:border-primary/50"
                  )}
                  onClick={() => toggleCharacter(char.id)}
                >
                  <CardContent className="space-y-3 p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted font-bold text-primary">
                        {char.name.charAt(0)}
                      </div>
                      {isSelected && (
                        <div className="rounded-full bg-primary p-1 text-primary-foreground">
                          <Check className="h-4 w-4" />
                        </div>
                      )}
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-base font-semibold md:text-lg">
                        {char.name}
                      </h3>
                      <p className="line-clamp-2 text-xs italic text-muted-foreground">
                        "
                        {char.personality ||
                          char.description ||
                          "Sem descrição"}
                        "
                      </p>
                    </div>
                    {char.background && (
                      <Badge
                        variant="outline"
                        className="text-[10px] uppercase tracking-wider"
                      >
                        {char.active ? "Ativo" : "Inativo"}
                      </Badge>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>

        {characters?.length === 0 && (
          <div className="rounded-xl border-2 border-dashed bg-muted/20 py-8 text-center md:py-12">
            <p className="mb-4 text-muted-foreground">
              Você ainda não tem personagens criados.
            </p>
            <Button onClick={() => window.open("/characters", "_blank")}>
              <Plus className="mr-2 h-4 w-4" />
              Criar meu Primeiro Personagem
            </Button>
          </div>
        )}

        <div className="flex flex-col-reverse gap-4 border-t pt-6 font-sans md:flex-row md:justify-between">
          <Button
            variant="ghost"
            className="w-full md:w-auto"
            onClick={() => navigate(`/wizard/idea?projectId=${projectId}`)}
          >
            <ChevronLeft className="mr-2 h-4 w-4" />
            Voltar
          </Button>
          <div className="flex flex-col items-center gap-4 md:flex-row">
            <span className="text-sm text-muted-foreground">
              {selectedIds.length} selecionado(s)
            </span>
            <Button
              size="lg"
              className="w-full shadow-lg md:w-auto md:px-10"
              disabled={selectedIds.length === 0 || linkMutation.isPending}
              onClick={() => linkMutation.mutate()}
            >
              Próximo: Gerar Roteiro
              <ChevronRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    </WizardLayout>
  );
}

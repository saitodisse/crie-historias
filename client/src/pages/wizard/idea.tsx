import { useState, useEffect } from "react";
import { useLocation, useSearch } from "wouter";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import WizardLayout from "./layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Sparkles, ChevronRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import type { Story, AIExecution } from "@shared/schema";

interface AIResult {
  execution: AIExecution;
  result: string;
}

export default function WizardIdea() {
  const [, navigate] = useLocation();
  const search = useSearch();
  const params = new URLSearchParams(search);
  // Persisted state from URL
  const storyIdParam = params.get("storyId");
  const storyId = storyIdParam ? parseInt(storyIdParam) : null;

  const { toast } = useToast();
  const [initialIdea, setInitialIdea] = useState("");
  const [chatInput, setChatInput] = useState("");
  const [messages, setMessages] = useState<
    { role: "user" | "ai"; content: string }[]
  >([]);

  // Fetch story availability
  const { data: story, refetch: refetchStory } = useQuery<Story>({
    queryKey: [`/api/stories/${storyId}`],
    enabled: !!storyId,
  });

  // Fetch previous messages (Executions) to restore history
  const { data: executions } = useQuery<AIExecution[]>({
    queryKey: ["/api/executions"],
    enabled: !!storyId,
  });

  useEffect(() => {
    // Only attempt to restore if we have no messages yet and have valid history
    if (storyId && executions && messages.length === 0) {
      const storyExecs = executions
        .filter((e) => e.storyId === storyId && e.userPrompt)
        .sort(
          (a, b) =>
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );

      if (storyExecs.length > 0) {
        const rebuiltMessages = storyExecs.flatMap((e) => [
          { role: "user" as const, content: e.userPrompt || "" },
          { role: "ai" as const, content: e.result || "" },
        ]);
        setMessages(rebuiltMessages);
      } else if (story?.premise) {
        // Fallback if no executions found but story exists (maybe created manually?)
        setMessages([
          { role: "user", content: "Ideia salva..." },
          {
            role: "ai",
            content: `Título: ${story.title}\n\nPremissa: ${story.premise}`,
          },
        ]);
      }
    }
  }, [executions, storyId, story, messages.length]);

  const generateMutation = useMutation({
    mutationFn: async (vars: { prompt: string; sId: number }) => {
      const res = await apiRequest("POST", "/api/ai/generate", {
        userPrompt: vars.prompt,
        storyId: vars.sId,
        type: "wizard-idea",
      });
      return res.json() as Promise<AIResult>;
    },
    onSuccess: (data) => {
      setMessages((prev) => [...prev, { role: "ai", content: data.result }]);
      queryClient.invalidateQueries({ queryKey: ["/api/executions"] });
      // Update story premise with refinement (last AI output)
      if (storyId)
        updateStoryMutation.mutate({ content: data.result, sId: storyId });
    },
    onError: (err: Error) => {
      toast({
        title: "Erro na geração",
        description: err.message,
        variant: "destructive",
      });
    },
  });

  const createStoryMutation = useMutation({
    mutationFn: async (idea: string) => {
      const res = await apiRequest("POST", "/api/stories", {
        title: "Nova Aventura (Rascunho)",
        premise: idea,
        status: "draft",
      });
      return res.json() as Promise<Story>;
    },
    onSuccess: (data) => {
      // Update URL immediately
      navigate(`/wizard/idea?storyId=${data.id}`);

      // Then trigger generation
      const prompt = `Ideia Inicial: ${initialIdea}\n\nPor favor, expanda esta ideia em um Título, uma Premissa detalhada e um Tom/Gênero. Ao final, faça 2 ou 3 perguntas para que eu possa refinar a história.`;
      generateMutation.mutate({ prompt, sId: data.id });
    },
  });

  const updateStoryMutation = useMutation({
    mutationFn: async (vars: { content: string; sId: number }) => {
      // Try to extract title if present
      const titleMatch = vars.content.match(/Título:\s*(.+?)(\n|$)/i);
      const updates: any = { premise: vars.content };
      if (titleMatch) updates.title = titleMatch[1];

      await apiRequest("PATCH", `/api/stories/${vars.sId}`, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/stories/${storyId}`] });
    },
  });

  const handleStart = () => {
    if (!initialIdea.trim()) return;
    const initialMsg = { role: "user" as const, content: initialIdea };
    setMessages([initialMsg]);
    // Create story first
    createStoryMutation.mutate(initialIdea);
  };

  const handleSendChat = () => {
    if (!chatInput.trim() || !storyId) return;
    setMessages((prev) => [...prev, { role: "user", content: chatInput }]);
    const prompt = `Minha resposta/refinamento: ${chatInput}\n\nCom base nisso, atualize a Premissa e o Título se necessário, e continue o refinamento com novas perguntas se precisar.`;
    generateMutation.mutate({ prompt, sId: storyId });
    setChatInput("");
  };

  const isProcessing =
    generateMutation.isPending || createStoryMutation.isPending;

  return (
    <WizardLayout step={1}>
      <div className="space-y-6">
        {messages.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label htmlFor="idea" className="text-lg font-semibold">
                Qual é a sua grande ideia?
              </Label>
              <Textarea
                id="idea"
                placeholder="Ex: Um grupo de crianças encontra um robô gigante enterado no quintal..."
                className="min-h-[150px] bg-muted/30 p-4 text-lg transition-colors focus:bg-background"
                value={initialIdea}
                onChange={(e) => setInitialIdea(e.target.value)}
              />
            </div>
            <Button
              className="h-12 w-full text-lg shadow-lg"
              size="lg"
              onClick={handleStart}
              disabled={!initialIdea.trim() || isProcessing}
            >
              <Sparkles className="mr-2 h-5 w-5" />
              {isProcessing ? "Criando magia..." : "Começar a Criar"}
            </Button>
          </motion.div>
        ) : (
          <div className="flex h-[500px] flex-col">
            <ScrollArea className="mb-4 flex-1 pr-4">
              <div className="space-y-4">
                {messages.map((m, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: m.role === "user" ? 20 : -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className={cn(
                      "max-w-[80%] rounded-2xl p-4",
                      m.role === "user"
                        ? "ml-auto rounded-tr-none bg-primary text-primary-foreground"
                        : "mr-auto rounded-tl-none bg-muted text-foreground"
                    )}
                  >
                    <div className="prose prose-sm whitespace-pre-wrap dark:prose-invert">
                      {m.content}
                    </div>
                  </motion.div>
                ))}
                {isProcessing && (
                  <div className="mr-auto max-w-[80%] rounded-2xl rounded-tl-none bg-muted p-4 text-foreground">
                    <div className="flex gap-1">
                      <span className="h-2 w-2 animate-bounce rounded-full bg-foreground/30" />
                      <span className="h-2 w-2 animate-bounce rounded-full bg-foreground/30 [animation-delay:0.2s]" />
                      <span className="h-2 w-2 animate-bounce rounded-full bg-foreground/30 [animation-delay:0.4s]" />
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>

            <div className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Responda à IA ou peça mudanças..."
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSendChat()}
                  disabled={isProcessing}
                  className="h-12"
                />
                <Button
                  size="icon"
                  className="h-12 w-12 shrink-0"
                  onClick={handleSendChat}
                  disabled={isProcessing || !chatInput.trim()}
                >
                  <Send className="h-5 w-5" />
                </Button>
              </div>

              <div className="flex justify-end">
                <Button
                  variant="secondary"
                  size="lg"
                  className="px-8 shadow-md"
                  disabled={!storyId || isProcessing}
                  onClick={() =>
                    navigate(`/wizard/characters?storyId=${storyId}`)
                  }
                >
                  Próximo: Escolher Personagens
                  <ChevronRight className="ml-2 h-5 w-5" />
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </WizardLayout>
  );
}

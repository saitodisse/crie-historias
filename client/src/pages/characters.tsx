import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Plus, Users, Search, Pencil, Trash2, X, Sparkles } from "lucide-react";
import type { Character } from "@shared/schema";

export default function CharactersPage() {
  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState({ name: "", description: "", personality: "", background: "", notes: "" });
  const [aiDialogOpen, setAiDialogOpen] = useState(false);
  const [aiCharId, setAiCharId] = useState<number | null>(null);
  const [aiPrompt, setAiPrompt] = useState("");
  const { toast } = useToast();

  const { data: characters, isLoading } = useQuery<Character[]>({
    queryKey: ["/api/characters"],
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/characters", form);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/characters"] });
      setCreateOpen(false);
      resetForm();
      toast({ title: "Personagem criado" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("PATCH", `/api/characters/${editingId}`, form);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/characters"] });
      setEditingId(null);
      resetForm();
      toast({ title: "Personagem atualizado" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/characters/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/characters"] });
      toast({ title: "Personagem removido" });
    },
  });

  const generateMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/ai/generate", {
        characterId: aiCharId,
        userPrompt: aiPrompt,
        type: "character",
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/characters"] });
      queryClient.invalidateQueries({ queryKey: ["/api/executions"] });
      setAiDialogOpen(false);
      setAiPrompt("");
      toast({ title: "Geração por IA concluída" });
    },
    onError: (err: Error) => {
      toast({ title: "Geração falhou", description: err.message, variant: "destructive" });
    },
  });

  const resetForm = () => setForm({ name: "", description: "", personality: "", background: "", notes: "" });

  const startEditing = (char: Character) => {
    setEditingId(char.id);
    setForm({
      name: char.name,
      description: char.description || "",
      personality: char.personality || "",
      background: char.background || "",
      notes: char.notes || "",
    });
  };

  const filtered = characters?.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.description?.toLowerCase().includes(search.toLowerCase())
  );

  const CharacterForm = ({ isCreate }: { isCreate: boolean }) => (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Nome</Label>
        <Input
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          placeholder="Nome do personagem..."
          data-testid="input-char-name"
        />
      </div>
      <div className="space-y-2">
        <Label>Descrição Física</Label>
        <Textarea
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          placeholder="Aparência, porte físico, características marcantes..."
          rows={2}
          className="resize-none"
          data-testid="input-char-description"
        />
      </div>
      <div className="space-y-2">
        <Label>Personalidade</Label>
        <Textarea
          value={form.personality}
          onChange={(e) => setForm({ ...form, personality: e.target.value })}
          placeholder="Traços, temperamento, peculiaridades..."
          rows={2}
          className="resize-none"
          data-testid="input-char-personality"
        />
      </div>
      <div className="space-y-2">
        <Label>Histórico (Background)</Label>
        <Textarea
          value={form.background}
          onChange={(e) => setForm({ ...form, background: e.target.value })}
          placeholder="História de vida, motivações, segredos..."
          rows={2}
          className="resize-none"
          data-testid="input-char-background"
        />
      </div>
      <div className="space-y-2">
        <Label>Notas</Label>
        <Textarea
          value={form.notes}
          onChange={(e) => setForm({ ...form, notes: e.target.value })}
          placeholder="Notas adicionais..."
          rows={2}
          className="resize-none"
          data-testid="input-char-notes"
        />
      </div>
      <Button
        className="w-full"
        onClick={() => (isCreate ? createMutation.mutate() : updateMutation.mutate())}
        disabled={!form.name.trim() || (isCreate ? createMutation.isPending : updateMutation.isPending)}
        data-testid="button-submit-character"
      >
        {isCreate
          ? createMutation.isPending ? "Criando..." : "Criar Personagem"
          : updateMutation.isPending ? "Salvando..." : "Salvar Alterações"}
      </Button>
    </div>
  );

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between gap-4 flex-wrap p-6 pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" data-testid="text-characters-title">Personagens</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Personagens que podem ser vinculados a qualquer história
          </p>
        </div>
        <Dialog open={createOpen} onOpenChange={(o) => { setCreateOpen(o); if (!o) resetForm(); }}>
          <DialogTrigger asChild>
            <Button data-testid="button-create-character">
              <Plus className="h-4 w-4 mr-2" />
              Novo Personagem
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Criar Personagem</DialogTitle>
            </DialogHeader>
            <CharacterForm isCreate />
          </DialogContent>
        </Dialog>
      </div>

      <div className="px-6 pb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar personagens..."
            className="pl-9"
            data-testid="input-search-characters"
          />
        </div>
      </div>

      <div className="flex-1 overflow-auto px-6 pb-6">
        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardContent className="pt-4">
                  <Skeleton className="h-5 w-32 mb-2" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-2/3 mt-1" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filtered && filtered.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((char) => (
              <Card key={char.id} data-testid={`card-character-${char.id}`}>
                {editingId === char.id ? (
                  <CardContent className="pt-4 space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="font-semibold text-sm">Editando: {char.name}</h3>
                      <Button size="icon" variant="ghost" onClick={() => { setEditingId(null); resetForm(); }}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    <CharacterForm isCreate={false} />
                  </CardContent>
                ) : (
                  <>
                    <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0 pb-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 shrink-0">
                          <Users className="h-4 w-4 text-primary" />
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-semibold text-sm truncate">{char.name}</h3>
                          {!char.active && <Badge variant="secondary" className="text-xs">Inativo</Badge>}
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => {
                            setAiCharId(char.id);
                            setAiDialogOpen(true);
                          }}
                          data-testid={`button-ai-char-${char.id}`}
                        >
                          <Sparkles className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="ghost" onClick={() => startEditing(char)} data-testid={`button-edit-char-${char.id}`}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => { if (window.confirm(`Remover "${char.name}"?`)) deleteMutation.mutate(char.id); }}
                          data-testid={`button-delete-char-${char.id}`}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {char.description && <p className="text-sm text-muted-foreground line-clamp-2 mb-1">{char.description}</p>}
                      {char.personality && (
                        <p className="text-xs text-muted-foreground">
                          <span className="font-medium">Personalidade:</span> {char.personality}
                        </p>
                      )}
                      {char.background && (
                        <p className="text-xs text-muted-foreground mt-1">
                          <span className="font-medium">Histórico:</span> {char.background}
                        </p>
                      )}
                    </CardContent>
                  </>
                )}
              </Card>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted mb-4">
              <Users className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold">Nenhum personagem encontrado</h3>
            <p className="text-sm text-muted-foreground mt-1 max-w-sm">
              Crie personagens reutilizáveis que podem ser compartilhados entre múltiplas histórias.
            </p>
          </div>
        )}
      </div>

      <Dialog open={aiDialogOpen} onOpenChange={setAiDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Gerar com IA</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label>O que você gostaria de gerar para este personagem?</Label>
              <Textarea
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                placeholder="ex: Expanda o histórico deste personagem, desenvolva suas motivações..."
                rows={4}
                data-testid="input-ai-char-prompt"
              />
            </div>
            <Button
              className="w-full"
              onClick={() => generateMutation.mutate()}
              disabled={!aiPrompt.trim() || generateMutation.isPending}
              data-testid="button-submit-ai-char"
            >
              <Sparkles className="h-4 w-4 mr-2" />
              {generateMutation.isPending ? "Gerando..." : "Gerar"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

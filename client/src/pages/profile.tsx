import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
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
import { Slider } from "@/components/ui/slider";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import {
  Settings,
  Plus,
  Trash2,
  Check,
  Pencil,
  Loader2,
  Search,
  ArrowUpDown,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { CreativeProfile } from "@shared/schema";

interface ModelOption {
  id: string;
  name: string;
  price?: number;
  displayName: string;
}

function detectProvider(modelId: string): string {
  if (modelId.startsWith("gemini")) return "gemini";
  if (modelId.includes("/")) return "openrouter";
  return "openai";
}

function ProfileFormFields({
  form,
  setForm,
  provider,
  setProvider,
  dynamicModels,
  isLoadingModels,
  isModelsError,
  filteredModels,
  searchOpen,
  setSearchOpen,
  searchTerm,
  setSearchTerm,
  sortOrder,
  setSortOrder,
  isCreate,
  onSubmit,
  isPending,
}: {
  form: {
    name: string;
    model: string;
    temperature: string;
    maxTokens: number;
    narrativeStyle: string;
    active: boolean;
  };
  setForm: React.Dispatch<
    React.SetStateAction<{
      name: string;
      model: string;
      temperature: string;
      maxTokens: number;
      narrativeStyle: string;
      active: boolean;
    }>
  >;
  provider: string;
  setProvider: (v: string) => void;
  dynamicModels: ModelOption[] | undefined;
  isLoadingModels: boolean;
  isModelsError: boolean;
  filteredModels: ModelOption[];
  searchOpen: boolean;
  setSearchOpen: (v: boolean) => void;
  searchTerm: string;
  setSearchTerm: (v: string) => void;
  sortOrder: "asc" | "desc" | null;
  setSortOrder: React.Dispatch<React.SetStateAction<"asc" | "desc" | null>>;
  isCreate: boolean;
  onSubmit: () => void;
  isPending: boolean;
}) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Nome do Perfil</Label>
        <Input
          value={form.name}
          onChange={(e) =>
            setForm((prev) => ({ ...prev, name: e.target.value }))
          }
          placeholder="ex: Escrita Criativa, Técnico, Conciso"
          data-testid="input-profile-name"
        />
      </div>
      <div className="space-y-2">
        <Label>Provedor</Label>
        <Select
          value={provider}
          onValueChange={(v) => {
            setProvider(v);
            setForm((prev) => ({ ...prev, model: "" }));
          }}
        >
          <SelectTrigger data-testid="select-profile-provider">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="openai">OpenAI</SelectItem>
            <SelectItem value="gemini">Gemini</SelectItem>
            <SelectItem value="openrouter">OpenRouter</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>Modelo de IA</Label>
          <Dialog
            open={searchOpen}
            onOpenChange={(open) => {
              setSearchOpen(open);
              if (!open) setSearchTerm("");
            }}
          >
            <DialogTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                type="button"
                className="h-7 gap-1 px-2"
                disabled={!dynamicModels?.length}
              >
                <Search className="h-3.5 w-3.5" />
                Explorar Modelos
              </Button>
            </DialogTrigger>
            <DialogContent
              className="flex max-h-[80vh] max-w-2xl flex-col"
              onOpenAutoFocus={(e) => e.preventDefault()}
            >
              <DialogHeader>
                <DialogTitle>
                  Explorar Modelos - {provider.toUpperCase()}
                </DialogTitle>
              </DialogHeader>
              <div className="flex items-center gap-2 py-4">
                <div className="relative flex-1">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Pesquisar modelos..."
                    className="pl-9"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key !== "Escape") {
                        e.stopPropagation();
                      }
                    }}
                    data-testid="input-search-models"
                  />
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  type="button"
                  onClick={() =>
                    setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"))
                  }
                  title="Ordenar por preço"
                >
                  <ArrowUpDown className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex-1 space-y-2 overflow-y-auto pr-1">
                {filteredModels.map((m) => (
                  <Button
                    key={m.id}
                    variant="outline"
                    className="h-auto w-full justify-between px-4 py-3 text-left"
                    onClick={() => {
                      setForm((prev) => ({ ...prev, model: m.id }));
                      setSearchOpen(false);
                    }}
                  >
                    <div className="flex flex-col gap-0.5">
                      <span className="font-medium">
                        {m.displayName.split(" (")[0]}
                      </span>
                      <span className="font-mono text-xs text-muted-foreground">
                        {m.id}
                      </span>
                    </div>
                    {m.price !== undefined && (
                      <Badge
                        variant="secondary"
                        className="ml-2 whitespace-nowrap"
                      >
                        ${m.price.toFixed(2)}/M
                      </Badge>
                    )}
                  </Button>
                ))}
                {filteredModels.length === 0 && (
                  <p className="py-8 text-center text-muted-foreground">
                    Nenhum modelo encontrado.
                  </p>
                )}
              </div>
            </DialogContent>
          </Dialog>
        </div>
        {isLoadingModels ? (
          <div className="flex h-9 items-center gap-2 rounded-md border px-3 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Carregando modelos...
          </div>
        ) : isModelsError ? (
          <div className="flex h-9 items-center gap-2 rounded-md border border-destructive px-3 text-sm text-destructive">
            Falha ao carregar modelos. Verifique sua chave de API.
          </div>
        ) : dynamicModels && dynamicModels.length === 0 ? (
          <div className="flex h-9 items-center gap-2 rounded-md border px-3 text-sm text-muted-foreground">
            Nenhum modelo disponível para este provedor.
          </div>
        ) : (
          <Select
            value={form.model}
            onValueChange={(v) => setForm((prev) => ({ ...prev, model: v }))}
          >
            <SelectTrigger data-testid="select-profile-model">
              <SelectValue placeholder="Selecione um modelo" />
            </SelectTrigger>
            <SelectContent>
              {(dynamicModels || []).map((m) => (
                <SelectItem key={m.id} value={m.id}>
                  {m.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>
      <div className="space-y-2">
        <Label>Temperatura: {form.temperature}</Label>
        <Slider
          value={[parseFloat(form.temperature)]}
          onValueChange={([v]) =>
            setForm((prev) => ({ ...prev, temperature: v.toFixed(1) }))
          }
          min={0}
          max={2}
          step={0.1}
          data-testid="slider-temperature"
        />
        <p className="text-xs text-muted-foreground">
          Menor = mais focado, Maior = mais criativo
        </p>
      </div>
      <div className="space-y-2">
        <Label>Máximo de Tokens</Label>
        <Input
          type="number"
          value={form.maxTokens}
          onChange={(e) =>
            setForm((prev) => ({
              ...prev,
              maxTokens: parseInt(e.target.value) || 2048,
            }))
          }
          min={256}
          max={8192}
          data-testid="input-max-tokens"
        />
      </div>
      <div className="space-y-2">
        <Label>Estilo Narrativo</Label>
        <Textarea
          value={form.narrativeStyle}
          onChange={(e) =>
            setForm((prev) => ({ ...prev, narrativeStyle: e.target.value }))
          }
          placeholder="Descreva o estilo de escrita desejado, tom, voz..."
          rows={3}
          className="resize-none"
          data-testid="input-narrative-style"
        />
      </div>
      <Button
        className="w-full"
        onClick={onSubmit}
        disabled={!form.name.trim() || !form.model || isPending}
        data-testid="button-submit-profile"
      >
        {isCreate
          ? isPending
            ? "Criando..."
            : "Criar Perfil"
          : isPending
            ? "Salvando..."
            : "Salvar Alterações"}
      </Button>
    </div>
  );
}

export default function ProfilePage() {
  const [createOpen, setCreateOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [provider, setProvider] = useState("openai");
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc" | null>(null);

  const [form, setForm] = useState({
    name: "",
    model: "",
    temperature: "0.8",
    maxTokens: 2048,
    narrativeStyle: "",
    active: true,
  });
  const { toast } = useToast();

  const [openaiKey, setOpenaiKey] = useState("");
  const [geminiKey, setGeminiKey] = useState("");
  const [openrouterKey, setOpenrouterKey] = useState("");

  const { data: keysData } = useQuery<{
    hasOpenai: boolean;
    hasGemini: boolean;
    hasOpenrouter: boolean;
  }>({
    queryKey: ["/api/user/keys"],
  });

  const {
    data: dynamicModels,
    isLoading: isLoadingModels,
    isError: isModelsError,
  } = useQuery<ModelOption[]>({
    queryKey: ["/api/models", provider],
    queryFn: async () => {
      const resp = await fetch(`/api/models/${provider}`);
      if (!resp.ok) throw new Error("Falha ao carregar modelos");
      const data = await resp.json();
      return data.map((m: any) => {
        const priceMatch = m.name.match(/\$(\d+\.?\d*)\/M/);
        return {
          ...m,
          displayName: m.name,
          price: priceMatch ? parseFloat(priceMatch[1]) : undefined,
        };
      });
    },
    retry: 1,
    staleTime: 5 * 60 * 1000,
  });

  const filteredModels = (dynamicModels || [])
    .filter((m) =>
      m.displayName.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      if (!sortOrder) return 0;
      const priceA = a.price ?? Infinity;
      const priceB = b.price ?? Infinity;
      return sortOrder === "asc" ? priceA - priceB : priceB - priceA;
    });

  const saveKeysMutation = useMutation({
    mutationFn: async (data: any) => {
      await apiRequest("POST", "/api/user/keys", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user/keys"] });
      toast({ title: "Chaves de API atualizadas" });
      setOpenaiKey("");
      setGeminiKey("");
      setOpenrouterKey("");
    },
  });

  const { data: profiles, isLoading } = useQuery<CreativeProfile[]>({
    queryKey: ["/api/profiles"],
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/profiles", form);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/profiles"] });
      setCreateOpen(false);
      resetForm();
      toast({ title: "Perfil criado" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("PATCH", `/api/profiles/${editId}`, form);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/profiles"] });
      setEditId(null);
      resetForm();
      toast({ title: "Perfil atualizado" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/profiles/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/profiles"] });
      toast({ title: "Perfil removido" });
    },
  });

  const setActiveMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("POST", `/api/profiles/${id}/activate`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/profiles"] });
      toast({ title: "Perfil ativo atualizado" });
    },
  });

  const resetForm = () => {
    setProvider("openai");
    setForm({
      name: "",
      model: "",
      temperature: "0.8",
      maxTokens: 2048,
      narrativeStyle: "",
      active: true,
    });
  };

  const startEditing = (p: CreativeProfile) => {
    setEditId(p.id);
    setProvider(detectProvider(p.model));
    setForm({
      name: p.name,
      model: p.model,
      temperature: p.temperature,
      maxTokens: p.maxTokens,
      narrativeStyle: p.narrativeStyle || "",
      active: p.active,
    });
  };

  const sharedFormProps = {
    form,
    setForm,
    provider,
    setProvider,
    dynamicModels,
    isLoadingModels,
    isModelsError,
    filteredModels,
    searchOpen,
    setSearchOpen,
    searchTerm,
    setSearchTerm,
    sortOrder,
    setSortOrder,
  };

  return (
    <div className="flex h-full flex-col space-y-8 overflow-auto p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Configurações de API
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Suas chaves são criptografadas e armazenadas com segurança.
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <Card>
            <CardHeader className="py-3">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold">OpenAI</Label>
                {keysData?.hasOpenai && (
                  <Badge variant="secondary" className="text-[10px]">
                    Configurada
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-2 py-0 pb-3">
              <Input
                type="password"
                placeholder="sk-..."
                value={openaiKey}
                onChange={(e) => setOpenaiKey(e.target.value)}
                className="h-8 text-xs"
                data-testid="input-openai-key"
              />
              <Button
                size="sm"
                className="h-8 w-full"
                onClick={() => saveKeysMutation.mutate({ openaiKey })}
                disabled={!openaiKey}
                data-testid="button-save-openai-key"
              >
                Salvar
              </Button>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="py-3">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold">Gemini</Label>
                {keysData?.hasGemini && (
                  <Badge variant="secondary" className="text-[10px]">
                    Configurada
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-2 py-0 pb-3">
              <Input
                type="password"
                placeholder="Chave Gemini..."
                value={geminiKey}
                onChange={(e) => setGeminiKey(e.target.value)}
                className="h-8 text-xs"
                data-testid="input-gemini-key"
              />
              <Button
                size="sm"
                className="h-8 w-full"
                onClick={() => saveKeysMutation.mutate({ geminiKey })}
                disabled={!geminiKey}
                data-testid="button-save-gemini-key"
              >
                Salvar
              </Button>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="py-3">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold">OpenRouter</Label>
                {keysData?.hasOpenrouter && (
                  <Badge variant="secondary" className="text-[10px]">
                    Configurada
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-2 py-0 pb-3">
              <Input
                type="password"
                placeholder="sk-or-..."
                value={openrouterKey}
                onChange={(e) => setOpenrouterKey(e.target.value)}
                className="h-8 text-xs"
                data-testid="input-openrouter-key"
              />
              <Button
                size="sm"
                className="h-8 w-full"
                onClick={() => saveKeysMutation.mutate({ openrouterKey })}
                disabled={!openrouterKey}
                data-testid="button-save-openrouter-key"
              >
                Salvar
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="flex h-full flex-col">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4">
          <div>
            <h1
              className="text-2xl font-bold tracking-tight"
              data-testid="text-profile-title"
            >
              Perfis Criativos
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Gerencie preferências de modelo de IA e estilos narrativos
            </p>
          </div>
          <Dialog
            open={createOpen}
            onOpenChange={(o) => {
              setCreateOpen(o);
              if (!o) resetForm();
            }}
          >
            <DialogTrigger asChild>
              <Button data-testid="button-create-profile">
                <Plus className="mr-2 h-4 w-4" />
                Novo Perfil
              </Button>
            </DialogTrigger>
            <DialogContent onOpenAutoFocus={(e) => e.preventDefault()}>
              <DialogHeader>
                <DialogTitle>Criar Perfil Criativo</DialogTitle>
              </DialogHeader>
              <ProfileFormFields
                {...sharedFormProps}
                isCreate
                onSubmit={() => createMutation.mutate()}
                isPending={createMutation.isPending}
              />
            </DialogContent>
          </Dialog>
        </div>

        <div className="flex-1 overflow-auto pb-6">
          {isLoading ? (
            <div className="grid gap-4 sm:grid-cols-2">
              {[1, 2].map((i) => (
                <Card key={i}>
                  <CardContent className="pt-4">
                    <Skeleton className="mb-2 h-5 w-32" />
                    <Skeleton className="h-4 w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : profiles && profiles.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2">
              {profiles.map((profile) => (
                <Card
                  key={profile.id}
                  className={profile.active ? "border-primary/30" : ""}
                  data-testid={`card-profile-${profile.id}`}
                >
                  {editId === profile.id ? (
                    <CardContent className="pt-4">
                      <ProfileFormFields
                        {...sharedFormProps}
                        isCreate={false}
                        onSubmit={() => updateMutation.mutate()}
                        isPending={updateMutation.isPending}
                      />
                      <Button
                        variant="ghost"
                        className="mt-2 w-full"
                        onClick={() => {
                          setEditId(null);
                          resetForm();
                        }}
                      >
                        Cancelar
                      </Button>
                    </CardContent>
                  ) : (
                    <>
                      <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0 pb-2">
                        <div className="flex min-w-0 items-center gap-2">
                          <Settings className="h-4 w-4 shrink-0 text-primary" />
                          <h3 className="truncate text-sm font-semibold">
                            {profile.name}
                          </h3>
                          {profile.active && (
                            <div className="flex items-center gap-1 text-xs text-primary">
                              <Check className="h-3 w-3" />
                              Ativo
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          {!profile.active && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() =>
                                setActiveMutation.mutate(profile.id)
                              }
                              data-testid={`button-activate-profile-${profile.id}`}
                            >
                              Ativar
                            </Button>
                          )}
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => startEditing(profile)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => {
                              if (window.confirm("Remover este perfil?"))
                                deleteMutation.mutate(profile.id);
                            }}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between gap-2">
                            <span className="text-muted-foreground">
                              Modelo
                            </span>
                            <span className="font-mono text-xs">
                              {profile.model}
                            </span>
                          </div>
                          <div className="flex justify-between gap-2">
                            <span className="text-muted-foreground">
                              Temperatura
                            </span>
                            <span>{profile.temperature}</span>
                          </div>
                          <div className="flex justify-between gap-2">
                            <span className="text-muted-foreground">
                              Tokens Máximos
                            </span>
                            <span>{profile.maxTokens}</span>
                          </div>
                          {profile.narrativeStyle && (
                            <div>
                              <span className="text-xs text-muted-foreground">
                                Estilo Narrativo
                              </span>
                              <p className="mt-0.5 text-xs">
                                {profile.narrativeStyle}
                              </p>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </>
                  )}
                </Card>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                <Settings className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold">
                Nenhum perfil criativo encontrado
              </h3>
              <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                Crie um perfil para salvar suas configurações de modelo de IA e
                estilo narrativo.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

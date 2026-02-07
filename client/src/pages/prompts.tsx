import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Plus, Sparkles, Search, Pencil, Trash2, X, Copy } from "lucide-react";
import type { Prompt } from "@shared/schema";

const categoryColors: Record<string, string> = {
  character: "bg-blue-500/10 text-blue-700 dark:text-blue-400",
  story: "bg-amber-500/10 text-amber-700 dark:text-amber-400",
  script: "bg-green-500/10 text-green-700 dark:text-green-400",
  refinement: "bg-purple-500/10 text-purple-700 dark:text-purple-400",
};

export default function PromptsPage() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [createOpen, setCreateOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState({
    name: "", category: "story", type: "task", content: "", active: true,
  });
  const { toast } = useToast();

  const { data: prompts, isLoading } = useQuery<Prompt[]>({
    queryKey: ["/api/prompts"],
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/prompts", form);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/prompts"] });
      setCreateOpen(false);
      resetForm();
      toast({ title: "Prompt created" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("PATCH", `/api/prompts/${editingId}`, form);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/prompts"] });
      setEditingId(null);
      resetForm();
      toast({ title: "Prompt updated" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/prompts/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/prompts"] });
      toast({ title: "Prompt deleted" });
    },
  });

  const resetForm = () => setForm({ name: "", category: "story", type: "task", content: "", active: true });

  const startEditing = (p: Prompt) => {
    setEditingId(p.id);
    setForm({
      name: p.name,
      category: p.category,
      type: p.type,
      content: p.content,
      active: p.active,
    });
  };

  const filtered = prompts?.filter((p) => {
    const matchSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.content.toLowerCase().includes(search.toLowerCase());
    const matchCategory = category === "all" || p.category === category;
    return matchSearch && matchCategory;
  });

  const PromptForm = ({ isCreate }: { isCreate: boolean }) => (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Name</Label>
        <Input
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          placeholder="e.g. Generate Synopsis"
          data-testid="input-prompt-name"
        />
      </div>
      <div className="flex gap-4">
        <div className="flex-1 space-y-2">
          <Label>Category</Label>
          <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
            <SelectTrigger data-testid="select-prompt-category"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="character">Character</SelectItem>
              <SelectItem value="story">Story</SelectItem>
              <SelectItem value="script">Script</SelectItem>
              <SelectItem value="refinement">Refinement</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex-1 space-y-2">
          <Label>Type</Label>
          <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
            <SelectTrigger data-testid="select-prompt-type"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="system">System</SelectItem>
              <SelectItem value="task">Task</SelectItem>
              <SelectItem value="auxiliary">Auxiliary</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="space-y-2">
        <Label>Content</Label>
        <Textarea
          value={form.content}
          onChange={(e) => setForm({ ...form, content: e.target.value })}
          placeholder="Write your prompt template here. Use {{story.title}}, {{character.name}} etc. for variables."
          rows={8}
          className="font-mono text-sm"
          data-testid="input-prompt-content"
        />
      </div>
      <div className="flex items-center gap-2">
        <Switch
          checked={form.active}
          onCheckedChange={(checked) => setForm({ ...form, active: checked })}
          data-testid="switch-prompt-active"
        />
        <Label>Active</Label>
      </div>
      <Button
        className="w-full"
        onClick={() => (isCreate ? createMutation.mutate() : updateMutation.mutate())}
        disabled={!form.name.trim() || !form.content.trim() || (isCreate ? createMutation.isPending : updateMutation.isPending)}
        data-testid="button-submit-prompt"
      >
        {isCreate
          ? createMutation.isPending ? "Creating..." : "Create Prompt"
          : updateMutation.isPending ? "Saving..." : "Save Changes"}
      </Button>
    </div>
  );

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between gap-4 flex-wrap p-6 pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" data-testid="text-prompts-title">Prompts</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Configurable prompt templates for AI generation
          </p>
        </div>
        <Dialog open={createOpen} onOpenChange={(o) => { setCreateOpen(o); if (!o) resetForm(); }}>
          <DialogTrigger asChild>
            <Button data-testid="button-create-prompt">
              <Plus className="h-4 w-4 mr-2" />
              New Prompt
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create Prompt</DialogTitle>
            </DialogHeader>
            <PromptForm isCreate />
          </DialogContent>
        </Dialog>
      </div>

      <div className="px-6 pb-4 flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search prompts..."
            className="pl-9"
            data-testid="input-search-prompts"
          />
        </div>
        <Tabs value={category} onValueChange={setCategory}>
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="story">Story</TabsTrigger>
            <TabsTrigger value="character">Character</TabsTrigger>
            <TabsTrigger value="script">Script</TabsTrigger>
            <TabsTrigger value="refinement">Refinement</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="flex-1 overflow-auto px-6 pb-6">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardContent className="pt-4">
                  <Skeleton className="h-5 w-32 mb-2" />
                  <Skeleton className="h-16 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filtered && filtered.length > 0 ? (
          <div className="space-y-3">
            {filtered.map((prompt) => (
              <Card key={prompt.id} data-testid={`card-prompt-${prompt.id}`}>
                {editingId === prompt.id ? (
                  <CardContent className="pt-4 space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="font-semibold text-sm">Editing: {prompt.name}</h3>
                      <Button size="icon" variant="ghost" onClick={() => { setEditingId(null); resetForm(); }}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    <PromptForm isCreate={false} />
                  </CardContent>
                ) : (
                  <>
                    <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0 pb-2">
                      <div className="flex items-center gap-2 min-w-0 flex-wrap">
                        <Sparkles className="h-4 w-4 text-primary shrink-0" />
                        <h3 className="font-semibold text-sm">{prompt.name}</h3>
                        <Badge variant="secondary" className={categoryColors[prompt.category] || ""}>
                          {prompt.category}
                        </Badge>
                        <Badge variant="secondary">{prompt.type}</Badge>
                        {!prompt.active && <Badge variant="secondary" className="opacity-50">Inactive</Badge>}
                        <span className="text-xs text-muted-foreground">v{prompt.version}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => {
                            navigator.clipboard.writeText(prompt.content);
                            toast({ title: "Copied to clipboard" });
                          }}
                          data-testid={`button-copy-prompt-${prompt.id}`}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="ghost" onClick={() => startEditing(prompt)} data-testid={`button-edit-prompt-${prompt.id}`}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => { if (window.confirm(`Delete "${prompt.name}"?`)) deleteMutation.mutate(prompt.id); }}
                          data-testid={`button-delete-prompt-${prompt.id}`}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <pre className="text-xs text-muted-foreground bg-muted rounded-md p-3 whitespace-pre-wrap font-mono max-h-32 overflow-auto">
                        {prompt.content}
                      </pre>
                    </CardContent>
                  </>
                )}
              </Card>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted mb-4">
              <Sparkles className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold">No prompts yet</h3>
            <p className="text-sm text-muted-foreground mt-1 max-w-sm">
              Create configurable prompt templates for AI content generation.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

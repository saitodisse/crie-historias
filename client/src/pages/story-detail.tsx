import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation, useParams } from "wouter";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowLeft, Save, Trash2, FileText, Users, Sparkles, Plus, UserPlus, X,
} from "lucide-react";
import type { Story, Character, Script, AIExecution } from "@shared/schema";

interface StoryDetail extends Story {
  characters?: Character[];
  scripts?: Script[];
  aiExecutions?: AIExecution[];
}

export default function StoryDetailPage() {
  const params = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const storyId = parseInt(params.id);

  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState("");
  const [premise, setPremise] = useState("");
  const [tone, setTone] = useState("");
  const [status, setStatus] = useState("draft");
  const [addCharOpen, setAddCharOpen] = useState(false);
  const [scriptDialogOpen, setScriptDialogOpen] = useState(false);
  const [scriptTitle, setScriptTitle] = useState("");
  const [scriptType, setScriptType] = useState("synopsis");
  const [scriptContent, setScriptContent] = useState("");
  const [aiDialogOpen, setAiDialogOpen] = useState(false);
  const [aiUserPrompt, setAiUserPrompt] = useState("");

  const { data: story, isLoading } = useQuery<StoryDetail>({
    queryKey: ["/api/stories", storyId],
    enabled: !!storyId,
  });

  const { data: allCharacters } = useQuery<Character[]>({
    queryKey: ["/api/characters"],
  });

  const updateMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("PATCH", `/api/stories/${storyId}`, { title, premise, tone, status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/stories", storyId] });
      queryClient.invalidateQueries({ queryKey: ["/api/stories"] });
      setEditing(false);
      toast({ title: "Story updated" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("DELETE", `/api/stories/${storyId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/stories"] });
      navigate("/");
      toast({ title: "Story deleted" });
    },
  });

  const addCharMutation = useMutation({
    mutationFn: async (characterId: number) => {
      await apiRequest("POST", `/api/stories/${storyId}/characters`, { characterId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/stories", storyId] });
      setAddCharOpen(false);
      toast({ title: "Character added to story" });
    },
  });

  const removeCharMutation = useMutation({
    mutationFn: async (characterId: number) => {
      await apiRequest("DELETE", `/api/stories/${storyId}/characters/${characterId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/stories", storyId] });
      toast({ title: "Character removed" });
    },
  });

  const createScriptMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/scripts", {
        storyId,
        title: scriptTitle,
        type: scriptType,
        content: scriptContent,
        origin: "manual",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/stories", storyId] });
      setScriptDialogOpen(false);
      setScriptTitle("");
      setScriptContent("");
      toast({ title: "Script created" });
    },
  });

  const generateMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/ai/generate", {
        storyId,
        userPrompt: aiUserPrompt,
        type: "story",
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/stories", storyId] });
      queryClient.invalidateQueries({ queryKey: ["/api/executions"] });
      setAiDialogOpen(false);
      setAiUserPrompt("");
      toast({ title: "AI generation complete" });
    },
    onError: (err: Error) => {
      toast({ title: "Generation failed", description: err.message, variant: "destructive" });
    },
  });

  const startEditing = () => {
    if (story) {
      setTitle(story.title);
      setPremise(story.premise || "");
      setTone(story.tone || "");
      setStatus(story.status);
      setEditing(true);
    }
  };

  const linkedCharIds = new Set(story?.characters?.map((c) => c.id) || []);
  const availableChars = allCharacters?.filter((c) => !linkedCharIds.has(c.id) && c.active) || [];

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-9 w-9" />
          <Skeleton className="h-7 w-48" />
        </div>
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (!story) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">Story not found</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-auto">
      <div className="flex items-center justify-between gap-4 flex-wrap p-6 pb-4">
        <div className="flex items-center gap-3">
          <Button size="icon" variant="ghost" onClick={() => navigate("/")} data-testid="button-back-stories">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          {editing ? (
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="text-xl font-bold h-auto py-1"
              data-testid="input-edit-title"
            />
          ) : (
            <h1 className="text-2xl font-bold tracking-tight" data-testid="text-story-title">{story.title}</h1>
          )}
        </div>
        <div className="flex items-center gap-2">
          {editing ? (
            <>
              <Button variant="ghost" onClick={() => setEditing(false)} data-testid="button-cancel-edit">Cancel</Button>
              <Button onClick={() => updateMutation.mutate()} disabled={updateMutation.isPending} data-testid="button-save-story">
                <Save className="h-4 w-4 mr-2" />
                Save
              </Button>
            </>
          ) : (
            <>
              <Dialog open={aiDialogOpen} onOpenChange={setAiDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" data-testid="button-ai-generate">
                    <Sparkles className="h-4 w-4 mr-2" />
                    Generate with AI
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Generate Content with AI</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 pt-2">
                    <div className="space-y-2">
                      <Label>What would you like to generate?</Label>
                      <Textarea
                        value={aiUserPrompt}
                        onChange={(e) => setAiUserPrompt(e.target.value)}
                        placeholder="e.g. Expand the premise into a detailed synopsis, suggest plot twists..."
                        rows={4}
                        data-testid="input-ai-prompt"
                      />
                    </div>
                    <Button
                      className="w-full"
                      onClick={() => generateMutation.mutate()}
                      disabled={!aiUserPrompt.trim() || generateMutation.isPending}
                      data-testid="button-submit-ai"
                    >
                      <Sparkles className="h-4 w-4 mr-2" />
                      {generateMutation.isPending ? "Generating..." : "Generate"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
              <Button variant="outline" onClick={startEditing} data-testid="button-edit-story">Edit</Button>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => {
                  if (window.confirm("Delete this story and all related scripts?")) {
                    deleteMutation.mutate();
                  }
                }}
                data-testid="button-delete-story"
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="px-6 pb-4">
        <Card>
          <CardContent className="pt-4">
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <Label className="text-muted-foreground text-xs">Status</Label>
                {editing ? (
                  <Select value={status} onValueChange={setStatus}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="in-development">In Development</SelectItem>
                      <SelectItem value="finished">Finished</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <p className="text-sm mt-1 capitalize">{story.status.replace("-", " ")}</p>
                )}
              </div>
              <div>
                <Label className="text-muted-foreground text-xs">Tone / Genre</Label>
                {editing ? (
                  <Input value={tone} onChange={(e) => setTone(e.target.value)} className="mt-1" />
                ) : (
                  <p className="text-sm mt-1">{story.tone || "Not specified"}</p>
                )}
              </div>
              <div>
                <Label className="text-muted-foreground text-xs">Created</Label>
                <p className="text-sm mt-1">{new Date(story.createdAt).toLocaleDateString()}</p>
              </div>
            </div>
            <div className="mt-4">
              <Label className="text-muted-foreground text-xs">Premise</Label>
              {editing ? (
                <Textarea value={premise} onChange={(e) => setPremise(e.target.value)} className="mt-1 resize-none" rows={3} />
              ) : (
                <p className="text-sm mt-1 whitespace-pre-wrap">{story.premise || "No premise defined"}</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex-1 px-6 pb-6">
        <Tabs defaultValue="characters">
          <TabsList>
            <TabsTrigger value="characters" data-testid="tab-characters">
              <Users className="h-4 w-4 mr-2" />
              Characters ({story.characters?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="scripts" data-testid="tab-scripts">
              <FileText className="h-4 w-4 mr-2" />
              Scripts ({story.scripts?.length || 0})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="characters" className="mt-4">
            <div className="flex items-center justify-between mb-4 gap-4 flex-wrap">
              <p className="text-sm text-muted-foreground">Characters linked to this story</p>
              <Dialog open={addCharOpen} onOpenChange={setAddCharOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" data-testid="button-add-character">
                    <UserPlus className="h-4 w-4 mr-2" />
                    Add Character
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add Character to Story</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-2 pt-2 max-h-[50vh] overflow-auto">
                    {availableChars.length > 0 ? (
                      availableChars.map((char) => (
                        <Card key={char.id} className="hover-elevate cursor-pointer" onClick={() => addCharMutation.mutate(char.id)}>
                          <CardContent className="flex items-center justify-between py-3">
                            <div>
                              <p className="font-medium text-sm">{char.name}</p>
                              <p className="text-xs text-muted-foreground truncate max-w-xs">
                                {char.description || "No description"}
                              </p>
                            </div>
                            <Plus className="h-4 w-4 text-muted-foreground" />
                          </CardContent>
                        </Card>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        No available characters. Create one in the Characters section first.
                      </p>
                    )}
                  </div>
                </DialogContent>
              </Dialog>
            </div>
            {story.characters && story.characters.length > 0 ? (
              <div className="grid gap-3 sm:grid-cols-2">
                {story.characters.map((char) => (
                  <Card key={char.id} data-testid={`card-linked-char-${char.id}`}>
                    <CardContent className="flex items-center justify-between py-3">
                      <div className="min-w-0">
                        <p className="font-medium text-sm">{char.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{char.personality || char.description || "No details"}</p>
                      </div>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => removeCharMutation.mutate(char.id)}
                        data-testid={`button-remove-char-${char.id}`}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center py-8 text-center">
                <Users className="h-8 w-8 text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">No characters linked yet</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="scripts" className="mt-4">
            <div className="flex items-center justify-between mb-4 gap-4 flex-wrap">
              <p className="text-sm text-muted-foreground">Scripts derived from this story</p>
              <Dialog open={scriptDialogOpen} onOpenChange={setScriptDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" data-testid="button-create-script">
                    <Plus className="h-4 w-4 mr-2" />
                    New Script
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Create Script</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 pt-2">
                    <div className="flex gap-4">
                      <div className="flex-1 space-y-2">
                        <Label>Title</Label>
                        <Input
                          value={scriptTitle}
                          onChange={(e) => setScriptTitle(e.target.value)}
                          placeholder="Script title..."
                          data-testid="input-script-title"
                        />
                      </div>
                      <div className="w-40 space-y-2">
                        <Label>Type</Label>
                        <Select value={scriptType} onValueChange={setScriptType}>
                          <SelectTrigger data-testid="select-script-type"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="synopsis">Synopsis</SelectItem>
                            <SelectItem value="outline">Outline</SelectItem>
                            <SelectItem value="detailed">Detailed</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Content</Label>
                      <Textarea
                        value={scriptContent}
                        onChange={(e) => setScriptContent(e.target.value)}
                        placeholder="Write your script content..."
                        rows={10}
                        className="font-mono text-sm"
                        data-testid="input-script-content"
                      />
                    </div>
                    <Button
                      className="w-full"
                      onClick={() => createScriptMutation.mutate()}
                      disabled={!scriptTitle.trim() || createScriptMutation.isPending}
                      data-testid="button-submit-script"
                    >
                      Create Script
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
            {story.scripts && story.scripts.length > 0 ? (
              <div className="space-y-3">
                {story.scripts.map((script) => (
                  <Card
                    key={script.id}
                    className="hover-elevate cursor-pointer"
                    onClick={() => navigate(`/scripts/${script.id}`)}
                    data-testid={`card-script-${script.id}`}
                  >
                    <CardContent className="flex items-center justify-between py-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <FileText className="h-4 w-4 text-primary shrink-0" />
                        <div className="min-w-0">
                          <p className="font-medium text-sm">{script.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {script.type} - {script.origin === "ai" ? "AI Generated" : "Manual"}
                          </p>
                        </div>
                      </div>
                      <Badge variant="secondary">{script.type}</Badge>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center py-8 text-center">
                <FileText className="h-8 w-8 text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">No scripts yet</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation, useParams } from "wouter";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Save, Trash2, Sparkles } from "lucide-react";
import type { Script } from "@shared/schema";

interface ScriptDetail extends Script {
  storyTitle?: string;
}

export default function ScriptDetailPage() {
  const params = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const scriptId = parseInt(params.id);

  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState("");
  const [type, setType] = useState("synopsis");
  const [content, setContent] = useState("");
  const [aiOpen, setAiOpen] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");

  const { data: script, isLoading } = useQuery<ScriptDetail>({
    queryKey: ["/api/scripts", scriptId],
    enabled: !!scriptId,
  });

  const updateMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("PATCH", `/api/scripts/${scriptId}`, { title, type, content });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/scripts", scriptId] });
      queryClient.invalidateQueries({ queryKey: ["/api/scripts"] });
      setEditing(false);
      toast({ title: "Script updated" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("DELETE", `/api/scripts/${scriptId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/scripts"] });
      navigate("/scripts");
      toast({ title: "Script deleted" });
    },
  });

  const generateMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/ai/generate", {
        scriptId,
        storyId: script?.storyId,
        userPrompt: aiPrompt,
        type: "script",
      });
      return res.json();
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/scripts", scriptId] });
      queryClient.invalidateQueries({ queryKey: ["/api/executions"] });
      setAiOpen(false);
      setAiPrompt("");
      toast({ title: "AI generation complete" });
    },
    onError: (err: Error) => {
      toast({ title: "Generation failed", description: err.message, variant: "destructive" });
    },
  });

  const startEditing = () => {
    if (script) {
      setTitle(script.title);
      setType(script.type);
      setContent(script.content || "");
      setEditing(true);
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-7 w-48" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!script) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">Script not found</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-auto">
      <div className="flex items-center justify-between gap-4 flex-wrap p-6 pb-4">
        <div className="flex items-center gap-3">
          <Button size="icon" variant="ghost" onClick={() => navigate("/scripts")} data-testid="button-back-scripts">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            {editing ? (
              <Input value={title} onChange={(e) => setTitle(e.target.value)} className="text-xl font-bold h-auto py-1" />
            ) : (
              <h1 className="text-2xl font-bold tracking-tight" data-testid="text-script-title">{script.title}</h1>
            )}
            {script.storyTitle && (
              <p className="text-sm text-muted-foreground mt-0.5">From: {script.storyTitle}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {editing ? (
            <>
              <Button variant="ghost" onClick={() => setEditing(false)}>Cancel</Button>
              <Button onClick={() => updateMutation.mutate()} disabled={updateMutation.isPending}>
                <Save className="h-4 w-4 mr-2" />
                Save
              </Button>
            </>
          ) : (
            <>
              <Dialog open={aiOpen} onOpenChange={setAiOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" data-testid="button-ai-script">
                    <Sparkles className="h-4 w-4 mr-2" />
                    Generate with AI
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Generate Script Content</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 pt-2">
                    <Textarea
                      value={aiPrompt}
                      onChange={(e) => setAiPrompt(e.target.value)}
                      placeholder="e.g. Expand this into a full screenplay, add more dialogue..."
                      rows={4}
                    />
                    <Button
                      className="w-full"
                      onClick={() => generateMutation.mutate()}
                      disabled={!aiPrompt.trim() || generateMutation.isPending}
                    >
                      <Sparkles className="h-4 w-4 mr-2" />
                      {generateMutation.isPending ? "Generating..." : "Generate"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
              <Button variant="outline" onClick={startEditing}>Edit</Button>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => { if (window.confirm("Delete this script?")) deleteMutation.mutate(); }}
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="px-6 pb-4 flex items-center gap-2">
        {editing ? (
          <Select value={type} onValueChange={setType}>
            <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="synopsis">Synopsis</SelectItem>
              <SelectItem value="outline">Outline</SelectItem>
              <SelectItem value="detailed">Detailed</SelectItem>
            </SelectContent>
          </Select>
        ) : (
          <>
            <Badge variant="secondary">{script.type}</Badge>
            <Badge variant="secondary">{script.origin === "ai" ? "AI Generated" : "Manual"}</Badge>
          </>
        )}
      </div>

      <div className="flex-1 px-6 pb-6">
        <Card className="h-full">
          <CardContent className="pt-4 h-full">
            {editing ? (
              <Textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="font-mono text-sm min-h-[400px] resize-none"
                placeholder="Write your script content..."
                data-testid="input-edit-script-content"
              />
            ) : (
              <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap font-serif" data-testid="text-script-content">
                {script.content || "No content yet. Click Edit to start writing."}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

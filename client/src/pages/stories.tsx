import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Plus, BookOpen, Search, ChevronRight } from "lucide-react";
import type { Story } from "@shared/schema";

const statusColors: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  "in-development": "bg-primary/10 text-primary",
  finished: "bg-green-500/10 text-green-700 dark:text-green-400",
};

const statusLabels: Record<string, string> = {
  draft: "Draft",
  "in-development": "In Development",
  finished: "Finished",
};

export default function StoriesPage() {
  const [, navigate] = useLocation();
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [premise, setPremise] = useState("");
  const [tone, setTone] = useState("");
  const [status, setStatus] = useState("draft");
  const { toast } = useToast();

  const { data: stories, isLoading } = useQuery<Story[]>({
    queryKey: ["/api/stories"],
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/stories", { title, premise, tone, status });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/stories"] });
      setOpen(false);
      setTitle("");
      setPremise("");
      setTone("");
      setStatus("draft");
      toast({ title: "Story created successfully" });
    },
    onError: (err: Error) => {
      toast({ title: "Failed to create story", description: err.message, variant: "destructive" });
    },
  });

  const filtered = stories?.filter(
    (s) =>
      s.title.toLowerCase().includes(search.toLowerCase()) ||
      s.premise?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between gap-4 flex-wrap p-6 pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" data-testid="text-stories-title">Stories</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage your creative stories and narratives
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-create-story">
              <Plus className="h-4 w-4 mr-2" />
              New Story
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Story</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label>Title</Label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter story title..."
                  data-testid="input-story-title"
                />
              </div>
              <div className="space-y-2">
                <Label>Premise</Label>
                <Textarea
                  value={premise}
                  onChange={(e) => setPremise(e.target.value)}
                  placeholder="What is this story about?"
                  className="resize-none"
                  rows={3}
                  data-testid="input-story-premise"
                />
              </div>
              <div className="flex gap-4">
                <div className="flex-1 space-y-2">
                  <Label>Tone / Genre</Label>
                  <Input
                    value={tone}
                    onChange={(e) => setTone(e.target.value)}
                    placeholder="e.g. Dark Fantasy, Sci-Fi Comedy"
                    data-testid="input-story-tone"
                  />
                </div>
                <div className="flex-1 space-y-2">
                  <Label>Status</Label>
                  <Select value={status} onValueChange={setStatus}>
                    <SelectTrigger data-testid="select-story-status">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="in-development">In Development</SelectItem>
                      <SelectItem value="finished">Finished</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button
                className="w-full"
                onClick={() => createMutation.mutate()}
                disabled={!title.trim() || createMutation.isPending}
                data-testid="button-submit-story"
              >
                {createMutation.isPending ? "Creating..." : "Create Story"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="px-6 pb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search stories..."
            className="pl-9"
            data-testid="input-search-stories"
          />
        </div>
      </div>

      <div className="flex-1 overflow-auto px-6 pb-6">
        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0 pb-2">
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-5 w-16" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-2/3" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filtered && filtered.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((story) => (
              <Card
                key={story.id}
                className="hover-elevate cursor-pointer group"
                onClick={() => navigate(`/stories/${story.id}`)}
                data-testid={`card-story-${story.id}`}
              >
                <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0 pb-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <BookOpen className="h-4 w-4 text-primary shrink-0" />
                    <h3 className="font-semibold text-sm truncate">{story.title}</h3>
                  </div>
                  <Badge variant="secondary" className={statusColors[story.status] || ""}>
                    {statusLabels[story.status] || story.status}
                  </Badge>
                </CardHeader>
                <CardContent>
                  {story.premise ? (
                    <p className="text-sm text-muted-foreground line-clamp-2">{story.premise}</p>
                  ) : (
                    <p className="text-sm text-muted-foreground italic">No premise yet</p>
                  )}
                  {story.tone && (
                    <p className="text-xs text-muted-foreground mt-2">{story.tone}</p>
                  )}
                  <div className="flex items-center justify-end mt-3">
                    <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted mb-4">
              <BookOpen className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold">No stories yet</h3>
            <p className="text-sm text-muted-foreground mt-1 max-w-sm">
              Create your first story to start building your creative universe.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

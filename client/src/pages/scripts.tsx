import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { FileText, Trash2, BookOpen } from "lucide-react";
import type { Script } from "@shared/schema";

interface ScriptWithStory extends Script {
  storyTitle?: string;
}

export default function ScriptsPage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const { data: scripts, isLoading } = useQuery<ScriptWithStory[]>({
    queryKey: ["/api/scripts"],
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/scripts/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/scripts"] });
      toast({ title: "Script deleted" });
    },
  });

  const typeColors: Record<string, string> = {
    synopsis: "bg-blue-500/10 text-blue-700 dark:text-blue-400",
    outline: "bg-amber-500/10 text-amber-700 dark:text-amber-400",
    detailed: "bg-green-500/10 text-green-700 dark:text-green-400",
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between gap-4 flex-wrap p-6 pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" data-testid="text-scripts-title">Scripts</h1>
          <p className="text-sm text-muted-foreground mt-1">
            All scripts across your stories
          </p>
        </div>
      </div>

      <div className="flex-1 overflow-auto px-6 pb-6">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardContent className="flex items-center gap-4 py-4">
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-5 w-16" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : scripts && scripts.length > 0 ? (
          <div className="space-y-3">
            {scripts.map((script) => (
              <Card
                key={script.id}
                className="hover-elevate cursor-pointer"
                onClick={() => navigate(`/scripts/${script.id}`)}
                data-testid={`card-script-${script.id}`}
              >
                <CardContent className="flex items-center justify-between gap-4 py-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <FileText className="h-5 w-5 text-primary shrink-0" />
                    <div className="min-w-0">
                      <p className="font-medium text-sm">{script.title}</p>
                      {script.storyTitle && (
                        <div className="flex items-center gap-1 mt-0.5">
                          <BookOpen className="h-3 w-3 text-muted-foreground" />
                          <p className="text-xs text-muted-foreground">{script.storyTitle}</p>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className={typeColors[script.type] || ""}>
                      {script.type}
                    </Badge>
                    <Badge variant="secondary">
                      {script.origin === "ai" ? "AI" : "Manual"}
                    </Badge>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (window.confirm("Delete this script?")) deleteMutation.mutate(script.id);
                      }}
                      data-testid={`button-delete-script-${script.id}`}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted mb-4">
              <FileText className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold">No scripts yet</h3>
            <p className="text-sm text-muted-foreground mt-1 max-w-sm">
              Scripts are created within stories. Go to a story to create one.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

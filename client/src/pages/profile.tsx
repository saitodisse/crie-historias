import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Settings, Plus, Save, Trash2, Check } from "lucide-react";
import type { CreativeProfile } from "@shared/schema";

const availableModels = [
  { value: "gpt-5.2", label: "GPT-5.2 (Most Capable)" },
  { value: "gpt-5.1", label: "GPT-5.1" },
  { value: "gpt-5", label: "GPT-5" },
  { value: "gpt-5-mini", label: "GPT-5 Mini (Cost Effective)" },
  { value: "gpt-5-nano", label: "GPT-5 Nano (Fastest)" },
];

export default function ProfilePage() {
  const [createOpen, setCreateOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState({
    name: "",
    model: "gpt-5-mini",
    temperature: "0.8",
    maxTokens: 2048,
    narrativeStyle: "",
    active: true,
  });
  const { toast } = useToast();

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
      toast({ title: "Profile created" });
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
      toast({ title: "Profile updated" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/profiles/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/profiles"] });
      toast({ title: "Profile deleted" });
    },
  });

  const setActiveMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("POST", `/api/profiles/${id}/activate`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/profiles"] });
      toast({ title: "Active profile updated" });
    },
  });

  const resetForm = () =>
    setForm({ name: "", model: "gpt-5-mini", temperature: "0.8", maxTokens: 2048, narrativeStyle: "", active: true });

  const startEditing = (p: CreativeProfile) => {
    setEditId(p.id);
    setForm({
      name: p.name,
      model: p.model,
      temperature: p.temperature,
      maxTokens: p.maxTokens,
      narrativeStyle: p.narrativeStyle || "",
      active: p.active,
    });
  };

  const ProfileForm = ({ isCreate }: { isCreate: boolean }) => (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Profile Name</Label>
        <Input
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          placeholder="e.g. Creative Writing, Technical, Concise"
          data-testid="input-profile-name"
        />
      </div>
      <div className="space-y-2">
        <Label>AI Model</Label>
        <Select value={form.model} onValueChange={(v) => setForm({ ...form, model: v })}>
          <SelectTrigger data-testid="select-profile-model">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {availableModels.map((m) => (
              <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label>Temperature: {form.temperature}</Label>
        <Slider
          value={[parseFloat(form.temperature)]}
          onValueChange={([v]) => setForm({ ...form, temperature: v.toFixed(1) })}
          min={0}
          max={2}
          step={0.1}
          data-testid="slider-temperature"
        />
        <p className="text-xs text-muted-foreground">
          Lower = more focused, Higher = more creative
        </p>
      </div>
      <div className="space-y-2">
        <Label>Max Tokens</Label>
        <Input
          type="number"
          value={form.maxTokens}
          onChange={(e) => setForm({ ...form, maxTokens: parseInt(e.target.value) || 2048 })}
          min={256}
          max={8192}
          data-testid="input-max-tokens"
        />
      </div>
      <div className="space-y-2">
        <Label>Narrative Style</Label>
        <Textarea
          value={form.narrativeStyle}
          onChange={(e) => setForm({ ...form, narrativeStyle: e.target.value })}
          placeholder="Describe desired writing style, tone, voice..."
          rows={3}
          className="resize-none"
          data-testid="input-narrative-style"
        />
      </div>
      <Button
        className="w-full"
        onClick={() => (isCreate ? createMutation.mutate() : updateMutation.mutate())}
        disabled={!form.name.trim() || (isCreate ? createMutation.isPending : updateMutation.isPending)}
        data-testid="button-submit-profile"
      >
        {isCreate
          ? createMutation.isPending ? "Creating..." : "Create Profile"
          : updateMutation.isPending ? "Saving..." : "Save Changes"}
      </Button>
    </div>
  );

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between gap-4 flex-wrap p-6 pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" data-testid="text-profile-title">Creative Profiles</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage AI model preferences and narrative styles
          </p>
        </div>
        <Dialog open={createOpen} onOpenChange={(o) => { setCreateOpen(o); if (!o) resetForm(); }}>
          <DialogTrigger asChild>
            <Button data-testid="button-create-profile">
              <Plus className="h-4 w-4 mr-2" />
              New Profile
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Creative Profile</DialogTitle>
            </DialogHeader>
            <ProfileForm isCreate />
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex-1 overflow-auto px-6 pb-6">
        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2">
            {[1, 2].map((i) => (
              <Card key={i}>
                <CardContent className="pt-4">
                  <Skeleton className="h-5 w-32 mb-2" />
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
                    <ProfileForm isCreate={false} />
                    <Button variant="ghost" className="w-full mt-2" onClick={() => { setEditId(null); resetForm(); }}>
                      Cancel
                    </Button>
                  </CardContent>
                ) : (
                  <>
                    <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0 pb-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <Settings className="h-4 w-4 text-primary shrink-0" />
                        <h3 className="font-semibold text-sm truncate">{profile.name}</h3>
                        {profile.active && (
                          <div className="flex items-center gap-1 text-primary text-xs">
                            <Check className="h-3 w-3" />
                            Active
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        {!profile.active && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setActiveMutation.mutate(profile.id)}
                            data-testid={`button-activate-profile-${profile.id}`}
                          >
                            Set Active
                          </Button>
                        )}
                        <Button size="icon" variant="ghost" onClick={() => startEditing(profile)}>
                          <Save className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => { if (window.confirm("Delete this profile?")) deleteMutation.mutate(profile.id); }}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between gap-2">
                          <span className="text-muted-foreground">Model</span>
                          <span className="font-mono text-xs">{profile.model}</span>
                        </div>
                        <div className="flex justify-between gap-2">
                          <span className="text-muted-foreground">Temperature</span>
                          <span>{profile.temperature}</span>
                        </div>
                        <div className="flex justify-between gap-2">
                          <span className="text-muted-foreground">Max Tokens</span>
                          <span>{profile.maxTokens}</span>
                        </div>
                        {profile.narrativeStyle && (
                          <div>
                            <span className="text-muted-foreground text-xs">Narrative Style</span>
                            <p className="text-xs mt-0.5">{profile.narrativeStyle}</p>
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
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted mb-4">
              <Settings className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold">No creative profiles yet</h3>
            <p className="text-sm text-muted-foreground mt-1 max-w-sm">
              Create a profile to save your preferred AI model settings and narrative style.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

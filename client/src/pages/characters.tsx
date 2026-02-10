import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Users, Search, ChevronRight } from "lucide-react";
import type { Character } from "@shared/schema";
import { useQueryState, parseAsString } from "nuqs";

export default function CharactersPage() {
  const [, navigate] = useLocation();
  const [search, setSearch] = useQueryState("q", parseAsString.withDefault(""));

  const { data: characters, isLoading } = useQuery<Character[]>({
    queryKey: ["/api/characters"],
  });

  const filtered = characters?.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.description?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1
            className="text-2xl font-bold tracking-tight"
            data-testid="text-characters-title"
          >
            Personagens
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Personagens que podem ser vinculados a qualquer Projeto
          </p>
        </div>
        <Button
          onClick={() => navigate("/characters/new")}
          data-testid="button-create-character"
        >
          <Plus className="mr-2 h-4 w-4" />
          Novo Personagem
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar personagens..."
          className="pl-9"
          data-testid="input-search-characters"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {isLoading ? (
          [1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="pt-4">
                <Skeleton className="mb-2 h-5 w-32" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="mt-1 h-4 w-2/3" />
              </CardContent>
            </Card>
          ))
        ) : filtered && filtered.length > 0 ? (
          filtered?.map((char) => (
            <Card
              key={char.id}
              className="hover-elevate group cursor-pointer"
              onClick={() => navigate(`/characters/${char.id}`)}
              data-testid={`card-character-${char.id}`}
            >
              <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0 pb-2">
                <div className="flex min-w-0 items-center gap-2">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
                    <Users className="h-4 w-4 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="truncate text-sm font-semibold">
                      {char.name}
                    </h3>
                    {!char.active && (
                      <Badge variant="secondary" className="text-xs">
                        Inativo
                      </Badge>
                    )}
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
              </CardHeader>
              <CardContent>
                {char.description ? (
                  <p className="line-clamp-2 text-sm text-muted-foreground">
                    {char.description}
                  </p>
                ) : (
                  <p className="text-sm italic text-muted-foreground">
                    Sem descrição
                  </p>
                )}
                {char.personality && (
                  <p className="mt-2 line-clamp-1 text-xs text-muted-foreground">
                    <span className="font-medium">Personalidade:</span>{" "}
                    {char.personality}
                  </p>
                )}
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="col-span-full flex flex-col items-center justify-center py-20 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
              <Users className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold">
              Nenhum personagem encontrado
            </h3>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">
              Crie personagens reutilizáveis que podem ser compartilhados entre
              múltiplos Projetos.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

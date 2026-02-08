import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import { Sparkles, Users, BookOpen, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface WizardLayoutProps {
  children: ReactNode;
  step: 1 | 2 | 3;
}

const steps = [
  { id: 1, label: "A Ideia", icon: Sparkles, path: "/wizard/idea" },
  { id: 2, label: "O Elenco", icon: Users, path: "/wizard/characters" },
  { id: 3, label: "O Roteiro", icon: BookOpen, path: "/wizard/script" },
];

export default function WizardLayout({ children, step }: WizardLayoutProps) {
  const [location] = useLocation();
  const progress = (step / steps.length) * 100;

  return (
    <div className="flex min-h-screen flex-col items-center bg-background p-4 md:p-8">
      <div className="w-full max-w-4xl space-y-8">
        {/* Header */}
        <div className="space-y-2 text-center">
          <h1 className="bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-4xl font-bold tracking-tight text-transparent">
            Crie sua História
          </h1>
          <p className="text-lg text-muted-foreground">
            Siga os passos para transformar sua ideia em um roteiro completo
            guiado por IA.
          </p>
        </div>

        {/* Progress Stepper */}
        <div className="relative pt-4">
          <div className="relative z-10 mb-8 flex justify-between">
            {steps.map((s) => {
              const Icon = s.icon;
              const isActive = s.id === step;
              const isCompleted = s.id < step;

              return (
                <div key={s.id} className="group flex flex-col items-center">
                  <div
                    className={cn(
                      "flex h-12 w-12 items-center justify-center rounded-full border-2 transition-all duration-300",
                      isActive
                        ? "scale-110 border-primary bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                        : isCompleted
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-muted-foreground/20 bg-muted text-muted-foreground"
                    )}
                  >
                    <Icon className="h-6 w-6" />
                  </div>
                  <span
                    className={cn(
                      "mt-2 text-sm font-medium transition-colors",
                      isActive ? "text-primary" : "text-muted-foreground"
                    )}
                  >
                    {s.label}
                  </span>
                </div>
              );
            })}
          </div>
          <Progress
            value={progress}
            className="absolute left-0 top-10 h-1 w-full bg-muted"
          />
        </div>

        {/* Content Area */}
        <Card className="border-none bg-card/50 shadow-xl backdrop-blur-sm">
          <CardContent className="p-6 md:p-10">{children}</CardContent>
        </Card>
      </div>
    </div>
  );
}

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
    <div className="flex min-h-screen w-full flex-col items-center bg-background p-2 md:p-8">
      <div className="w-full max-w-4xl space-y-6">
        {/* Header */}
        <div className="space-y-2 text-center">
          <h1 className="bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-3xl font-bold tracking-tight text-transparent md:text-4xl">
            Crie seu Projeto
          </h1>
          <p className="text-base text-muted-foreground md:text-lg">
            Siga os passos para transformar sua ideia em um roteiro completo
          </p>
        </div>

        {/* Progress Stepper */}
        <div className="relative pt-2">
          <div className="relative z-10 mb-6 flex justify-between px-2 md:px-0">
            {steps.map((s) => {
              const Icon = s.icon;
              const isActive = s.id === step;
              const isCompleted = s.id < step;

              return (
                <div key={s.id} className="group flex flex-col items-center">
                  <div
                    className={cn(
                      "flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all duration-300 md:h-12 md:w-12",
                      isActive
                        ? "scale-110 border-primary bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                        : isCompleted
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-muted-foreground/20 bg-muted text-muted-foreground"
                    )}
                  >
                    <Icon className="h-5 w-5 md:h-6 md:w-6" />
                  </div>
                  <span
                    className={cn(
                      "mt-2 text-xs font-medium transition-colors md:text-sm",
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
            className="absolute left-0 top-8 -z-10 h-1 w-full bg-muted md:top-10"
          />
        </div>

        {/* Content Area */}
        <Card className="border-none bg-card/50 shadow-xl backdrop-blur-sm">
          <CardContent className="p-4 md:p-10">{children}</CardContent>
        </Card>
      </div>
    </div>
  );
}

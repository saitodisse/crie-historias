import { Link } from "wouter";
import { SignUp } from "@clerk/clerk-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const hasClerkKey = Boolean(import.meta.env.VITE_CLERK_PUBLISHABLE_KEY);

export default function SignUpPage() {
  if (!hasClerkKey) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Autenticação não configurada</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Defina `VITE_CLERK_PUBLISHABLE_KEY` para habilitar cadastro com
              Clerk.
            </p>
            <Button asChild className="w-full">
              <Link href="/">Voltar</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <SignUp fallbackRedirectUrl="/" signInUrl="/sign-in" />
    </div>
  );
}

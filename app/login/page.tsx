import { LoginForm } from "./login-form";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-muted/40 px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="flex flex-col items-center gap-1 text-center">
          <span className="text-lg font-semibold tracking-tight">
            Reconnect <span className="text-primary">OS</span>
          </span>
          <p className="text-sm text-muted-foreground">O cérebro operacional da Reconnect.</p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Entrar</CardTitle>
            <CardDescription>Acesse sua conta para gerenciar clientes e campanhas.</CardDescription>
          </CardHeader>
          <CardContent>
            <LoginForm next={next ?? "/"} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

"use client";

import { MailCheck } from "lucide-react";
import { useActionState } from "react";

import { signupAction, type AuthActionState } from "../actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initialState: AuthActionState = { error: null };

export function SignupForm() {
  const [state, formAction, isPending] = useActionState(signupAction, initialState);

  if (state.checkEmail) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-lg border border-border bg-muted/40 px-4 py-6 text-center">
        <MailCheck className="size-6 text-primary" />
        <p className="font-medium">Verifique seu e-mail</p>
        <p className="text-sm text-muted-foreground">
          Enviamos um link de confirmação. Clique nele para ativar sua conta e depois volte para entrar.
        </p>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="name">Nome</Label>
        <Input id="name" name="name" placeholder="Seu nome" required autoComplete="name" />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="email">E-mail</Label>
        <Input id="email" name="email" type="email" placeholder="voce@email.com" required autoComplete="email" />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="password">Senha</Label>
        <Input id="password" name="password" type="password" required autoComplete="new-password" minLength={6} />
      </div>
      {state.error && <p className="text-sm text-destructive">{state.error}</p>}
      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? "Criando conta..." : "Criar conta"}
      </Button>
    </form>
  );
}

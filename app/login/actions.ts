"use server";

import { redirect } from "next/navigation";

import { loginSchema } from "@/lib/validations/auth";
import { createClient } from "@/lib/supabase/server";

export interface AuthActionState {
  error: string | null;
}

/** Only redirect to a same-origin relative path — never follow an open-redirect-style "next" value. */
function safeNextPath(next: FormDataEntryValue | null): string {
  if (typeof next === "string" && next.startsWith("/") && !next.startsWith("//")) return next;
  return "/";
}

export async function loginAction(_prevState: AuthActionState, formData: FormData): Promise<AuthActionState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) {
    console.error("[login] signInWithPassword falhou:", error.code, error.status, error.message);
    if (error.code === "email_not_confirmed") {
      return { error: "Confirme seu e-mail antes de entrar — verifique sua caixa de entrada." };
    }
    return { error: "E-mail ou senha incorretos." };
  }

  redirect(safeNextPath(formData.get("next")));
}

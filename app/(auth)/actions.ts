"use server";

import { redirect } from "next/navigation";

import { loginSchema, signupSchema } from "@/lib/validations/auth";
import { createClient } from "@/lib/supabase/server";

export interface AuthActionState {
  error: string | null;
  /** Set when signUp() succeeded but the project requires email confirmation before a session exists. */
  checkEmail?: boolean;
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
    if (error.code === "email_not_confirmed") {
      return { error: "Confirme seu e-mail antes de entrar — verifique sua caixa de entrada." };
    }
    return { error: "E-mail ou senha incorretos." };
  }

  redirect(safeNextPath(formData.get("next")));
}

export async function signupAction(_prevState: AuthActionState, formData: FormData): Promise<AuthActionState> {
  const parsed = signupSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: { data: { name: parsed.data.name } },
  });
  if (error) {
    return { error: error.message === "User already registered" ? "Este e-mail já está cadastrado." : "Não foi possível criar a conta." };
  }

  // The project may require confirming the e-mail before a session exists —
  // signUp() succeeds with a user but no session in that case.
  if (!data.session) {
    return { error: null, checkEmail: true };
  }

  redirect("/");
}

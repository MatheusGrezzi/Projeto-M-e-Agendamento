import Link from "next/link";

import { logoutAction } from "@/app/actions";
import { LogoMark } from "@/components/brand/logo-mark";
import { Button } from "@/components/ui/button";
import { companyConfig } from "@/lib/config/company-config";
import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/services/profiles-repository";

const NAV_LINKS = [
  { href: "/", label: "Início" },
  { href: "/servicos", label: "Serviços" },
  { href: "/sobre", label: "Sobre" },
  { href: "/contato", label: "Contato" },
];

export async function SiteHeader() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const profile = user ? await getProfile(supabase, user.id) : null;

  const accountHref = profile?.role === "admin" || profile?.role === "atendente" ? "/admin" : "/minha-conta";

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2">
          <LogoMark className="h-8" />
          <span className="sr-only">{companyConfig.name}</span>
        </Link>

        <nav className="hidden items-center gap-6 text-sm font-medium md:flex">
          {NAV_LINKS.map((link) => (
            <Link key={link.href} href={link.href} className="text-muted-foreground transition-colors hover:text-foreground">
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          {user ? (
            <>
              <Button render={<Link href={accountHref} />} variant="ghost">
                Minha conta
              </Button>
              <form action={logoutAction}>
                <Button type="submit" variant="ghost">
                  Sair
                </Button>
              </form>
            </>
          ) : (
            <Button render={<Link href="/login" />} variant="ghost">
              Entrar
            </Button>
          )}
          <Button render={<Link href="/agendar" />}>Agendar</Button>
        </div>
      </div>
    </header>
  );
}

import Link from "next/link";
import { redirect } from "next/navigation";

import { LogoMark } from "@/components/brand/logo-mark";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";

export default async function ClienteLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Belt-and-suspenders: proxy.ts already redirects unauthenticated requests
  // to /login for any non-public path, this is the last line of defense.
  if (!user) redirect("/login?next=/minha-conta");

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-border">
        <div className="mx-auto flex h-16 max-w-3xl items-center justify-between px-4">
          <Link href="/">
            <LogoMark className="h-8" />
          </Link>
          <Button render={<Link href="/" />} variant="outline" size="sm">
            Voltar ao site
          </Button>
        </div>
      </header>
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10">{children}</main>
    </div>
  );
}

import Link from "next/link";

import { LogoMark } from "@/components/brand/logo-mark";
import { companyConfig } from "@/lib/config/company-config";

export function SiteFooter() {
  const { contact, address } = companyConfig;
  const hasAddress = address.street && address.city;

  return (
    <footer className="border-t border-border bg-muted/30">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:grid-cols-3">
        <div className="space-y-3">
          <LogoMark className="h-8" />
          <p className="text-sm text-muted-foreground">{companyConfig.tagline}</p>
        </div>

        <div className="space-y-1.5 text-sm">
          <p className="font-medium">Contato</p>
          {contact.phone && <p className="text-muted-foreground">{contact.phone}</p>}
          {contact.email && <p className="text-muted-foreground">{contact.email}</p>}
          {contact.whatsapp && (
            <Link
              href={`https://wa.me/${contact.whatsapp}`}
              target="_blank"
              className="block text-primary hover:underline"
            >
              WhatsApp
            </Link>
          )}
          {contact.instagram && (
            <Link href={`https://instagram.com/${contact.instagram}`} target="_blank" className="block text-primary hover:underline">
              Instagram
            </Link>
          )}
        </div>

        <div className="space-y-1.5 text-sm">
          <p className="font-medium">Endereço</p>
          {hasAddress ? (
            <p className="text-muted-foreground">
              {address.street}, {address.number} — {address.neighborhood}
              <br />
              {address.city}/{address.state} — {address.zipCode}
            </p>
          ) : (
            <p className="text-muted-foreground">Endereço a definir.</p>
          )}
        </div>
      </div>
      <div className="border-t border-border px-4 py-4 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} {companyConfig.name}. Todos os direitos reservados.
      </div>
    </footer>
  );
}

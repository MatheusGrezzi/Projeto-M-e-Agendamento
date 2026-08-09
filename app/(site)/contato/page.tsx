import { getCompanySettings } from "@/lib/config/get-company-settings";
import { companyConfig } from "@/lib/config/company-config";
import { weekdayName } from "@/lib/format";

export default async function ContatoPage() {
  const { businessHours } = await getCompanySettings();
  const { contact, address } = companyConfig;
  const hasAddress = Boolean(address.street && address.city);

  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <h1 className="mb-8 text-3xl font-semibold tracking-tight">Contato</h1>

      <div className="grid gap-8 sm:grid-cols-2">
        <div className="space-y-1.5">
          <h2 className="font-medium">Fale conosco</h2>
          {contact.phone && <p className="text-muted-foreground">{contact.phone}</p>}
          {contact.email && <p className="text-muted-foreground">{contact.email}</p>}
          {contact.whatsapp && <p className="text-muted-foreground">WhatsApp: {contact.whatsapp}</p>}
        </div>

        <div className="space-y-1.5">
          <h2 className="font-medium">Endereço</h2>
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

      <div className="mt-8 space-y-1.5">
        <h2 className="font-medium">Horário de funcionamento</h2>
        <ul className="text-sm text-muted-foreground">
          {businessHours.map((entry) => (
            <li key={entry.weekday} className="flex justify-between border-b border-border py-1.5 last:border-0">
              <span>{weekdayName(entry.weekday)}</span>
              <span>{entry.open && entry.close ? `${entry.open} – ${entry.close}` : "Fechado"}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

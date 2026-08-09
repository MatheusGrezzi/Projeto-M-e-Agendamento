import { companyConfig } from "@/lib/config/company-config";

export default function SobrePage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <h1 className="mb-4 text-3xl font-semibold tracking-tight">Sobre {companyConfig.name}</h1>
      <p className="text-lg text-muted-foreground">{companyConfig.description}</p>
    </div>
  );
}

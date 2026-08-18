import { CompanyForm } from "./company-form";
import { GoalsForm } from "./goals-form";
import type { Client } from "@/types";

export function VisaoGeralTab({ client }: { client: Client }) {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <CompanyForm client={client} />
      <GoalsForm client={client} />
    </div>
  );
}

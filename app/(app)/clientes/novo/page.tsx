import { PageHeader } from "@/components/shared/page-header";
import { NewClientForm } from "./new-client-form";

export default function NewClientPage() {
  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="Novo cliente" description="Cadastre os dados da empresa. Os demais detalhes (segmentos, equipamentos, regiões...) são configurados na página do cliente." />
      <NewClientForm />
    </div>
  );
}

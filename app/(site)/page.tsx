import Image from "next/image";
import Link from "next/link";

import { ServiceCard } from "@/components/site/service-card";
import { TestimonialCard } from "@/components/site/testimonial-card";
import { Button } from "@/components/ui/button";
import { companyConfig } from "@/lib/config/company-config";
import { createClient } from "@/lib/supabase/server";
import { listServices } from "@/services/services-repository";
import { listTestimonials } from "@/services/testimonials-repository";

export default async function HomePage() {
  const supabase = await createClient();
  const [services, testimonials] = await Promise.all([listServices(supabase), listTestimonials(supabase)]);

  return (
    <div>
      <section className="relative">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-16 sm:py-24 lg:grid-cols-2">
          <div className="space-y-6">
            <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">{companyConfig.name}</h1>
            <p className="text-lg text-muted-foreground">{companyConfig.description}</p>
            <Button render={<Link href="/agendar" />} size="lg">
              Agendar horário
            </Button>
          </div>
          <div className="overflow-hidden rounded-xl border border-border">
            <Image
              src="/branding/hero.jpg"
              alt={companyConfig.name}
              width={1600}
              height={900}
              className="h-full w-full object-cover"
              priority
            />
          </div>
        </div>
      </section>

      {services.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 py-16">
          <div className="mb-8 flex items-end justify-between">
            <h2 className="text-2xl font-semibold tracking-tight">Serviços</h2>
            <Link href="/servicos" className="text-sm font-medium text-primary hover:underline">
              Ver todos
            </Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {services.slice(0, 6).map((service) => (
              <ServiceCard key={service.id} service={service} />
            ))}
          </div>
        </section>
      )}

      {testimonials.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 py-16">
          <h2 className="mb-8 text-2xl font-semibold tracking-tight">O que dizem nossos clientes</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {testimonials.slice(0, 6).map((testimonial) => (
              <TestimonialCard key={testimonial.id} testimonial={testimonial} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

import Image from "next/image";

import { companyConfig } from "@/lib/config/company-config";
import { cn } from "@/lib/utils";

/** Reads logo paths from company-config.ts — never hardcode a client's logo path elsewhere. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <span className={cn("relative inline-flex items-center", className)}>
      <Image
        src={companyConfig.logo.light}
        alt={companyConfig.name}
        width={160}
        height={40}
        className="h-8 w-auto dark:hidden"
        priority
      />
      <Image
        src={companyConfig.logo.dark}
        alt={companyConfig.name}
        width={160}
        height={40}
        className="hidden h-8 w-auto dark:block"
        priority
      />
    </span>
  );
}

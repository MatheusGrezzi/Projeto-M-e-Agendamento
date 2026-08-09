import Link from "next/link";

import { LogoMark } from "@/components/brand/logo-mark";
import { companyConfig } from "@/lib/config/company-config";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-muted/40 px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="flex flex-col items-center gap-3 text-center">
          <Link href="/">
            <LogoMark className="h-10" />
          </Link>
          <p className="text-sm text-muted-foreground">{companyConfig.tagline}</p>
        </div>
        {children}
      </div>
    </div>
  );
}

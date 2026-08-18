"use client";

import { useRouter } from "next/navigation";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { CampaignVersion } from "@/types";

export function VersionSelector({ campaignId, versions, currentVersionNumber }: { campaignId: string; versions: CampaignVersion[]; currentVersionNumber: number }) {
  const router = useRouter();

  if (versions.length <= 1) return null;

  return (
    <Select value={String(currentVersionNumber)} onValueChange={(v) => router.push(`/campanhas/${campaignId}?version=${v}`)}>
      <SelectTrigger className="w-44">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {versions.map((v) => (
          <SelectItem key={v.id} value={String(v.versionNumber)}>
            Versão {v.versionNumber} {v.generatorType === "ai" ? "· IA" : "· determinístico"}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

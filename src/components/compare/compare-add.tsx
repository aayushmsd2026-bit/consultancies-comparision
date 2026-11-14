"use client";

import { ConsultancySearch } from "@/components/consultancy/consultancy-search";
import { useRouter } from "@/i18n/navigation";
import { compareHref } from "@/lib/compare";

/** The search box on the compare page. Picking a consultancy adds it as a column. */
export function CompareAdd({ slugs }: { slugs: string[] }) {
  const router = useRouter();
  return (
    <ConsultancySearch
      onPick={(item) => {
        if (!slugs.includes(item.slug)) router.push(compareHref([...slugs, item.slug]), { scroll: false });
      }}
    />
  );
}

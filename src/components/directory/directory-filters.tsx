"use client";

import { useTransition, type FormEvent } from "react";
import { Search, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { FilterChip } from "@/components/ui/chip";
import { Select, TextField } from "@/components/ui/field";
import { usePathname, useRouter } from "@/i18n/navigation";
import { cn } from "@/lib/cn";

export type DirectoryFilterValues = {
  q: string;
  country: string;
  city: string;
  rating: string;
  sort: string;
  registered: boolean;
};

type Props = {
  values: DirectoryFilterValues;
  countries: { code: string; name: string }[];
  cities: string[];
  ratingLabels: { value: string; label: string }[];
};

/**
 * Search and filters for the directory. The address bar always holds the
 * current filters, so a filtered list can be shared or bookmarked.
 * Without JavaScript it still works as a normal form.
 */
export function DirectoryFilters({ values, countries, cities, ratingLabels }: Props) {
  const t = useTranslations("directory");
  const router = useRouter();
  const pathname = usePathname();
  const [pending, startTransition] = useTransition();

  function go(next: DirectoryFilterValues) {
    const params = new URLSearchParams();
    if (next.q.trim()) params.set("q", next.q.trim());
    if (next.country) params.set("country", next.country);
    if (next.city) params.set("city", next.city);
    if (next.rating) params.set("rating", next.rating);
    if (next.sort && next.sort !== "rating") params.set("sort", next.sort);
    if (next.registered) params.set("registered", "1");
    const query = params.toString();
    startTransition(() => router.push(query ? `${pathname}?${query}` : pathname, { scroll: false }));
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const q = String(new FormData(event.currentTarget).get("q") ?? "");
    go({ ...values, q });
  }

  const active = values.q || values.country || values.city || values.rating || values.registered;

  return (
    <form method="get" onSubmit={onSubmit} aria-busy={pending} className={cn("grid gap-4", pending && "opacity-70")}>
      <div className="flex items-end gap-2">
        <TextField
          key={values.q}
          name="q"
          type="search"
          label={t("nameLabel")}
          placeholder={t("namePlaceholder")}
          defaultValue={values.q}
          autoComplete="off"
          enterKeyHint="search"
          wrapperClassName="flex-1"
        />
        <Button type="submit" className="min-h-14 px-5" icon={<Search aria-hidden="true" className="size-5" />}>
          <span className="max-sm:sr-only">{t("apply")}</span>
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Select
          name="country"
          label={t("country")}
          value={values.country}
          onChange={(e) => go({ ...values, country: e.target.value })}
        >
          <option value="">{t("anyCountry")}</option>
          {countries.map((country) => (
            <option key={country.code} value={country.code}>
              {country.name}
            </option>
          ))}
        </Select>
        <Select name="city" label={t("city")} value={values.city} onChange={(e) => go({ ...values, city: e.target.value })}>
          <option value="">{t("anyCity")}</option>
          {cities.map((city) => (
            <option key={city} value={city}>
              {city}
            </option>
          ))}
        </Select>
        <Select
          name="rating"
          label={t("rating")}
          value={values.rating}
          onChange={(e) => go({ ...values, rating: e.target.value })}
        >
          <option value="">{t("anyRating")}</option>
          {ratingLabels.map((rating) => (
            <option key={rating.value} value={rating.value}>
              {rating.label}
            </option>
          ))}
        </Select>
        <Select name="sort" label={t("sort")} value={values.sort} onChange={(e) => go({ ...values, sort: e.target.value })}>
          <option value="rating">{t("sortRating")}</option>
          <option value="reviews">{t("sortReviews")}</option>
          <option value="name">{t("sortName")}</option>
        </Select>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <FilterChip selected={values.registered} onToggle={(registered) => go({ ...values, registered })}>
          {t("registered")}
        </FilterChip>
        {values.registered && <input type="hidden" name="registered" value="1" />}
        {active && (
          <Button
            variant="quiet"
            icon={<X aria-hidden="true" className="size-4" />}
            onClick={() => go({ q: "", country: "", city: "", rating: "", sort: values.sort, registered: false })}
          >
            {t("clear")}
          </Button>
        )}
      </div>
    </form>
  );
}

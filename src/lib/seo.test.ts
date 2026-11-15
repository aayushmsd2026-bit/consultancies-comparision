import { describe, expect, it } from "vitest";
import { consultancyJsonLd, pageMetadata } from "./seo";
import type { ConsultancyDetail } from "./types";

const base: ConsultancyDetail = {
  id: "c1",
  slug: "example-education",
  name: "Example Education Pvt. Ltd.",
  nameNe: null,
  city: "Kathmandu",
  cities: ["Kathmandu"],
  countries: ["AU"],
  registrationStatus: "registered",
  score: 4.23,
  reviewCount: 12,
  verifiedReviewCount: 5,
  registrationNumber: null,
  registrationSourceUrl: null,
  registrationCheckedAt: null,
  officialGrade: null,
  website: "https://example-education.example.com",
  phone: null,
  email: null,
  description: null,
  isClaimed: false,
  branches: [{ id: "b1", city: "Kathmandu", district: "Kathmandu", address: "10 Demo Marg", phone: null, isHeadOffice: true }],
};

describe("consultancyJsonLd", () => {
  it("describes the organization with a rating when there are enough reviews", () => {
    const data = consultancyJsonLd(base, "en");
    expect(data["@type"]).toBe("Organization");
    expect(data.aggregateRating).toEqual({
      "@type": "AggregateRating",
      ratingValue: 4.2,
      bestRating: 5,
      worstRating: 1,
      reviewCount: 12,
    });
    expect(data.address).toMatchObject({ addressLocality: "Kathmandu", addressCountry: "NP" });
  });

  it("claims no rating below 3 approved reviews", () => {
    // The data layer sets score to null in that case. See toCard in src/lib/data/mappers.ts.
    const data = consultancyJsonLd({ ...base, score: null, reviewCount: 2 }, "en");
    expect(data).not.toHaveProperty("aggregateRating");
  });
});

describe("pageMetadata", () => {
  it("links both languages and points the default to English", () => {
    const meta = pageMetadata({ locale: "ne", path: "/check", title: "T", description: "D" });
    expect(meta.alternates?.canonical).toMatch(/\/ne\/check$/);
    const languages = meta.alternates?.languages as Record<string, string>;
    expect(languages.en).toMatch(/\/en\/check$/);
    expect(languages.ne).toMatch(/\/ne\/check$/);
    expect(languages["x-default"]).toMatch(/\/en\/check$/);
  });

  it("writes the home page address without a trailing slash", () => {
    const meta = pageMetadata({ locale: "en", path: "/", title: "T", description: "D" });
    expect(meta.alternates?.canonical).toMatch(/\/en$/);
  });
});

import type { ConsultancySummary, PublicReview } from "@/lib/types";

/**
 * Made-up content for the styleguide. Every name here is fictional.
 */
export const sampleConsultancies: ConsultancySummary[] = [
  { slug: "example-education", name: "Example Education Pvt. Ltd.", nameNe: "उदाहरण एजुकेसन प्रा. लि.", city: "Kathmandu", registrationStatus: "registered", score: 4.2, reviewCount: 18 },
  { slug: "sample-study-abroad", name: "Sample Study Abroad Centre", nameNe: "नमुना स्टडी एब्रोड सेन्टर", city: "Pokhara", registrationStatus: "expired", score: 3.1, reviewCount: 7 },
  { slug: "demo-visa-guide", name: "Demo Visa Guide", nameNe: "डेमो भिसा गाइड", city: "Butwal", registrationStatus: "not_found", score: null, reviewCount: 1 },
  { slug: "placeholder-global", name: "Placeholder Global Education", nameNe: "प्लेसहोल्डर ग्लोबल एजुकेसन", city: "Chitwan", registrationStatus: "unknown", score: null, reviewCount: 0 },
];

const text = {
  en: {
    name: "S. K.",
    well: "They explained every document I needed and never promised a visa. My file was ready two weeks before the deadline.",
    badly: "The office was hard to reach by phone. I had to visit in person three times to get an update.",
    reply: "Thank you for the honest feedback. We have added a second phone line and now send weekly updates by message.",
  },
  ne: {
    name: "स. क.",
    well: "चाहिने सबै कागजातबारे राम्ररी बुझाइदिनुभयो र भिसा पक्का लाग्छ भनेर कहिल्यै भन्नुभएन। मेरो फाइल म्यादभन्दा दुई हप्ता अघि नै तयार भयो।",
    badly: "फोनमा सम्पर्क गर्न गाह्रो थियो। जानकारी लिन तीन पटक आफैँ अफिस जानुपर्‍यो।",
    reply: "इमानदार प्रतिक्रियाका लागि धन्यवाद। हामीले अर्को फोन लाइन थपेका छौँ र अब हरेक हप्ता सन्देशमार्फत जानकारी पठाउँछौँ।",
  },
} as const;

export function sampleReview(locale: string): PublicReview {
  const t = locale === "ne" ? text.ne : text.en;
  const consultancy = sampleConsultancies[0];
  return {
    id: "00000000-0000-4000-8000-000000000001",
    consultancySlug: consultancy.slug,
    consultancyName: locale === "ne" ? consultancy.nameNe! : consultancy.name,
    displayName: t.name,
    country: "AU",
    studyLevel: "bachelor",
    intakeYear: 2026,
    outcome: "visa_granted",
    ratings: { honesty: 5, communication: 3, documents: 5, speed: 4, afterVisa: null },
    overall: 4.3,
    wentWell: t.well,
    wentBadly: t.badly,
    wouldRecommend: true,
    isVerified: true,
    approvedAt: "2026-10-29T06:00:00Z",
    reply: { body: t.reply, createdAt: "2026-11-02T06:00:00Z" },
  };
}

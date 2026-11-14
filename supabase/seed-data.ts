/**
 * DEMO DATA. Everything in this file is made up.
 *
 * Rule of trust number 6: we never invent reviews, ratings or statistics about
 * real consultancies. So every consultancy here has an obviously fake name, and
 * every reviewer is a fictional person with an address that cannot receive mail.
 *
 * `npm run seed:build` turns this file into supabase/seed.sql.
 */
import { computeScores, emptyScore, type ConsultancyScore } from "../src/lib/ranking";
import type { Outcome, RegistrationStatus, StudyLevel } from "../src/lib/types";

// --- small helpers -----------------------------------------------------------

/** A repeatable "random" number generator, so the demo data is the same every time. */
function createRandom(seed: number) {
  let state = seed;
  return () => {
    state = (state * 1664525 + 1013904223) % 4294967296;
    return state / 4294967296;
  };
}

const id = (prefix: string, n: number) => `${prefix}0000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
const DAY = 24 * 60 * 60 * 1000;
/** A fixed "today" so the file does not change from day to day. */
const NOW = Date.parse("2026-11-01T06:00:00Z");

// --- consultancies -----------------------------------------------------------

export type SeedBranch = {
  id: string;
  consultancyId: string;
  city: string;
  district: string;
  address: string;
  phone: string | null;
  isHeadOffice: boolean;
};

export type SeedConsultancy = {
  id: string;
  slug: string;
  name: string;
  nameNe: string;
  listingStatus: "approved" | "pending";
  registrationStatus: RegistrationStatus;
  registrationNumber: string | null;
  registrationSourceUrl: string | null;
  registrationCheckedAt: string | null;
  website: string | null;
  description: string;
  countries: string[];
  /** How many demo reviews to make, and how good they tend to be (1 to 5). */
  reviewPlan: { count: number; quality: number };
};

const SOURCE = "https://example.com/official-list";
const checked = (daysAgo: number) => new Date(NOW - daysAgo * DAY).toISOString();

const consultancyRows: [string, string, string, RegistrationStatus, string[], number, number, [string, string][]][] = [
  // slug, name, Nepali name, registration, countries, review count, quality, branches [city, district]
  ["example-education", "Example Education Pvt. Ltd.", "उदाहरण एजुकेसन प्रा. लि.", "registered", ["AU", "GB", "CA"], 12, 4.4, [["Kathmandu", "Kathmandu"], ["Pokhara", "Kaski"], ["Butwal", "Rupandehi"]]],
  ["sample-study-abroad", "Sample Study Abroad Centre", "नमुना स्टडी एब्रोड सेन्टर", "registered", ["JP", "KR"], 10, 3.9, [["Kathmandu", "Kathmandu"], ["Chitwan", "Chitwan"]]],
  ["demo-visa-guide", "Demo Visa Guide", "डेमो भिसा गाइड", "registered", ["AU", "NZ"], 8, 3.2, [["Lalitpur", "Lalitpur"]]],
  ["placeholder-global", "Placeholder Global Education", "प्लेसहोल्डर ग्लोबल एजुकेसन", "expired", ["US", "CA"], 7, 2.6, [["Kathmandu", "Kathmandu"], ["Biratnagar", "Morang"]]],
  ["fictional-futures", "Fictional Futures Consultancy", "फिक्सनल फ्युचर्स कन्सल्टेन्सी", "registered", ["JP"], 6, 4.6, [["Pokhara", "Kaski"]]],
  ["made-up-scholars", "Made-up Scholars Hub", "मेड-अप स्कलर्स हब", "not_found", ["AU", "GB", "US"], 5, 1.9, [["Kathmandu", "Kathmandu"]]],
  ["test-case-education", "Test Case Education", "टेस्ट केस एजुकेसन", "registered", ["GB", "DE", "FI"], 4, 4.0, [["Butwal", "Rupandehi"], ["Kathmandu", "Kathmandu"]]],
  ["imaginary-pathways", "Imaginary Pathways", "इम्याजिनरी पाथवेज", "registered", ["KR", "JP"], 3, 3.5, [["Dharan", "Sunsari"]]],
  ["lorem-ipsum-overseas", "Lorem Ipsum Overseas", "लोरेम इप्सम ओभरसिज", "unknown", ["CA", "US"], 3, 3.0, [["Chitwan", "Chitwan"]]],
  ["not-a-real-consultancy", "Not-a-Real Consultancy", "नट-अ-रियल कन्सल्टेन्सी", "registered", ["AU"], 2, 5.0, [["Kathmandu", "Kathmandu"]]],
  ["mock-admissions-nepal", "Mock Admissions Nepal", "मक एडमिसन्स नेपाल", "expired", ["DK", "FI", "DE"], 1, 4.0, [["Lalitpur", "Lalitpur"]]],
  ["pretend-abroad-services", "Pretend Abroad Services", "प्रिटेन्ड एब्रोड सर्भिसेज", "not_found", ["AE", "CY", "MT"], 0, 3.0, [["Biratnagar", "Morang"]]],
];

export const consultancies: SeedConsultancy[] = consultancyRows.map(
  ([slug, name, nameNe, registrationStatus, countries, count, quality], i) => ({
    id: id("c", i + 1),
    slug,
    name,
    nameNe,
    listingStatus: "approved",
    registrationStatus,
    registrationNumber: registrationStatus === "registered" || registrationStatus === "expired" ? `DEMO-${1000 + i}` : null,
    registrationSourceUrl: registrationStatus === "unknown" ? null : SOURCE,
    registrationCheckedAt: registrationStatus === "unknown" ? null : checked(3 + i * 2),
    website: `https://${slug}.example.com`,
    description: `${name} is a fictional consultancy used as demo data. It does not exist.`,
    countries,
    reviewPlan: { count, quality },
  }),
);

/** One consultancy suggested by a reviewer and still waiting for the admin. Hidden from the public. */
export const suggestedConsultancy: SeedConsultancy = {
  id: id("c", 99),
  slug: "suggested-example-institute",
  name: "Suggested Example Institute",
  nameNe: "सजेस्टेड एग्जाम्पल इन्स्टिच्युट",
  listingStatus: "pending",
  registrationStatus: "unknown",
  registrationNumber: null,
  registrationSourceUrl: null,
  registrationCheckedAt: null,
  website: null,
  description: "A fictional consultancy suggested by a demo reviewer.",
  countries: ["AU"],
  reviewPlan: { count: 0, quality: 3 },
};

export const branches: SeedBranch[] = consultancyRows.flatMap(([, , , , , , , places], i) =>
  places.map(([city, district], j) => ({
    id: id("b", i * 10 + j + 1),
    consultancyId: id("c", i + 1),
    city,
    district,
    address: `${10 + i + j} Demo Marg, ${city}`,
    phone: null,
    isHeadOffice: j === 0,
  })),
);

// --- reviewers ---------------------------------------------------------------

const firstNames = ["Aasha", "Bibek", "Chandra", "Dipa", "Eka", "Gita", "Hari", "Indira", "Jeevan", "Kamala", "Laxmi", "Manoj", "Nisha", "Om", "Puja", "Rajan", "Sarita", "Tara", "Uma", "Yubraj"];
const lastNames = ["Sample", "Demo", "Example", "Test"];

export type SeedUser = { id: string; email: string; displayName: string };

export const users: SeedUser[] = firstNames.map((first, i) => ({
  id: id("d", i + 1),
  // ".invalid" addresses can never receive mail.
  email: `demo-reviewer-${String(i + 1).padStart(2, "0")}@example.invalid`,
  displayName: `${first} ${lastNames[i % lastNames.length]}`,
}));

// --- reviews -----------------------------------------------------------------

const wentWell = [
  "They explained every document I needed and never promised a visa. My file was ready two weeks before the deadline.",
  "The counsellor was honest about my chances and suggested a cheaper college that fit my budget.",
  "All fees were written on one paper before I paid anything. There were no surprises later.",
  "They checked my statement of purpose three times and gave useful comments each time.",
  "Replies came the same day, even on Saturdays. I always knew what the next step was.",
  "They gave me a checklist on the first day. It made the bank and police documents easy.",
  "The mock interview was very close to the real one. I felt ready.",
  "They told me clearly which costs go to the college and which go to them.",
  "After I got my visa they still helped me find a room and explained the airport process.",
  "The staff were polite and patient with my parents and answered all their questions in Nepali.",
  "कागजातको सूची पहिलो दिनमै दिनुभयो। कुन पैसा कलेजलाई र कुन कन्सल्टेन्सीलाई जान्छ भनेर प्रस्ट बताउनुभयो।",
  "मेरो अभिभावकलाई सबै कुरा नेपालीमा राम्ररी बुझाइदिनुभयो। भिसा पक्का हुन्छ भनेर कहिल्यै भन्नुभएन।",
];

const wentBadly = [
  "The office was hard to reach by phone. I had to visit in person three times to get an update.",
  "My file sat for almost a month before anyone looked at it.",
  "They asked for an extra document fee that was not mentioned at the start.",
  "My counsellor changed twice, and each time I had to explain my case again.",
  "They pushed one college strongly. I felt they did not want to show me other options.",
  "I was told the offer letter would come in two weeks. It took seven.",
  "Nobody told me my application had been refused. I found out from the college email.",
  "After the visa came, they stopped answering my messages.",
  "The receipt I got did not match the amount I paid. It took a week to get it corrected.",
  "Nothing serious. The waiting room is small and gets very crowded in the afternoon.",
  "फोन उठाउनुहुन्न थियो। जानकारी लिन पटक-पटक अफिस नै जानुपर्‍यो।",
  "सुरुमा नभनिएको थप शुल्क पछि मागियो। रसिद पाउन पनि धेरै दिन लाग्यो।",
];

const replyTexts = [
  "Thank you for the honest feedback. We have added a second phone line and now send weekly updates by message.",
  "We are sorry about the delay. Your counsellor has left the company. We now assign two counsellors to every file.",
  "Thank you for your kind words. We wish you the best with your studies.",
];

const levels: StudyLevel[] = ["bachelor", "master", "diploma", "language", "bachelor", "master", "phd", "other"];

export type SeedReview = {
  id: string;
  consultancyId: string;
  branchId: string | null;
  userId: string;
  status: "pending" | "approved" | "rejected" | "needs_proof";
  country: string;
  studyLevel: StudyLevel;
  intakeYear: number;
  outcome: Outcome;
  serviceChargeNpr: number | null;
  extraCostsNpr: number | null;
  extraCostsNote: string | null;
  ratings: { honesty: number; communication: number; documents: number; speed: number; afterVisa: number | null };
  wentWell: string;
  wentBadly: string;
  wouldRecommend: boolean;
  isVerified: boolean;
  invitedByConsultancy: boolean;
  displayNameChoice: "name" | "initials" | "anonymous";
  rejectionReason: string | null;
  createdAt: string;
  approvedAt: string | null;
};

export type SeedReply = { id: string; reviewId: string; consultancyId: string; body: string; createdAt: string };
export type SeedReport = { id: string; reviewId: string; reason: "fake" | "abusive" | "personal_info" | "not_first_hand" | "other"; details: string };

function buildReviews(): SeedReview[] {
  const random = createRandom(2083);
  const pick = <T,>(list: readonly T[]) => list[Math.floor(random() * list.length)];
  const clamp = (n: number) => Math.min(5, Math.max(1, Math.round(n)));
  const list: SeedReview[] = [];
  let userCursor = 0;

  for (const consultancy of consultancies) {
    const ownBranches = branches.filter((b) => b.consultancyId === consultancy.id);
    for (let n = 0; n < consultancy.reviewPlan.count; n++) {
      const quality = consultancy.reviewPlan.quality + (random() - 0.5) * 2.2;
      const rate = () => clamp(quality + (random() - 0.5) * 1.6);
      const ratings = {
        honesty: rate(),
        communication: rate(),
        documents: rate(),
        speed: rate(),
        afterVisa: random() < 0.6 ? rate() : null,
      };
      const good = quality >= 3.4;
      const outcome: Outcome = good
        ? random() < 0.8 ? "visa_granted" : "in_process"
        : pick<Outcome>(["visa_refused", "withdrew", "visa_granted", "in_process"]);
      const daysAgo = Math.floor(random() * 330) + 5;
      const createdAt = new Date(NOW - daysAgo * DAY).toISOString();
      const hasCharge = random() < 0.75;

      list.push({
        id: id("e", list.length + 1),
        consultancyId: consultancy.id,
        branchId: random() < 0.7 ? pick(ownBranches).id : null,
        // Walking through the reviewers in order guarantees one review per person per consultancy.
        userId: users[userCursor++ % users.length].id,
        status: "approved",
        country: pick(consultancy.countries),
        studyLevel: pick(levels),
        intakeYear: pick([2024, 2025, 2025, 2026, 2026, 2027]),
        outcome,
        serviceChargeNpr: hasCharge ? Math.round((15000 + random() * 85000) / 5000) * 5000 : null,
        extraCostsNpr: hasCharge && random() < 0.4 ? Math.round((2000 + random() * 28000) / 1000) * 1000 : null,
        extraCostsNote: null,
        ratings,
        wentWell: pick(wentWell),
        wentBadly: pick(wentBadly),
        wouldRecommend: good,
        isVerified: random() < 0.45,
        invitedByConsultancy: random() < 0.1,
        displayNameChoice: pick(["name", "initials", "initials", "anonymous"] as const),
        rejectionReason: null,
        createdAt,
        approvedAt: new Date(Date.parse(createdAt) + 2 * DAY).toISOString(),
      });
    }
  }

  for (const review of list) {
    if (review.extraCostsNpr) review.extraCostsNote = "Courier and document translation.";
  }

  // A few reviews that are not public, so the admin queue has something to show.
  const waiting = (index: number, changes: Partial<SeedReview>) => {
    Object.assign(list[index], { status: "pending", approvedAt: null, isVerified: false, ...changes });
    list[index].createdAt = new Date(NOW - (index % 3) * DAY - 3600_000).toISOString();
  };
  waiting(3, {});
  waiting(15, {});
  // This one should raise the "very short text with a 1 rating" flag.
  waiting(27, { wentWell: "Nothing.", wentBadly: "Bad.", ratings: { honesty: 1, communication: 1, documents: 1, speed: 1, afterVisa: null }, wouldRecommend: false });
  // This one should raise the "contains a phone number" flag. The number is fake.
  waiting(34, { wentBadly: "Call me on 9800000000 and I will tell you everything about Mr. Demo Person." });
  waiting(41, { status: "needs_proof" });
  waiting(48, { status: "rejected", rejectionReason: "Not a first-hand experience." });

  return list;
}

export const reviews: SeedReview[] = buildReviews();

const approved = reviews.filter((review) => review.status === "approved");

export const replies: SeedReply[] = [approved[0], approved[12], approved[20]].map((review, i) => ({
  id: id("f", i + 1),
  reviewId: review.id,
  consultancyId: review.consultancyId,
  body: replyTexts[i],
  createdAt: new Date(Date.parse(review.approvedAt!) + 4 * DAY).toISOString(),
}));

export const reports: SeedReport[] = [
  { id: id("a", 1), reviewId: approved[5].id, reason: "not_first_hand", details: "This looks like it was written by staff." },
  { id: id("a", 2), reviewId: approved[30].id, reason: "personal_info", details: "The review names a staff member." },
];

// --- scores, from the one ranking formula -----------------------------------

const overall = (r: SeedReview["ratings"]) => {
  const given = [r.honesty, r.communication, r.documents, r.speed, r.afterVisa].filter((v): v is number => v !== null);
  // Rounded to 2 decimals, the same as the database column.
  return Math.round((given.reduce((a, b) => a + b, 0) / given.length) * 100) / 100;
};

export const reviewOverall = (review: SeedReview) => overall(review.ratings);

const computed = computeScores(
  approved.map((review) => ({
    consultancyId: review.consultancyId,
    overall: overall(review.ratings),
    isVerified: review.isVerified,
  })),
);

export const siteAverage = computed.siteAverage;

export function scoreOf(consultancyId: string): ConsultancyScore {
  return computed.byConsultancy.get(consultancyId) ?? emptyScore(computed.siteAverage);
}

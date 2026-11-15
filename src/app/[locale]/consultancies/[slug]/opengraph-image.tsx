import { getConsultancy } from "@/lib/data/public";
import { consultancyOgImage, OG_SIZE, siteOgImage } from "@/lib/og";

export const alt = "Consultancy name, score and registration status";
export const size = OG_SIZE;
export const contentType = "image/png";

/** One picture per consultancy: its name, its score and its registration badge. */
export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  // English names: the image font has no Devanagari letters.
  const consultancy = await getConsultancy(slug, "en");
  if (!consultancy) return siteOgImage();
  return consultancyOgImage({
    name: consultancy.name,
    city: consultancy.city,
    score: consultancy.score,
    reviewCount: consultancy.reviewCount,
    registrationStatus: consultancy.registrationStatus,
  });
}

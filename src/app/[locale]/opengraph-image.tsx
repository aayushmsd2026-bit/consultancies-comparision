import { OG_SIZE, siteOgImage } from "@/lib/og";

export const alt = "Check before you pay. Honest reviews of study-abroad consultancies in Nepal.";
export const size = OG_SIZE;
export const contentType = "image/png";

export default function Image() {
  return siteOgImage();
}

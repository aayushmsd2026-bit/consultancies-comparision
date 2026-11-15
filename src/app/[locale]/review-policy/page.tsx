import { TrustPageView, trustMetadata } from "@/components/content/trust-page";

export const generateMetadata = () => trustMetadata("review-policy");

export default function Page() {
  return <TrustPageView page="review-policy" />;
}

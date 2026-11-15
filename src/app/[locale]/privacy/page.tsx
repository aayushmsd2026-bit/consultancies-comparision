import { TrustPageView, trustMetadata } from "@/components/content/trust-page";

export const generateMetadata = () => trustMetadata("privacy");

export default function Page() {
  return <TrustPageView page="privacy" />;
}

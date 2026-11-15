import { TrustPageView, trustMetadata } from "@/components/content/trust-page";

export const generateMetadata = () => trustMetadata("terms");

export default function Page() {
  return <TrustPageView page="terms" />;
}

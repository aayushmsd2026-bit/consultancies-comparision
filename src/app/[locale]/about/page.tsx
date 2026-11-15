import { TrustPageView, trustMetadata } from "@/components/content/trust-page";

export const generateMetadata = () => trustMetadata("about");

export default function Page() {
  return <TrustPageView page="about" />;
}

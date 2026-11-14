import type { ReactNode } from "react";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";

/**
 * Text groups every page sends to the browser for its interactive parts.
 * Everything else stays on the server, which keeps pages light on slow data.
 */
export const BASE_CLIENT_NAMESPACES = ["ui", "nav", "language", "countries"] as const;

type Namespace = keyof Awaited<ReturnType<typeof getMessages>>;

/**
 * Gives interactive parts of one page the extra text they need.
 * Example: <ClientMessages namespaces={["directory"]}> ... </ClientMessages>
 */
export async function ClientMessages({
  namespaces = [],
  children,
}: {
  namespaces?: Namespace[];
  children: ReactNode;
}) {
  const messages = await getMessages();
  const picked = Object.fromEntries(
    [...BASE_CLIENT_NAMESPACES, ...namespaces].map((namespace) => [namespace, messages[namespace]]),
  );
  return <NextIntlClientProvider messages={picked}>{children}</NextIntlClientProvider>;
}

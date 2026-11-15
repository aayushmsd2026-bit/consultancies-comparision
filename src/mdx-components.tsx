import type { MDXComponents } from "mdx/types";
import { Callout, Checklist, PullQuote } from "@/components/content/blocks";
import { Link } from "@/i18n/navigation";

const linkClass = "font-semibold text-signature-strong underline decoration-2 underline-offset-4";

/**
 * How the plain parts of a guide or trust page look: headings, paragraphs,
 * lists, links. Editorial: big, generous text, about 65 characters wide.
 * These three blocks can be used in any .mdx file without importing them:
 *   <PullQuote>, <Callout>, <Checklist>
 */
const components: MDXComponents = {
  h2: (props) => <h2 className="mt-14 mb-4 max-w-prose text-title" {...props} />,
  h3: (props) => <h3 className="mt-10 mb-3 max-w-prose text-heading" {...props} />,
  p: (props) => <p className="my-5 max-w-prose text-lead" {...props} />,
  ul: (props) => <ul className="my-5 max-w-prose list-disc space-y-3 pl-6 text-lead marker:text-signature-graphic" {...props} />,
  ol: (props) => (
    <ol className="my-5 max-w-prose list-decimal space-y-3 pl-6 text-lead marker:font-semibold marker:text-signature-graphic" {...props} />
  ),
  li: (props) => <li className="pl-1" {...props} />,
  a: ({ href = "", children }) =>
    // Links inside the site keep the visitor's language. Other links open in a new tab.
    href.startsWith("/") ? (
      <Link href={href} className={linkClass}>
        {children}
      </Link>
    ) : (
      <a href={href} target="_blank" rel="noopener noreferrer" className={linkClass}>
        {children}
      </a>
    ),
  strong: (props) => <strong className="font-semibold" {...props} />,
  blockquote: (props) => <PullQuote {...props} />,
  hr: () => <hr className="my-12 max-w-prose border-line" />,
  table: (props) => (
    <div className="my-6 max-w-prose overflow-x-auto">
      <table className="w-full text-left text-body" {...props} />
    </div>
  ),
  th: (props) => <th className="border-b-2 border-line-strong py-2 pr-4 font-semibold" {...props} />,
  td: (props) => <td className="border-b border-line py-2 pr-4 align-top" {...props} />,
  code: (props) => <code className="tabular rounded bg-paper-sunk px-1.5 py-0.5 text-body" {...props} />,
  PullQuote,
  Callout,
  Checklist,
};

export function useMDXComponents(): MDXComponents {
  return components;
}

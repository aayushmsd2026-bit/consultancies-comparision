// Every guide and trust page (.mdx) exports a "meta" object next to its text.
declare module "*.mdx" {
  export const meta: import("@/lib/content").ContentMeta;
}

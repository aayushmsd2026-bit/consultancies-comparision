/** Names of the cache groups. Refresh a tag and every page that used it is rebuilt. */
export const TAGS = {
  consultancies: "consultancies",
  reviews: "reviews",
  consultancy: (slug: string) => `consultancy:${slug}`,
} as const;

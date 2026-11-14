import { describe, expect, it } from "vitest";
import en from "../../messages/en.json";
import ne from "../../messages/ne.json";

type Tree = { [key: string]: string | Tree };

function keysOf(tree: Tree, prefix = ""): string[] {
  return Object.entries(tree).flatMap(([key, value]) =>
    typeof value === "string"
      ? [`${prefix}${key}`]
      : keysOf(value, `${prefix}${key}.`),
  );
}

function placeholdersOf(text: string): string[] {
  // {name} or {name, plural, ...}. Text inside plural branches like {No results} is skipped.
  const names = [...text.matchAll(/\{(\w+)\s*[,}]/g)].map((m) => m[1]);
  return [...new Set(names)].sort();
}

function lookup(tree: Tree, path: string): string {
  return path.split(".").reduce<string | Tree>((node, part) => {
    return (node as Tree)[part];
  }, tree) as string;
}

describe("message files", () => {
  // The admin area is used by the owner only and is English only.
  const { admin: adminMessages, ...publicEn } = en;
  const enKeys = keysOf(publicEn).sort();
  const neKeys = keysOf(ne).sort();

  it("the admin area has its own English text", () => {
    expect(keysOf(adminMessages).length).toBeGreaterThan(50);
    expect(ne).not.toHaveProperty("admin");
  });

  it("English and Nepali have exactly the same keys", () => {
    expect(neKeys).toEqual(enKeys);
  });

  it("no message is empty", () => {
    for (const key of enKeys) {
      expect(lookup(en, key).trim(), `en: ${key}`).not.toBe("");
      expect(lookup(ne, key).trim(), `ne: ${key}`).not.toBe("");
    }
  });

  it("each message uses the same placeholders in both languages", () => {
    for (const key of enKeys) {
      expect(placeholdersOf(lookup(ne, key)), key).toEqual(
        placeholdersOf(lookup(en, key)),
      );
    }
  });

  it("the interface never shouts (no exclamation marks)", () => {
    for (const key of enKeys) {
      expect(lookup(en, key), `en: ${key}`).not.toContain("!");
      expect(lookup(ne, key), `ne: ${key}`).not.toContain("!");
    }
  });
});

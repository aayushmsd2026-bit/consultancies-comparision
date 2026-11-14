/**
 * Lists Sanzo Wada colour combinations that could work as the brand palette.
 *
 * Run:  npx tsx scripts/palette-explore.ts          (short list of the best candidates)
 *       npx tsx scripts/palette-explore.ts --all    (every 3- and 4-colour combination)
 *       npx tsx scripts/palette-explore.ts 251      (details of one combination)
 *
 * Source: the open dataset "dictionary-of-colour-combinations" (MIT), which holds the
 * 348 combinations and 159 named colours of Wada's "A Dictionary of Color Combinations", Vol. 1.
 */
import colors from "dictionary-of-colour-combinations";

type WadaColor = {
  name: string;
  combinations: number[];
  rgb: [number, number, number];
  lab: [number, number, number];
  hex: string;
};

const all = colors as WadaColor[];

/** WCAG relative luminance of an sRGB colour. */
function luminance([r, g, b]: [number, number, number]): number {
  const lin = (v: number) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

function contrast(a: WadaColor, b: WadaColor): number {
  const [hi, lo] = [luminance(a.rgb), luminance(b.rgb)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

const chroma = (c: WadaColor) => Math.hypot(c.lab[1], c.lab[2]);
const lightness = (c: WadaColor) => c.lab[0];

// Group the colours by combination number.
const combos = new Map<number, WadaColor[]>();
for (const color of all) {
  for (const id of color.combinations) {
    combos.set(id, [...(combos.get(id) ?? []), color]);
  }
}

type Candidate = {
  id: number;
  ink: WadaColor;
  paper: WadaColor;
  signature: WadaColor;
  spark?: WadaColor;
  score: number;
};

/** Try every way of giving the roles to the colours of one combination. Keep the best. */
function bestRoles(id: number, members: WadaColor[]): Candidate | null {
  let best: Candidate | null = null;
  for (const ink of members) {
    for (const paper of members) {
      for (const signature of members) {
        if (new Set([ink, paper, signature]).size < 3) continue;
        const spark = members.find((m) => m !== ink && m !== paper && m !== signature);

        // Hard rules from DESIGN.md.
        if (lightness(ink) > 32) continue; // ink is very deep
        if (lightness(paper) < 86 || chroma(paper) > 26) continue; // paper is a soft off-white
        if (paper.lab[2] < 0) continue; // paper is warm, not bluish
        if (contrast(ink, paper) < 7) continue; // body text is comfortable
        if (chroma(signature) < 38) continue; // signature is strong

        // Soft preferences.
        let score = 0;
        score += Math.min(contrast(ink, paper), 14); // more contrast is better
        score += chroma(signature) / 10; // a stronger signature is better
        score += chroma(ink) > 8 ? 2 : 0; // ink has a hue, it is not grey
        // The signature must carry either dark or light text.
        score += Math.max(contrast(signature, ink), contrast(signature, paper)) >= 4.5 ? 3 : 0;
        if (spark) score += lightness(spark) > 70 && chroma(spark) > 35 ? 3 : 0;

        if (!best || score > best.score) best = { id, ink, paper, signature, spark, score };
      }
    }
  }
  return best;
}

function describe(c: WadaColor): string {
  return `${c.name.padEnd(26)} ${c.hex}  L${lightness(c).toFixed(0).padStart(3)} C${chroma(c).toFixed(0).padStart(3)}`;
}

function printCombo(id: number): void {
  const members = combos.get(id);
  if (!members) return console.log(`No combination ${id}.`);
  console.log(`\nCombination ${id} (${members.length} colours)`);
  for (const m of members) console.log(`  ${describe(m)}`);
  const c = bestRoles(id, members);
  if (!c) return console.log("  Does not fit the ink / paper / signature roles.");
  console.log(`  ink        ${c.ink.name}`);
  console.log(`  paper      ${c.paper.name}`);
  console.log(`  signature  ${c.signature.name}`);
  if (c.spark) console.log(`  spark      ${c.spark.name}`);
  console.log(`  contrast   ink on paper ${contrast(c.ink, c.paper).toFixed(1)}:1,`,
    `paper on signature ${contrast(c.paper, c.signature).toFixed(1)}:1,`,
    `ink on signature ${contrast(c.ink, c.signature).toFixed(1)}:1`);
}

const arg = process.argv[2];
const sized = [...combos.entries()].filter(([, m]) => m.length === 3 || m.length === 4);

if (arg === "--all") {
  for (const [id, members] of sized.sort((a, b) => a[0] - b[0])) {
    console.log(`${String(id).padStart(3)}  ${members.map((m) => `${m.name} ${m.hex}`).join(" | ")}`);
  }
  console.log(`\n${sized.length} combinations with 3 or 4 colours.`);
} else if (arg && /^\d+$/.test(arg)) {
  printCombo(Number(arg));
} else {
  const ranked = sized
    .map(([id, members]) => bestRoles(id, members))
    .filter((c): c is Candidate => c !== null)
    .sort((a, b) => b.score - a.score);
  console.log(`${sized.length} combinations with 3 or 4 colours. ${ranked.length} fit the roles.`);
  for (const c of ranked.slice(0, 12)) printCombo(c.id);
}

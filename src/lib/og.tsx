import { ImageResponse } from "next/og";
import { PALETTE } from "@/config/palette";
import { SITE_NAME } from "@/config/site";
import type { RegistrationStatus } from "@/lib/types";

/**
 * The picture shown when a link to the site is shared (WhatsApp, Facebook, X).
 * Drawn with the brand palette. Text is in English with Latin letters, because
 * the image font has no Devanagari letters.
 */
export const OG_SIZE = { width: 1200, height: 630 };

const c = PALETTE.light;

const registrationText: Record<RegistrationStatus, { label: string; bg: string; fg: string }> = {
  registered: { label: "Registered", bg: c["ok-tint"], fg: c.ok },
  not_found: { label: "Not on the list", bg: c["bad-tint"], fg: c.bad },
  expired: { label: "Registration expired", bg: c["warn-tint"], fg: c.warn },
  unknown: { label: "Registration not checked", bg: c["paper-sunk"], fg: c["ink-soft"] },
};

function Mark() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
      <div style={{ display: "flex", position: "relative", width: 56, height: 56, borderRadius: 14, background: c.ink }}>
        <div style={{ position: "absolute", left: 10, top: 10, width: 22, height: 22, borderRadius: 11, background: c.signature }} />
        <div style={{ position: "absolute", right: 10, bottom: 10, width: 14, height: 14, borderRadius: 3, background: c.spark }} />
      </div>
      <div style={{ fontSize: 34, fontWeight: 700 }}>{SITE_NAME}</div>
    </div>
  );
}

/** The default picture: the brand colour and the promise of the site. */
export function siteOgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 72,
          background: c.signature,
          color: c["signature-ink"],
        }}
      >
        <Mark />
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{ fontSize: 112, fontWeight: 700, letterSpacing: -4, lineHeight: 1 }}>Check before you pay.</div>
          <div style={{ fontSize: 38 }}>Honest reviews of study-abroad consultancies in Nepal.</div>
        </div>
      </div>
    ),
    OG_SIZE,
  );
}

/** The picture for one consultancy: name, score and registration badge. */
export function consultancyOgImage(input: {
  name: string;
  city: string | null;
  /** Null when there are fewer than 3 approved reviews. Then no score is shown. */
  score: number | null;
  reviewCount: number;
  registrationStatus: RegistrationStatus;
}) {
  const badge = registrationText[input.registrationStatus];
  const nameSize = input.name.length > 44 ? 58 : input.name.length > 28 ? 72 : 88;
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 72,
          background: c.paper,
          color: c.ink,
        }}
      >
        <Mark />
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ fontSize: nameSize, fontWeight: 700, letterSpacing: -2, lineHeight: 1.05 }}>{input.name}</div>
          {input.city && <div style={{ fontSize: 34, color: c["ink-soft"] }}>{input.city}</div>}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 28 }}>
          <div
            style={{
              display: "flex",
              padding: "16px 30px",
              borderRadius: 999,
              background: badge.bg,
              color: badge.fg,
              fontSize: 34,
              fontWeight: 700,
            }}
          >
            {badge.label}
          </div>
          {input.score !== null ? (
            <div style={{ display: "flex", alignItems: "baseline", gap: 14 }}>
              <div style={{ fontSize: 76, fontWeight: 700, color: c["signature-strong"] }}>{input.score.toFixed(1)}</div>
              <div style={{ fontSize: 32, color: c["ink-soft"] }}>
                {`out of 5 · ${input.reviewCount} ${input.reviewCount === 1 ? "review" : "reviews"}`}
              </div>
            </div>
          ) : (
            <div style={{ fontSize: 32, color: c["ink-soft"] }}>Not enough reviews yet</div>
          )}
        </div>
      </div>
    ),
    OG_SIZE,
  );
}

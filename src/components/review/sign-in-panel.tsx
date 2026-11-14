"use client";

import { useEffect, useState, type KeyboardEvent } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { TextField } from "@/components/ui/field";
import { FEATURES } from "@/config/features";
import { IS_PRODUCTION } from "@/config/site";
import { getBrowserClient } from "@/lib/supabase/browser";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export type SignedIn = { id: string; label: string };

/** Watches the sign-in state in the browser. `undefined` means "still checking". */
export function useSignedIn(): SignedIn | null | undefined {
  const [user, setUser] = useState<SignedIn | null | undefined>(undefined);

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      const id = requestAnimationFrame(() => setUser(null));
      return () => cancelAnimationFrame(id);
    }
    const supabase = getBrowserClient();
    const toUser = (u: { id: string; email?: string; phone?: string } | null | undefined) =>
      u ? { id: u.id, label: u.email || u.phone || "" } : null;
    supabase.auth.getUser().then(({ data }) => setUser(toUser(data.user)));
    const { data } = supabase.auth.onAuthStateChange((_event, session) => setUser(toUser(session?.user)));
    return () => data.subscription.unsubscribe();
  }, []);

  return user;
}

function GoogleMark() {
  // Google's own "G" mark, as their sign-in guidelines ask for.
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="size-5 shrink-0">
      <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.4h6.5a5.5 5.5 0 0 1-2.4 3.6v3h3.9c2.3-2.1 3.5-5.2 3.5-8.7Z" />
      <path fill="#34A853" d="M12 24c3.2 0 6-1.1 8-2.9l-3.9-3c-1.1.7-2.5 1.2-4.1 1.2-3.1 0-5.8-2.1-6.7-5H1.3v3.1A12 12 0 0 0 12 24Z" />
      <path fill="#FBBC05" d="M5.3 14.3a7.2 7.2 0 0 1 0-4.6V6.6H1.3a12 12 0 0 0 0 10.8l4-3.1Z" />
      <path fill="#EA4335" d="M12 4.8c1.8 0 3.3.6 4.6 1.8l3.4-3.4A12 12 0 0 0 1.3 6.6l4 3.1c.9-2.9 3.6-4.9 6.7-4.9Z" />
    </svg>
  );
}

/**
 * The ways to sign in, shown at the END of the review form.
 * Google first. Phone codes cost money per SMS, so they sit behind a switch that is off.
 *
 * This panel sits inside the review form, so it has no <form> of its own
 * (a form inside a form is not allowed). Buttons and the Enter key do the work.
 */
export function SignInPanel({ returnPath }: { returnPath: string }) {
  const t = useTranslations("review.steps.send");
  const locale = useLocale();
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [codeSent, setCodeSent] = useState(false);

  const supabase = () => getBrowserClient();

  async function run(action: () => Promise<{ error: unknown }>): Promise<boolean> {
    setBusy(true);
    setFailed(false);
    const { error } = await action();
    setBusy(false);
    setFailed(!!error);
    return !error;
  }

  const withGoogle = () =>
    run(() =>
      supabase().auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(returnPath)}` },
      }),
    );

  const withPassword = () => run(() => supabase().auth.signInWithPassword({ email, password }));

  async function withPhone() {
    const ok = await run(() =>
      codeSent
        ? supabase().auth.verifyOtp({ phone, token: code, type: "sms" })
        : supabase().auth.signInWithOtp({ phone }),
    );
    if (ok && !codeSent) setCodeSent(true);
  }

  /** Enter in one of these fields signs in. It must not send the review form around it. */
  const onEnter = (action: () => unknown) => (event: KeyboardEvent) => {
    if (event.key === "Enter") {
      event.preventDefault();
      void action();
    }
  };

  return (
    <div className="grid gap-6" lang={locale}>
      <p className="text-ink-soft">{t("needSignIn")}</p>
      <Button size="lg" variant="secondary" loading={busy} onClick={withGoogle} icon={<GoogleMark />} className="bg-paper-raised">
        {t("google")}
      </Button>

      {FEATURES.phoneOtp && (
        <div role="group" aria-label={t("phoneTitle")} className="grid gap-3 rounded-card bg-paper-sunk p-5">
          <p className="font-semibold">{t("phoneTitle")}</p>
          <TextField
            label={t("phone")}
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            placeholder="+97798XXXXXXXX"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            onKeyDown={onEnter(withPhone)}
          />
          {codeSent && (
            <TextField
              label={t("code")}
              inputMode="numeric"
              autoComplete="one-time-code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              onKeyDown={onEnter(withPhone)}
            />
          )}
          <Button variant="secondary" loading={busy} onClick={withPhone}>
            {codeSent ? t("verify") : t("sendCode")}
          </Button>
        </div>
      )}

      {FEATURES.devLogin && !IS_PRODUCTION && (
        <div role="group" aria-label={t("devTitle")} className="grid gap-3 rounded-card border-2 border-dashed border-line-strong p-5">
          <p className="font-semibold">{t("devTitle")}</p>
          <TextField
            type="email"
            label={t("email")}
            autoComplete="username"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={onEnter(withPassword)}
          />
          <TextField
            type="password"
            label={t("password")}
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={onEnter(withPassword)}
          />
          <Button variant="secondary" loading={busy} onClick={withPassword}>
            {t("devSubmit")}
          </Button>
        </div>
      )}

      {failed && (
        <p role="alert" className="font-semibold text-bad">
          {t("signInFailed")}
        </p>
      )}
    </div>
  );
}

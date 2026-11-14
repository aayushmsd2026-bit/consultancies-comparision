"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";
import { SignInPanel, useSignedIn } from "@/components/review/sign-in-panel";
import { Button } from "@/components/ui/button";
import { useRouter } from "@/i18n/navigation";
import { getBrowserClient } from "@/lib/supabase/browser";

/** Shown instead of the admin area when nobody is signed in, or the account is not an admin. */
export function AdminSignIn({ signedInButNotAdmin }: { signedInButNotAdmin: boolean }) {
  const t = useTranslations("admin");
  const router = useRouter();
  const user = useSignedIn();

  // After a successful sign-in, ask the server again who we are.
  useEffect(() => {
    if (user && !signedInButNotAdmin) router.refresh();
  }, [user, signedInButNotAdmin, router]);

  return (
    <div className="mx-auto max-w-md py-10">
      <h1 className="text-title">{t("notAllowedTitle")}</h1>
      {signedInButNotAdmin ? (
        <>
          <p className="mt-3 font-semibold text-bad">{t("notAdmin")}</p>
          <Button
            className="mt-4"
            variant="secondary"
            onClick={async () => {
              await getBrowserClient().auth.signOut();
              router.refresh();
            }}
          >
            {t("signOut")}
          </Button>
        </>
      ) : (
        <>
          <p className="mt-3 mb-6 text-ink-soft">{t("notAllowedBody")}</p>
          <SignInPanel returnPath="/en/admin" />
        </>
      )}
    </div>
  );
}

export function AdminSignOut() {
  const t = useTranslations("admin");
  const router = useRouter();
  return (
    <button
      type="button"
      className="underline underline-offset-2"
      onClick={async () => {
        await getBrowserClient().auth.signOut();
        router.refresh();
      }}
    >
      {t("signOut")}
    </button>
  );
}

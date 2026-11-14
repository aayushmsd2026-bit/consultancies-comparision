/**
 * Feature flags. Things that are built (or planned) but switched off.
 * Change a flag with an environment variable, never by editing pages.
 */
export const FEATURES = {
  /** Phone OTP sign-in costs money per SMS. Off until the owner turns it on. */
  phoneOtp: process.env.NEXT_PUBLIC_FEATURE_PHONE_OTP === "true",
} as const;

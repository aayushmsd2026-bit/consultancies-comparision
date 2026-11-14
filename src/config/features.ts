/**
 * Feature flags. Things that are built (or planned) but switched off.
 * Change a flag with an environment variable, never by editing pages.
 */
export const FEATURES = {
  /** Phone OTP sign-in costs money per SMS. Off until the owner turns it on. */
  phoneOtp: process.env.NEXT_PUBLIC_FEATURE_PHONE_OTP === "true",
  /**
   * A plain email and password sign-in for testing on your own computer, without Google.
   * It is never shown on the live site, whatever this is set to.
   */
  devLogin: process.env.NEXT_PUBLIC_FEATURE_DEV_LOGIN === "true",
} as const;

/**
 * Google Ads Responsive Search Ads (RSA) character/count limits.
 * Single source of truth — never hardcode these numbers elsewhere.
 * https://support.google.com/google-ads/answer/7684791
 */
export const RSA_LIMITS = {
  HEADLINE_MAX_LENGTH: 30,
  HEADLINE_MIN_COUNT: 3,
  HEADLINE_MAX_COUNT: 15,
  DESCRIPTION_MAX_LENGTH: 90,
  DESCRIPTION_MIN_COUNT: 2,
  DESCRIPTION_MAX_COUNT: 4,
  PATH_MAX_LENGTH: 15,
} as const;

export const ASSET_LIMITS = {
  SITELINK_MAX_LENGTH: 25,
  CALLOUT_MAX_LENGTH: 25,
  STRUCTURED_SNIPPET_MAX_LENGTH: 25,
} as const;

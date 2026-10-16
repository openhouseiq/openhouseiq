// The product's name and public addresses, in one place. Change them here and
// they change everywhere the site shows them.

export const BRAND_NAME = "Open Home Hero";

/** Where people write to. Switch this one line once the new mailbox exists. */
export const CONTACT_EMAIL = "contact@openhomehero.com.au";

/** The site's public address when NEXT_PUBLIC_SITE_URL isn't set. */
export const DEFAULT_SITE_URL = "https://openhomehero.com.au";

/** The address shown on social graphics, without https://. */
export const BRAND_DOMAIN = "openhomehero.com.au";

/**
 * The ABN shown on the contact page and in the footers of the legal pages.
 * Leave it empty and that line is simply not shown, so nothing placeholder
 * ever reaches the live site. Fill it in before deploying.
 */
export const BUSINESS_ABN = "";

/** The Open Home Hero Facebook page. */
export const FACEBOOK_PAGE_URL = "https://www.facebook.com/openhomehero";

/**
 * Social channels shown in the site-wide footer. Paste a channel's full page
 * address (https://...) to show its icon; leave it empty and it stays hidden,
 * so no dead link ever goes live.
 */
export const SOCIAL_LINKS = {
  facebook: FACEBOOK_PAGE_URL,
  linkedin: "",
  x: "https://x.com/OpenHomeHero",
  instagram: "https://www.instagram.com/openhomehero/",
};

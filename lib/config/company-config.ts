/**
 * ============================================================
 * COMPANY CONFIG — THE ONLY FILE A CLIENT DUPLICATION SHOULD NEED
 * TO HAND-EDIT FOR IDENTITY/CONTENT THAT ISN'T MANAGED VIA THE ADMIN PANEL.
 * ============================================================
 *
 * Every field below is marked "EDIT PER CLIENT". Nothing in app/ or
 * components/ should hardcode a company name, phone number, address, etc. —
 * it must all flow through this object (or, for business hours, through
 * `getCompanySettings()` in lib/config/get-company-settings.ts, which reads
 * the DB-editable override and falls back to `businessHoursFallback` below).
 *
 * Colors are the one exception kept in CSS, not here: see the `:root`/`.dark`
 * blocks in app/globals.css — edit those oklch values per client too.
 */

export const companyConfig = {
  // EDIT PER CLIENT
  name: "Nome do Negócio",
  shortName: "Negócio",
  tagline: "Agendamento simples e rápido.",
  description: "Descreva aqui, em uma frase, o que o negócio oferece.",

  // EDIT PER CLIENT — paths under /public/branding
  logo: {
    light: "/branding/logo.svg",
    dark: "/branding/logo-dark.svg",
    favicon: "/branding/favicon.ico",
  },

  // EDIT PER CLIENT
  contact: {
    whatsapp: "", // digits only, e.g. "5531999999999"
    phone: "",
    email: "",
    instagram: "",
    facebook: "",
  },

  // EDIT PER CLIENT
  address: {
    street: "",
    number: "",
    neighborhood: "",
    city: "",
    state: "",
    zipCode: "",
  },

  // EDIT PER CLIENT
  seo: {
    siteUrl: "https://example.com",
    defaultTitle: "Nome do Negócio",
    defaultDescription: "Descreva aqui, em uma frase, o que o negócio oferece.",
    ogImage: "/branding/og-image.jpg",
  },

  // EDIT PER CLIENT — IANA timezone used for all booking/availability math.
  // Not per-request/browser timezone: this is a single-tenant-per-deployment
  // app, so one fixed timezone for the whole business is correct.
  timezone: "America/Sao_Paulo",

  // Fallback only — the admin-editable source of truth lives in the
  // `company_settings.business_hours` table (see get-company-settings.ts).
  // This fires only if that row is missing or the query fails.
  businessHoursFallback: [
    { weekday: 0, open: null, close: null }, // domingo — fechado
    { weekday: 1, open: "09:00", close: "18:00" },
    { weekday: 2, open: "09:00", close: "18:00" },
    { weekday: 3, open: "09:00", close: "18:00" },
    { weekday: 4, open: "09:00", close: "18:00" },
    { weekday: 5, open: "09:00", close: "18:00" },
    { weekday: 6, open: "09:00", close: "13:00" },
  ],
} as const;

export type CompanyConfig = typeof companyConfig;
export type BusinessHours = { weekday: number; open: string | null; close: string | null }[];

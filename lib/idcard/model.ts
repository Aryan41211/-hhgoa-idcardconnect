// Shared data model for the official HH Goa 2026 ID card.
// The form, the live preview and the canvas renderer all speak this shape.

export type IdCardStatus = "active" | "expired" | "revoked";

export type IdCardData = {
  fullName: string;
  idTypeLabel: string;
  institution: string;
  department?: string;
  program?: string;
  rollNumber?: string;
  campus?: string;
  cardNumber: string;
  email?: string;
  issuedAt?: string;
  validUntil?: string;
  status: IdCardStatus;
};

export const ID_TYPES = ["BUILDER", "STAFF", "VOLUNTEER", "SPEAKER", "VIP"] as const;
export type IdType = (typeof ID_TYPES)[number];

export const CAMPUSES = ["GOA", "BENGALURU", "MUMBAI", "DELHI", "PUNE", "CHENNAI"] as const;
export type Campus = (typeof CAMPUSES)[number];

export const DEFAULT_INSTITUTION = "HACKER HOUSE GOA";

/** A unique-ish, on-brand card number, e.g. HHGOA-26-123456. */
export function generateCardNumber(): string {
  const rnd = Math.floor(100000 + Math.random() * 900000);
  return `HHGOA-26-${rnd}`;
}

/** Default valid-until one year from now (YYYY-MM-DD, matches the card formatter). */
export function defaultValidUntil(): string {
  const d = new Date();
  d.setFullYear(d.getFullYear() + 1);
  return d.toISOString().slice(0, 10);
}

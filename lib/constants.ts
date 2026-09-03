// ============================================================
// NEXORA — Shared constants
// ============================================================

export const BUSINESS_CATEGORIES = [
  "Accounting & Finance",
  "Architecture & Interior Design",
  "Business Consulting",
  "Digital Marketing",
  "Education & Training",
  "Engineering",
  "Event Management",
  "Healthcare",
  "HR & Staffing",
  "IT Services",
  "Insurance",
  "Legal Services",
  "Manufacturing",
  "Media & PR",
  "Real Estate",
  "Retail",
  "Travel & Hospitality",
  "Other",
] as const;

export type BusinessCategory = (typeof BUSINESS_CATEGORIES)[number];

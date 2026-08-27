import { z } from "zod";

export const discoverSchema = z.object({
  businessType: z.string().trim().min(1).max(120),
  country: z.string().trim().max(100).optional().or(z.literal("")),
  countryCode: z.string().trim().max(8).optional().or(z.literal("")),
  state: z.string().trim().max(100).optional().or(z.literal("")),
  city: z.string().trim().max(100).optional().or(z.literal("")),
  area: z.string().trim().max(120).optional().or(z.literal("")),
  postalCode: z.string().trim().max(20).optional().or(z.literal("")),
  keywords: z.array(z.string().trim().max(80)).max(20).default([]),
  maxLeads: z.number().int().min(1).max(500).default(50),
  sources: z
    .object({
      googleMaps: z.boolean().default(true),
      search: z.boolean().default(true),
      directory: z.boolean().default(false),
    })
    .default({ googleMaps: true, search: true, directory: false }),
  enrichment: z
    .object({
      website: z.boolean().default(true),
      social: z.boolean().default(true),
      contact: z.boolean().default(true),
      websiteAnalysis: z.boolean().default(true),
      ai: z.boolean().default(false),
    })
    .default({
      website: true,
      social: true,
      contact: true,
      websiteAnalysis: true,
      ai: false,
    }),
});

export type DiscoverInput = z.infer<typeof discoverSchema>;

export const leadPatchSchema = z.object({
  contactStatus: z
    .enum([
      "NEW",
      "QUALIFIED",
      "CONTACTED",
      "FOLLOW_UP",
      "INTERESTED",
      "NOT_INTERESTED",
      "CLIENT",
      "CLOSED",
      "DO_NOT_CONTACT",
    ])
    .optional(),
  notes: z.string().max(5000).optional(),
  followUpAt: z.string().nullable().optional(),
  tagIds: z.array(z.string()).optional(),
  possibleDuplicate: z.boolean().optional(),
});

export const bulkStatusSchema = z.object({
  ids: z.array(z.string()).min(1).max(500),
  contactStatus: z.enum([
    "NEW",
    "QUALIFIED",
    "CONTACTED",
    "FOLLOW_UP",
    "INTERESTED",
    "NOT_INTERESTED",
    "CLIENT",
    "CLOSED",
    "DO_NOT_CONTACT",
  ]),
});

export const leadsQuerySchema = z.object({
  q: z.string().optional(),
  businessType: z.string().optional(),
  country: z.string().optional(),
  city: z.string().optional(),
  leadCategory: z.string().optional(),
  contactStatus: z.string().optional(),
  websiteQuality: z.string().optional(),
  hasWebsite: z.string().optional(),
  hasEmail: z.string().optional(),
  hasPhone: z.string().optional(),
  hasWhatsapp: z.string().optional(),
  hasInstagram: z.string().optional(),
  hasBooking: z.string().optional(),
  minScore: z.string().optional(),
  maxScore: z.string().optional(),
  minRating: z.string().optional(),
  minReviews: z.string().optional(),
  page: z.string().optional(),
  pageSize: z.string().optional(),
  sort: z.string().optional(),
  order: z.enum(["asc", "desc"]).optional(),
  ids: z.string().optional(),
});

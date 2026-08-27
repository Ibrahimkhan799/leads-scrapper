import type { ContactStatus, LeadCategory, Prisma, WebsiteQuality } from "@prisma/client";
import type { z } from "zod";
import type { leadsQuerySchema } from "@/lib/validation/schemas";

type Query = z.infer<typeof leadsQuerySchema>;

export function buildLeadWhere(query: Query): Prisma.BusinessWhereInput {
  const where: Prisma.BusinessWhereInput = {};
  const AND: Prisma.BusinessWhereInput[] = [];

  if (query.q) {
    AND.push({
      OR: [
        { name: { contains: query.q, mode: "insensitive" } },
        { businessType: { contains: query.q, mode: "insensitive" } },
        { city: { contains: query.q, mode: "insensitive" } },
        { country: { contains: query.q, mode: "insensitive" } },
        { phone: { contains: query.q, mode: "insensitive" } },
        { email: { contains: query.q, mode: "insensitive" } },
        { websiteUrl: { contains: query.q, mode: "insensitive" } },
        { instagram: { contains: query.q, mode: "insensitive" } },
      ],
    });
  }
  if (query.businessType) AND.push({ businessType: { contains: query.businessType, mode: "insensitive" } });
  if (query.country) AND.push({ country: { contains: query.country, mode: "insensitive" } });
  if (query.city) AND.push({ city: { contains: query.city, mode: "insensitive" } });
  if (query.leadCategory) AND.push({ leadCategory: query.leadCategory as LeadCategory });
  if (query.contactStatus) AND.push({ contactStatus: query.contactStatus as ContactStatus });
  if (query.websiteQuality) AND.push({ websiteQuality: query.websiteQuality as WebsiteQuality });
  if (query.hasWebsite === "true") AND.push({ websiteUrl: { not: null } });
  if (query.hasWebsite === "false") AND.push({ OR: [{ websiteUrl: null }, { websiteUrl: "" }] });
  if (query.hasEmail === "true") AND.push({ email: { not: null } });
  if (query.hasEmail === "false") AND.push({ OR: [{ email: null }, { email: "" }] });
  if (query.hasPhone === "true") AND.push({ phone: { not: null } });
  if (query.hasWhatsapp === "true") AND.push({ whatsapp: { not: null } });
  if (query.hasInstagram === "true") AND.push({ instagram: { not: null } });
  if (query.hasBooking === "true") AND.push({ bookingUrl: { not: null } });
  if (query.hasBooking === "false") AND.push({ OR: [{ bookingUrl: null }, { bookingUrl: "" }] });
  if (query.minScore) AND.push({ leadScore: { gte: Number(query.minScore) } });
  if (query.maxScore) AND.push({ leadScore: { lte: Number(query.maxScore) } });
  if (query.minRating) AND.push({ rating: { gte: Number(query.minRating) } });
  if (query.minReviews) AND.push({ reviewCount: { gte: Number(query.minReviews) } });
  if (query.ids) {
    AND.push({ id: { in: query.ids.split(",").filter(Boolean) } });
  }

  if (AND.length) where.AND = AND;
  return where;
}

const SORTABLE = new Set([
  "leadScore",
  "name",
  "city",
  "country",
  "rating",
  "reviewCount",
  "createdAt",
  "businessType",
  "contactStatus",
]);

export function buildLeadOrder(query: Query): Prisma.BusinessOrderByWithRelationInput {
  const sort = query.sort && SORTABLE.has(query.sort) ? query.sort : "leadScore";
  const order = query.order === "asc" ? "asc" : "desc";
  return { [sort]: order };
}

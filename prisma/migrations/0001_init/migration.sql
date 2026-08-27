-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "LeadCategory" AS ENUM ('HOT', 'HIGH', 'MEDIUM', 'LOW');

-- CreateEnum
CREATE TYPE "ContactStatus" AS ENUM ('NEW', 'QUALIFIED', 'CONTACTED', 'FOLLOW_UP', 'INTERESTED', 'NOT_INTERESTED', 'CLIENT', 'CLOSED', 'DO_NOT_CONTACT');

-- CreateEnum
CREATE TYPE "JobStatus" AS ENUM ('QUEUED', 'RUNNING', 'COMPLETED', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "JobType" AS ENUM ('DISCOVERY', 'DEDUPLICATION', 'WEBSITE_DISCOVERY', 'WEBSITE_CRAWL', 'CONTACT_EXTRACTION', 'SOCIAL_DISCOVERY', 'WEBSITE_ANALYSIS', 'AI_ANALYSIS', 'LEAD_SCORING', 'ENRICHMENT_PIPELINE');

-- CreateEnum
CREATE TYPE "WebsiteQuality" AS ENUM ('NONE', 'POOR', 'OUTDATED', 'GOOD', 'EXCELLENT');

-- CreateEnum
CREATE TYPE "WebsiteOpportunity" AS ENUM ('VERY_HIGH', 'HIGH', 'MEDIUM', 'LOW', 'VERY_LOW');

-- CreateEnum
CREATE TYPE "CrawlStatus" AS ENUM ('PENDING', 'SUCCESS', 'BLOCKED', 'TIMEOUT', 'UNAVAILABLE', 'ERROR', 'SKIPPED');

-- CreateTable
CREATE TABLE "Business" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "normalizedName" TEXT NOT NULL,
    "businessType" TEXT NOT NULL,
    "category" TEXT,
    "subcategory" TEXT,
    "country" TEXT,
    "countryCode" TEXT,
    "state" TEXT,
    "city" TEXT,
    "area" TEXT,
    "address" TEXT,
    "postalCode" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "googlePlaceId" TEXT,
    "googleMapsUrl" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "whatsapp" TEXT,
    "websiteUrl" TEXT,
    "websiteDomain" TEXT,
    "instagram" TEXT,
    "facebook" TEXT,
    "tiktok" TEXT,
    "youtube" TEXT,
    "linkedin" TEXT,
    "twitter" TEXT,
    "bookingUrl" TEXT,
    "bookingProvider" TEXT,
    "rating" DOUBLE PRECISION,
    "reviewCount" INTEGER,
    "openingHours" JSONB,
    "websiteStatus" TEXT,
    "websiteQuality" "WebsiteQuality",
    "websiteOpportunity" "WebsiteOpportunity",
    "crawlStatus" "CrawlStatus",
    "leadScore" INTEGER NOT NULL DEFAULT 0,
    "leadCategory" "LeadCategory" NOT NULL DEFAULT 'LOW',
    "contactStatus" "ContactStatus" NOT NULL DEFAULT 'NEW',
    "notes" TEXT,
    "followUpAt" TIMESTAMP(3),
    "possibleDuplicate" BOOLEAN NOT NULL DEFAULT false,
    "duplicateOfId" TEXT,
    "lastDiscoveredAt" TIMESTAMP(3),
    "lastEnrichedAt" TIMESTAMP(3),
    "lastWebsiteAuditAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Business_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BusinessContact" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "normalizedValue" TEXT NOT NULL,
    "source" TEXT,
    "sourceUrl" TEXT,
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    "lastVerifiedAt" TIMESTAMP(3),
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BusinessContact_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SocialProfile" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "handle" TEXT,
    "source" TEXT,
    "sourceUrl" TEXT,
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    "lastVerifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SocialProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Website" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "domain" TEXT NOT NULL,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "verificationConfidence" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "discoveredVia" TEXT,
    "crawlStatus" "CrawlStatus" NOT NULL DEFAULT 'PENDING',
    "lastCrawledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Website_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WebsitePage" (
    "id" TEXT NOT NULL,
    "websiteId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "title" TEXT,
    "httpStatus" INTEGER,
    "loadTimeMs" INTEGER,
    "extractedEmails" JSONB,
    "extractedPhones" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WebsitePage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WebsiteAudit" (
    "id" TEXT NOT NULL,
    "websiteId" TEXT NOT NULL,
    "https" BOOLEAN NOT NULL DEFAULT false,
    "mobileViewport" BOOLEAN NOT NULL DEFAULT false,
    "httpStatus" INTEGER,
    "loadTimeMs" INTEGER,
    "brokenLinkCount" INTEGER NOT NULL DEFAULT 0,
    "hasClearCta" BOOLEAN NOT NULL DEFAULT false,
    "hasContactCta" BOOLEAN NOT NULL DEFAULT false,
    "hasBookingCta" BOOLEAN NOT NULL DEFAULT false,
    "hasMobileNav" BOOLEAN NOT NULL DEFAULT false,
    "visiblePhone" BOOLEAN NOT NULL DEFAULT false,
    "visibleEmail" BOOLEAN NOT NULL DEFAULT false,
    "hasServices" BOOLEAN NOT NULL DEFAULT false,
    "hasPricing" BOOLEAN NOT NULL DEFAULT false,
    "hasLocation" BOOLEAN NOT NULL DEFAULT false,
    "hasOpeningHours" BOOLEAN NOT NULL DEFAULT false,
    "hasAbout" BOOLEAN NOT NULL DEFAULT false,
    "hasTestimonials" BOOLEAN NOT NULL DEFAULT false,
    "hasContactPage" BOOLEAN NOT NULL DEFAULT false,
    "performanceScore" INTEGER,
    "accessibilityScore" INTEGER,
    "seoScore" INTEGER,
    "bestPracticesScore" INTEGER,
    "quality" "WebsiteQuality",
    "opportunity" "WebsiteOpportunity",
    "raw" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WebsiteAudit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BookingPlatform" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "detectedFrom" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BookingPlatform_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeadScore" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "category" "LeadCategory" NOT NULL,
    "profile" TEXT NOT NULL DEFAULT 'website-development',
    "reasons" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LeadScore_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeadActivity" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LeadActivity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Tag" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT NOT NULL DEFAULT '#64748b',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Tag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BusinessTag" (
    "businessId" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,

    CONSTRAINT "BusinessTag_pkey" PRIMARY KEY ("businessId","tagId")
);

-- CreateTable
CREATE TABLE "ScrapingJob" (
    "id" TEXT NOT NULL,
    "type" "JobType" NOT NULL,
    "status" "JobStatus" NOT NULL DEFAULT 'QUEUED',
    "progress" INTEGER NOT NULL DEFAULT 0,
    "total" INTEGER NOT NULL DEFAULT 0,
    "processed" INTEGER NOT NULL DEFAULT 0,
    "failed" INTEGER NOT NULL DEFAULT 0,
    "input" JSONB NOT NULL,
    "result" JSONB,
    "error" TEXT,
    "parentJobId" TEXT,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ScrapingJob_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScrapingJobLog" (
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "level" TEXT NOT NULL DEFAULT 'info',
    "message" TEXT NOT NULL,
    "meta" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ScrapingJobLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DiscoverySource" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "sourceId" TEXT,
    "rawPayload" JSONB,
    "query" TEXT,
    "discoveredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DiscoverySource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SearchQuery" (
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "query" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "resultCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SearchQuery_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AIAnalysis" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "classification" TEXT,
    "websiteQualityInterpretation" TEXT,
    "opportunity" TEXT,
    "websiteWeaknessSummary" TEXT,
    "salesInsight" JSONB,
    "raw" JSONB,
    "model" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AIAnalysis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BusinessSignal" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "source" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BusinessSignal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SavedSearch" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "config" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SavedSearch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SearchTemplate" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "config" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SearchTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AppSetting" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AppSetting_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Business_googlePlaceId_key" ON "Business"("googlePlaceId");

-- CreateIndex
CREATE INDEX "Business_name_idx" ON "Business"("name");

-- CreateIndex
CREATE INDEX "Business_normalizedName_idx" ON "Business"("normalizedName");

-- CreateIndex
CREATE INDEX "Business_businessType_idx" ON "Business"("businessType");

-- CreateIndex
CREATE INDEX "Business_country_idx" ON "Business"("country");

-- CreateIndex
CREATE INDEX "Business_city_idx" ON "Business"("city");

-- CreateIndex
CREATE INDEX "Business_phone_idx" ON "Business"("phone");

-- CreateIndex
CREATE INDEX "Business_email_idx" ON "Business"("email");

-- CreateIndex
CREATE INDEX "Business_websiteUrl_idx" ON "Business"("websiteUrl");

-- CreateIndex
CREATE INDEX "Business_websiteDomain_idx" ON "Business"("websiteDomain");

-- CreateIndex
CREATE INDEX "Business_leadScore_idx" ON "Business"("leadScore");

-- CreateIndex
CREATE INDEX "Business_leadCategory_idx" ON "Business"("leadCategory");

-- CreateIndex
CREATE INDEX "Business_contactStatus_idx" ON "Business"("contactStatus");

-- CreateIndex
CREATE INDEX "Business_createdAt_idx" ON "Business"("createdAt");

-- CreateIndex
CREATE INDEX "Business_possibleDuplicate_idx" ON "Business"("possibleDuplicate");

-- CreateIndex
CREATE INDEX "BusinessContact_type_normalizedValue_idx" ON "BusinessContact"("type", "normalizedValue");

-- CreateIndex
CREATE UNIQUE INDEX "BusinessContact_businessId_type_normalizedValue_key" ON "BusinessContact"("businessId", "type", "normalizedValue");

-- CreateIndex
CREATE INDEX "SocialProfile_platform_idx" ON "SocialProfile"("platform");

-- CreateIndex
CREATE UNIQUE INDEX "SocialProfile_businessId_platform_url_key" ON "SocialProfile"("businessId", "platform", "url");

-- CreateIndex
CREATE INDEX "Website_domain_idx" ON "Website"("domain");

-- CreateIndex
CREATE INDEX "Website_businessId_idx" ON "Website"("businessId");

-- CreateIndex
CREATE UNIQUE INDEX "WebsitePage_websiteId_url_key" ON "WebsitePage"("websiteId", "url");

-- CreateIndex
CREATE INDEX "WebsiteAudit_websiteId_createdAt_idx" ON "WebsiteAudit"("websiteId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "BookingPlatform_businessId_provider_url_key" ON "BookingPlatform"("businessId", "provider", "url");

-- CreateIndex
CREATE INDEX "LeadScore_businessId_createdAt_idx" ON "LeadScore"("businessId", "createdAt");

-- CreateIndex
CREATE INDEX "LeadActivity_businessId_createdAt_idx" ON "LeadActivity"("businessId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Tag_name_key" ON "Tag"("name");

-- CreateIndex
CREATE INDEX "ScrapingJob_status_idx" ON "ScrapingJob"("status");

-- CreateIndex
CREATE INDEX "ScrapingJob_type_idx" ON "ScrapingJob"("type");

-- CreateIndex
CREATE INDEX "ScrapingJob_createdAt_idx" ON "ScrapingJob"("createdAt");

-- CreateIndex
CREATE INDEX "ScrapingJob_parentJobId_idx" ON "ScrapingJob"("parentJobId");

-- CreateIndex
CREATE INDEX "ScrapingJobLog_jobId_createdAt_idx" ON "ScrapingJobLog"("jobId", "createdAt");

-- CreateIndex
CREATE INDEX "DiscoverySource_provider_sourceId_idx" ON "DiscoverySource"("provider", "sourceId");

-- CreateIndex
CREATE INDEX "SearchQuery_jobId_idx" ON "SearchQuery"("jobId");

-- CreateIndex
CREATE INDEX "AIAnalysis_businessId_createdAt_idx" ON "AIAnalysis"("businessId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "BusinessSignal_businessId_key_key" ON "BusinessSignal"("businessId", "key");

-- CreateIndex
CREATE UNIQUE INDEX "AppSetting_key_key" ON "AppSetting"("key");

-- AddForeignKey
ALTER TABLE "BusinessContact" ADD CONSTRAINT "BusinessContact_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SocialProfile" ADD CONSTRAINT "SocialProfile_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Website" ADD CONSTRAINT "Website_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WebsitePage" ADD CONSTRAINT "WebsitePage_websiteId_fkey" FOREIGN KEY ("websiteId") REFERENCES "Website"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WebsiteAudit" ADD CONSTRAINT "WebsiteAudit_websiteId_fkey" FOREIGN KEY ("websiteId") REFERENCES "Website"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookingPlatform" ADD CONSTRAINT "BookingPlatform_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeadScore" ADD CONSTRAINT "LeadScore_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeadActivity" ADD CONSTRAINT "LeadActivity_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BusinessTag" ADD CONSTRAINT "BusinessTag_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BusinessTag" ADD CONSTRAINT "BusinessTag_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "Tag"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScrapingJobLog" ADD CONSTRAINT "ScrapingJobLog_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "ScrapingJob"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiscoverySource" ADD CONSTRAINT "DiscoverySource_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AIAnalysis" ADD CONSTRAINT "AIAnalysis_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BusinessSignal" ADD CONSTRAINT "BusinessSignal_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;


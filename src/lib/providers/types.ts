export interface BusinessSearchInput {
  businessType: string;
  country?: string;
  countryCode?: string;
  state?: string;
  city?: string;
  area?: string;
  postalCode?: string;
  keywords?: string[];
  maxResults?: number;
}

export interface RawBusiness {
  name: string;
  businessType?: string;
  category?: string;
  subcategory?: string;
  country?: string;
  countryCode?: string;
  state?: string;
  city?: string;
  area?: string;
  address?: string;
  postalCode?: string;
  latitude?: number;
  longitude?: number;
  phone?: string;
  email?: string;
  whatsapp?: string;
  website?: string;
  googleMapsUrl?: string;
  googlePlaceId?: string;
  instagram?: string;
  facebook?: string;
  tiktok?: string;
  youtube?: string;
  linkedin?: string;
  twitter?: string;
  rating?: number;
  reviewCount?: number;
  openingHours?: unknown;
  bookingUrl?: string;
  bookingProvider?: string;
  source: string;
  sourceId?: string;
  sourceUrl?: string;
  raw?: unknown;
}

export interface SearchResult {
  title: string;
  url: string;
  snippet?: string;
}

export interface BusinessIdentity {
  name: string;
  city?: string | null;
  country?: string | null;
  phone?: string | null;
  address?: string | null;
  instagram?: string | null;
}

export interface WebsiteCandidate {
  url: string;
  domain: string;
  score: number;
  reasons: string[];
}

export interface CrawlOptions {
  maxPages?: number;
  maxDepth?: number;
  timeoutMs?: number;
  delayMs?: number;
}

export interface CrawlPageResult {
  url: string;
  path: string;
  title?: string;
  html: string;
  httpStatus: number;
  loadTimeMs: number;
}

export interface CrawlResult {
  url: string;
  domain: string;
  status: "SUCCESS" | "BLOCKED" | "TIMEOUT" | "UNAVAILABLE" | "ERROR";
  pages: CrawlPageResult[];
  error?: string;
}

export interface AIAnalysisInput {
  businessName: string;
  businessType: string;
  city?: string | null;
  country?: string | null;
  rating?: number | null;
  reviewCount?: number | null;
  hasWebsite: boolean;
  websiteQuality?: string | null;
  auditSummary?: Record<string, unknown>;
  contacts?: Record<string, unknown>;
}

export interface AISalesInsight {
  opportunity: string;
  websiteProblems: string[];
  recommendedService: string;
  pitchAngle: string;
}

export interface AIAnalysisResult {
  classification: string;
  websiteQualityInterpretation: string;
  opportunity: string;
  websiteWeaknessSummary: string;
  salesInsight: AISalesInsight;
}

export interface BusinessDiscoveryProvider {
  id: string;
  search(input: BusinessSearchInput): Promise<RawBusiness[]>;
}

export interface SearchProvider {
  id: string;
  search(query: string): Promise<SearchResult[]>;
}

export interface WebsiteDiscoveryProvider {
  findOfficialWebsite(business: BusinessIdentity): Promise<WebsiteCandidate[]>;
}

export interface WebsiteCrawler {
  crawl(url: string, options?: CrawlOptions): Promise<CrawlResult>;
}

export interface AIProvider {
  analyze(input: AIAnalysisInput): Promise<AIAnalysisResult>;
}

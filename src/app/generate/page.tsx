"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { COUNTRIES, SUGGESTED_CITIES } from "@/lib/countries";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

export default function GeneratePage() {
  const router = useRouter();
  const templates = useQuery({
    queryKey: ["templates"],
    queryFn: () => fetch("/api/templates").then((res) => res.json()),
  });
  const [businessType, setBusinessType] = React.useState("");
  const [country, setCountry] = React.useState("United Arab Emirates");
  const [city, setCity] = React.useState("Dubai");
  const [state, setState] = React.useState("");
  const [area, setArea] = React.useState("");
  const [keyword, setKeyword] = React.useState("");
  const [keywords, setKeywords] = React.useState<string[]>([]);
  const [maxLeads, setMaxLeads] = React.useState(50);
  const [sources, setSources] = React.useState({ googleMaps: true, search: true, directory: false });
  const [enrichment, setEnrichment] = React.useState({
    website: true,
    social: true,
    contact: true,
    websiteAnalysis: true,
    ai: false,
  });
  const [pending, setPending] = React.useState(false);

  const countryCode = COUNTRIES.find((item) => item.name === country)?.code;
  const cities = countryCode ? SUGGESTED_CITIES[countryCode] ?? [] : [];

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    try {
      const response = await fetch("/api/leads/discover", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessType,
          country,
          countryCode,
          city,
          state,
          area,
          keywords,
          maxLeads,
          sources,
          enrichment,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to start discovery");
      toast.success("Lead generation started");
      router.push(`/jobs/${data.jobId}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Generate leads</h1>
        <p className="text-sm text-muted-foreground">
          Enter any local business category. The same pipeline discovers, enriches, and scores every lead.
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        {(templates.data?.items ?? []).map((template: { name: string; config: Record<string, unknown> }) => (
          <button
            key={template.name}
            className="rounded-full border border-border px-3 py-1 text-xs hover:bg-muted"
            onClick={() => {
              const config = template.config;
              setBusinessType(String(config.businessType ?? ""));
              setCity(String(config.city ?? ""));
              setCountry(String(config.country ?? country));
              setKeywords(Array.isArray(config.keywords) ? (config.keywords as string[]) : []);
              setMaxLeads(Number(config.maxLeads ?? 50));
            }}
          >
            {template.name}
          </button>
        ))}
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Search</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={onSubmit}>
            <Field label="Business type">
              <Input
                required
                placeholder="Gym, dentist, luxury restaurant, car dealership…"
                value={businessType}
                onChange={(e) => setBusinessType(e.target.value)}
              />
            </Field>
            <div className="grid gap-3 md:grid-cols-2">
              <Field label="Country">
                <select
                  className="h-8 w-full rounded-md border border-input bg-card px-2 text-sm"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                >
                  {COUNTRIES.map((item) => (
                    <option key={item.code}>{item.name}</option>
                  ))}
                </select>
              </Field>
              <Field label="City">
                <Input list="cities" value={city} onChange={(e) => setCity(e.target.value)} placeholder="Dubai" />
                <datalist id="cities">
                  {cities.map((item) => (
                    <option key={item} value={item} />
                  ))}
                </datalist>
              </Field>
              <Field label="State / province">
                <Input value={state} onChange={(e) => setState(e.target.value)} placeholder="Optional" />
              </Field>
              <Field label="Neighborhood / area">
                <Input value={area} onChange={(e) => setArea(e.target.value)} placeholder="Dubai Marina" />
              </Field>
            </div>
            <Field label="Keywords">
              <div className="flex flex-wrap gap-1.5">
                {keywords.map((item) => (
                  <Badge key={item} variant="secondary">
                    {item}
                    <button className="ml-1" onClick={() => setKeywords(keywords.filter((k) => k !== item))} type="button">
                      ×
                    </button>
                  </Badge>
                ))}
              </div>
              <div className="mt-2 flex gap-2">
                <Input
                  value={keyword}
                  placeholder="fitness, personal training…"
                  onChange={(e) => setKeyword(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      if (keyword.trim()) {
                        setKeywords([...keywords, keyword.trim()]);
                        setKeyword("");
                      }
                    }
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    if (keyword.trim()) {
                      setKeywords([...keywords, keyword.trim()]);
                      setKeyword("");
                    }
                  }}
                >
                  Add
                </Button>
              </div>
            </Field>
            <Field label="Number of leads">
              <Input
                type="number"
                min={1}
                max={500}
                value={maxLeads}
                onChange={(e) => setMaxLeads(Number(e.target.value))}
              />
            </Field>
            <div className="grid gap-4 md:grid-cols-2">
              <fieldset className="space-y-2">
                <Label>Discovery sources</Label>
                <Check label="Google Maps" checked={sources.googleMaps} onChange={(v) => setSources({ ...sources, googleMaps: v })} />
                <Check label="Search" checked={sources.search} onChange={(v) => setSources({ ...sources, search: v })} />
                <Check label="Directory" checked={sources.directory} onChange={(v) => setSources({ ...sources, directory: v })} />
              </fieldset>
              <fieldset className="space-y-2">
                <Label>Enrichment</Label>
                <Check label="Website" checked={enrichment.website} onChange={(v) => setEnrichment({ ...enrichment, website: v })} />
                <Check label="Social media" checked={enrichment.social} onChange={(v) => setEnrichment({ ...enrichment, social: v })} />
                <Check label="Contact information" checked={enrichment.contact} onChange={(v) => setEnrichment({ ...enrichment, contact: v })} />
                <Check label="Website analysis" checked={enrichment.websiteAnalysis} onChange={(v) => setEnrichment({ ...enrichment, websiteAnalysis: v })} />
                <Check label="AI insights (HOT/HIGH)" checked={enrichment.ai} onChange={(v) => setEnrichment({ ...enrichment, ai: v })} />
              </fieldset>
            </div>
            <div className="flex justify-end">
              <Button type="submit" disabled={pending || !businessType.trim()}>
                {pending ? "Starting…" : "Generate leads"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}

function Check({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <label className="flex items-center gap-2 text-sm">
      <Checkbox checked={checked} onCheckedChange={onChange} />
      {label}
    </label>
  );
}

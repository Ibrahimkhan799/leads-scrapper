"use client";

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function AnalyticsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["analytics"],
    queryFn: () => fetch("/api/analytics").then((res) => res.json()),
  });
  if (isLoading || !data) return <Skeleton className="h-80" />;
  const t = data.totals;
  const metrics = [
    ["Businesses discovered", t.total],
    ["HOT leads", t.hot],
    ["HIGH leads", t.high],
    ["Websites missing", t.noWebsite],
    ["Emails found", t.emails],
    ["WhatsApp found", t.whatsapp],
    ["Instagram found", t.instagram],
    ["Website opportunity rate", `${t.websiteOpportunityRate}%`],
    ["Contactability rate", `${t.contactabilityRate}%`],
    ["Average lead score", t.averageLeadScore],
    ["Average reviews", t.averageReviews],
  ];
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold tracking-tight">Analytics</h1>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {metrics.map(([label, value]) => (
          <Card key={label}>
            <CardContent className="p-4">
              <div className="text-xs text-muted-foreground">{label}</div>
              <div className="mt-1 text-2xl font-semibold tabular-nums">{value}</div>
            </CardContent>
          </Card>
        ))}
      </div>
      <Card>
        <CardHeader><CardTitle>Website quality</CardTitle></CardHeader>
        <CardContent className="text-sm space-y-1">
          {(data.qualityBuckets ?? []).map((row: { websiteQuality: string | null; _count: { _all: number } }) => (
            <div key={String(row.websiteQuality)} className="flex justify-between">
              <span>{row.websiteQuality ?? "Unknown"}</span>
              <span>{row._count._all}</span>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

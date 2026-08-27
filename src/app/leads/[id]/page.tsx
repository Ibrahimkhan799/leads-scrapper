"use client";

import { use, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/input";
import { categoryLabel, categoryVariant } from "@/components/leads/category";
import { Skeleton } from "@/components/ui/skeleton";

export default function LeadDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const query = useQuery({
    queryKey: ["lead", id],
    queryFn: () => fetch(`/api/leads/${id}`).then(async (res) => {
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Not found");
      return data;
    }),
  });
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState("");

  if (query.isLoading) return <Skeleton className="h-96" />;
  if (query.error || !query.data) return <div>Lead not found.</div>;

  const lead = query.data;
  const score = lead.scores?.[0];
  const audit = lead.websites?.[0]?.audits?.[0];
  const ai = lead.aiAnalyses?.[0];

  async function patch(body: Record<string, unknown>) {
    const response = await fetch(`/api/leads/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!response.ok) toast.error("Update failed");
    else {
      toast.success("Saved");
      query.refetch();
    }
  }

  async function action(path: string, label: string) {
    const response = await fetch(path, { method: "POST" });
    if (!response.ok) toast.error(`${label} failed`);
    else {
      toast.success(label);
      query.refetch();
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link href="/leads" className="text-xs text-muted-foreground hover:underline">← Leads</Link>
          <h1 className="text-2xl font-semibold tracking-tight">{lead.name}</h1>
          <p className="text-sm text-muted-foreground">
            {lead.businessType} · {[lead.area, lead.city, lead.country].filter(Boolean).join(", ")}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge variant={categoryVariant(lead.leadCategory)} className="text-sm">
            {categoryLabel(lead.leadCategory)} {lead.leadScore}/100
          </Badge>
          <Button size="sm" variant="outline" onClick={() => action(`/api/leads/${id}/enrich`, "Re-enrich queued")}>Re-enrich</Button>
          <Button size="sm" variant="outline" onClick={() => action(`/api/leads/${id}/rescore`, "Recalculated")}>Recalculate score</Button>
          <Button size="sm" variant="outline" onClick={() => action(`/api/leads/${id}/analyze`, "AI analysis done")}>AI analyze</Button>
        </div>
      </div>
      <Tabs defaultValue="overview">
        <TabsList>
          {["overview","contact","website","social","intelligence","audit","score","ai","activity","raw"].map((tab) => (
            <TabsTrigger key={tab} value={tab}>{tab}</TabsTrigger>
          ))}
        </TabsList>
        <TabsContent value="overview">
          <div className="grid gap-3 md:grid-cols-3">
            <Stat label="Rating" value={lead.rating ?? "—"} />
            <Stat label="Reviews" value={lead.reviewCount ?? "—"} />
            <Stat label="Website" value={lead.websiteUrl ?? "None"} />
            <Stat label="Opportunity" value={lead.websiteOpportunity ?? "—"} />
            <Stat label="Instagram" value={lead.instagram ?? "—"} />
            <Stat label="WhatsApp" value={lead.whatsapp ?? "—"} />
          </div>
          <Card className="mt-3">
            <CardHeader><CardTitle>CRM</CardTitle></CardHeader>
            <CardContent className="grid gap-3 md:grid-cols-2">
              <label className="text-xs">
                Status
                <select className="mt-1 h-8 w-full rounded-md border border-input bg-card px-2" defaultValue={lead.contactStatus} onChange={(e) => setStatus(e.target.value)}>
                  {["NEW","QUALIFIED","CONTACTED","FOLLOW_UP","INTERESTED","NOT_INTERESTED","CLIENT","CLOSED","DO_NOT_CONTACT"].map((item) => (
                    <option key={item}>{item}</option>
                  ))}
                </select>
              </label>
              <div className="md:col-span-2">
                <Textarea defaultValue={lead.notes ?? ""} onChange={(e) => setNotes(e.target.value)} placeholder="Notes" />
              </div>
              <Button onClick={() => patch({ contactStatus: status || lead.contactStatus, notes: notes || lead.notes })}>Save</Button>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="contact">
          <Card className="p-4 text-sm space-y-2">
            <Row label="Phone" value={lead.phone} />
            <Row label="Email" value={lead.email} />
            <Row label="WhatsApp" value={lead.whatsapp} />
            <Row label="Address" value={lead.address} />
            {(lead.contacts ?? []).map((contact: { id: string; type: string; value: string; source?: string; confidence?: number }) => (
              <div key={contact.id} className="text-xs text-muted-foreground">
                {contact.type}: {contact.value} · {contact.source} · {contact.confidence}
              </div>
            ))}
          </Card>
        </TabsContent>
        <TabsContent value="website">
          <Card className="p-4 text-sm space-y-2">
            <Row label="URL" value={lead.websiteUrl} />
            <Row label="Status" value={lead.websiteStatus} />
            <Row label="Quality" value={lead.websiteQuality} />
            <Row label="Booking" value={lead.bookingUrl} />
          </Card>
        </TabsContent>
        <TabsContent value="social">
          <Card className="p-4 text-sm space-y-2">
            {(lead.socialProfiles ?? []).length === 0 && <div>No social profiles stored.</div>}
            {(lead.socialProfiles ?? []).map((profile: { id: string; platform: string; url: string; handle?: string }) => (
              <Row key={profile.id} label={profile.platform} value={profile.url} />
            ))}
          </Card>
        </TabsContent>
        <TabsContent value="intelligence">
          <Card className="p-4 text-sm space-y-2">
            {(lead.signals ?? []).map((signal: { id: string; key: string; value: unknown }) => (
              <Row key={signal.id} label={signal.key} value={JSON.stringify(signal.value)} />
            ))}
            {(lead.signals ?? []).length === 0 && <div>No dynamic signals detected yet.</div>}
          </Card>
        </TabsContent>
        <TabsContent value="audit">
          <Card className="p-4 text-sm grid gap-2 md:grid-cols-2">
            {audit ? Object.entries(audit).filter(([key]) => !["id","websiteId","raw","createdAt"].includes(key)).map(([key, value]) => (
              <Row key={key} label={key} value={String(value)} />
            )) : "No audit yet."}
          </Card>
        </TabsContent>
        <TabsContent value="score">
          <Card className="p-4">
            <div className="text-3xl font-semibold">{lead.leadScore}/100</div>
            <div className="mt-3 space-y-1 text-sm">
              {(score?.reasons ?? []).map((reason: { ruleId: string; label: string; points: number }) => (
                <div key={reason.ruleId}>+{reason.points} {reason.label}</div>
              ))}
            </div>
          </Card>
        </TabsContent>
        <TabsContent value="ai">
          <Card className="p-4 text-sm space-y-2">
            {ai ? (
              <>
                <Row label="Classification" value={ai.classification} />
                <Row label="Opportunity" value={ai.opportunity} />
                <Row label="Weaknesses" value={ai.websiteWeaknessSummary} />
                <pre className="overflow-auto rounded-md bg-muted p-3 text-xs">{JSON.stringify(ai.salesInsight, null, 2)}</pre>
              </>
            ) : (
              "No AI analysis yet. Run it for HOT and HIGH leads."
            )}
          </Card>
        </TabsContent>
        <TabsContent value="activity">
          <Card className="p-4 text-sm space-y-2">
            {(lead.activities ?? []).map((item: { id: string; type: string; message: string; createdAt: string }) => (
              <div key={item.id} className="border-b border-border py-2">
                <div>{item.message}</div>
                <div className="text-xs text-muted-foreground">{item.type} · {new Date(item.createdAt).toLocaleString()}</div>
              </div>
            ))}
          </Card>
        </TabsContent>
        <TabsContent value="raw">
          <pre className="overflow-auto rounded-xl border border-border bg-card p-4 text-xs">
            {JSON.stringify(lead.discoverySources ?? lead, null, 2)}
          </pre>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: unknown }) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className="mt-1 text-sm font-medium break-all">{String(value)}</div>
      </CardContent>
    </Card>
  );
}

function Row({ label, value }: { label: string; value: unknown }) {
  return (
    <div>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="break-all">{value ? String(value) : "—"}</div>
    </div>
  );
}

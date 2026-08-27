"use client";

import * as React from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { categoryLabel, categoryVariant } from "@/components/leads/category";

interface Lead {
  id: string;
  name: string;
  businessType: string;
  country: string | null;
  city: string | null;
  rating: number | null;
  reviewCount: number | null;
  websiteUrl: string | null;
  websiteQuality: string | null;
  email: string | null;
  phone: string | null;
  whatsapp: string | null;
  instagram: string | null;
  bookingUrl: string | null;
  contactStatus: string;
  leadScore: number;
  leadCategory: "HOT" | "HIGH" | "MEDIUM" | "LOW";
}

export default function LeadsPage() {
  const [filters, setFilters] = React.useState({
    q: "",
    businessType: "",
    country: "",
    city: "",
    leadCategory: "",
    hasWebsite: "",
    hasEmail: "",
    hasWhatsapp: "",
    hasInstagram: "",
    hasBooking: "",
    contactStatus: "",
    minScore: "",
    minReviews: "",
    page: 1,
    sort: "leadScore",
    order: "desc" as "asc" | "desc",
  });
  const [selected, setSelected] = React.useState<string[]>([]);

  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value) params.set(key, String(value));
  });
  params.set("pageSize", "25");

  const query = useQuery({
    queryKey: ["leads", filters],
    queryFn: () => fetch(`/api/leads?${params}`).then((res) => res.json()),
  });

  const items: Lead[] = query.data?.items ?? [];
  const exportQuery = params.toString();

  async function bulkStatus(contactStatus: string) {
    if (!selected.length) return;
    const response = await fetch("/api/leads/bulk", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: selected, contactStatus }),
    });
    if (!response.ok) {
      toast.error("Bulk update failed");
      return;
    }
    toast.success("Status updated");
    setSelected([]);
    query.refetch();
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Leads</h1>
          <p className="text-sm text-muted-foreground">{query.data?.total ?? 0} businesses in the pipeline</p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <a href={`/api/export?${exportQuery}`}>Export filtered CSV</a>
          </Button>
          <Button asChild variant="outline">
            <a href={selected.length ? `/api/export?ids=${selected.join(",")}` : `/api/export`}>
              {selected.length ? "Export selected" : "Export all"}
            </a>
          </Button>
        </div>
      </div>
      <Card className="p-3">
        <div className="grid gap-2 md:grid-cols-4 xl:grid-cols-6">
          <Input placeholder="Search" value={filters.q} onChange={(e) => setFilters({ ...filters, q: e.target.value, page: 1 })} />
          <Input placeholder="Business type" value={filters.businessType} onChange={(e) => setFilters({ ...filters, businessType: e.target.value, page: 1 })} />
          <Input placeholder="Country" value={filters.country} onChange={(e) => setFilters({ ...filters, country: e.target.value, page: 1 })} />
          <Input placeholder="City" value={filters.city} onChange={(e) => setFilters({ ...filters, city: e.target.value, page: 1 })} />
          <select className="h-8 rounded-md border border-input bg-card px-2 text-sm" value={filters.leadCategory} onChange={(e) => setFilters({ ...filters, leadCategory: e.target.value, page: 1 })}>
            <option value="">All categories</option>
            <option value="HOT">HOT</option>
            <option value="HIGH">HIGH</option>
            <option value="MEDIUM">MEDIUM</option>
            <option value="LOW">LOW</option>
          </select>
          <select className="h-8 rounded-md border border-input bg-card px-2 text-sm" value={filters.hasWebsite} onChange={(e) => setFilters({ ...filters, hasWebsite: e.target.value, page: 1 })}>
            <option value="">Website: any</option>
            <option value="true">Has website</option>
            <option value="false">No website</option>
          </select>
          <select className="h-8 rounded-md border border-input bg-card px-2 text-sm" value={filters.hasEmail} onChange={(e) => setFilters({ ...filters, hasEmail: e.target.value, page: 1 })}>
            <option value="">Email: any</option>
            <option value="true">Has email</option>
          </select>
          <select className="h-8 rounded-md border border-input bg-card px-2 text-sm" value={filters.hasWhatsapp} onChange={(e) => setFilters({ ...filters, hasWhatsapp: e.target.value, page: 1 })}>
            <option value="">WhatsApp: any</option>
            <option value="true">Has WhatsApp</option>
          </select>
          <select className="h-8 rounded-md border border-input bg-card px-2 text-sm" value={filters.hasInstagram} onChange={(e) => setFilters({ ...filters, hasInstagram: e.target.value, page: 1 })}>
            <option value="">Instagram: any</option>
            <option value="true">Has Instagram</option>
          </select>
          <select className="h-8 rounded-md border border-input bg-card px-2 text-sm" value={filters.hasBooking} onChange={(e) => setFilters({ ...filters, hasBooking: e.target.value, page: 1 })}>
            <option value="">Booking: any</option>
            <option value="true">Has booking</option>
            <option value="false">No booking</option>
          </select>
          <select className="h-8 rounded-md border border-input bg-card px-2 text-sm" value={filters.contactStatus} onChange={(e) => setFilters({ ...filters, contactStatus: e.target.value, page: 1 })}>
            <option value="">Status: any</option>
            {["NEW","QUALIFIED","CONTACTED","FOLLOW_UP","INTERESTED","NOT_INTERESTED","CLIENT","CLOSED","DO_NOT_CONTACT"].map((status) => (
              <option key={status}>{status}</option>
            ))}
          </select>
          <Input placeholder="Min score" value={filters.minScore} onChange={(e) => setFilters({ ...filters, minScore: e.target.value, page: 1 })} />
        </div>
      </Card>
      {selected.length > 0 && (
        <div className="flex items-center gap-2 text-sm">
          <span>{selected.length} selected</span>
          <Button size="sm" variant="outline" onClick={() => bulkStatus("CONTACTED")}>Mark contacted</Button>
          <Button size="sm" variant="outline" onClick={() => bulkStatus("QUALIFIED")}>Mark qualified</Button>
          <Button size="sm" variant="outline" onClick={() => bulkStatus("DO_NOT_CONTACT")}>Do not contact</Button>
        </div>
      )}
      <Card className="overflow-hidden">
        <div className="overflow-auto">
          <table className="w-full min-w-[1100px] text-left text-sm">
            <thead className="bg-muted/60 text-xs text-muted-foreground">
              <tr>
                <th className="p-2"><Checkbox checked={selected.length > 0 && selected.length === items.length} onCheckedChange={(checked) => setSelected(checked ? items.map((item) => item.id) : [])} /></th>
                {["Score","Business","Type","Country","City","Rating","Reviews","Website","Quality","Email","Phone","WhatsApp","Instagram","Booking","Status"].map((col) => (
                  <th key={col} className="p-2 font-medium">{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {query.isLoading && (
                <tr><td colSpan={16} className="p-3"><Skeleton className="h-8 w-full" /></td></tr>
              )}
              {!query.isLoading && items.length === 0 && (
                <tr>
                  <td colSpan={16} className="p-10 text-center text-sm text-muted-foreground">
                    No leads yet. Generate a search to populate the pipeline.
                  </td>
                </tr>
              )}
              {items.map((lead) => (
                <tr key={lead.id} className="border-t border-border hover:bg-muted/40">
                  <td className="p-2">
                    <Checkbox
                      checked={selected.includes(lead.id)}
                      onCheckedChange={(checked) =>
                        setSelected(checked ? [...selected, lead.id] : selected.filter((id) => id !== lead.id))
                      }
                    />
                  </td>
                  <td className="p-2">
                    <Badge variant={categoryVariant(lead.leadCategory)}>
                      {lead.leadScore} {lead.leadCategory}
                    </Badge>
                  </td>
                  <td className="p-2">
                    <Link className="font-medium hover:underline" href={`/leads/${lead.id}`}>{lead.name}</Link>
                  </td>
                  <td className="p-2">{lead.businessType}</td>
                  <td className="p-2">{lead.country ?? "—"}</td>
                  <td className="p-2">{lead.city ?? "—"}</td>
                  <td className="p-2">{lead.rating ?? "—"}</td>
                  <td className="p-2">{lead.reviewCount ?? "—"}</td>
                  <td className="p-2">{lead.websiteUrl ? "Yes" : "None"}</td>
                  <td className="p-2">{lead.websiteQuality ?? "—"}</td>
                  <td className="p-2">{lead.email ? "Yes" : "—"}</td>
                  <td className="p-2">{lead.phone ? "Yes" : "—"}</td>
                  <td className="p-2">{lead.whatsapp ? "Yes" : "—"}</td>
                  <td className="p-2">{lead.instagram ? "Yes" : "—"}</td>
                  <td className="p-2">{lead.bookingUrl ? "Yes" : "—"}</td>
                  <td className="p-2">{lead.contactStatus}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between border-t border-border px-3 py-2 text-xs">
          <span>{categoryLabel("HOT")} {categoryLabel("HIGH")} ranked by website opportunity</span>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" disabled={filters.page <= 1} onClick={() => setFilters({ ...filters, page: filters.page - 1 })}>Previous</Button>
            <span className="px-2 py-1">Page {filters.page} / {query.data?.pageCount || 1}</span>
            <Button size="sm" variant="outline" disabled={filters.page >= (query.data?.pageCount || 1)} onClick={() => setFilters({ ...filters, page: filters.page + 1 })}>Next</Button>
          </div>
        </div>
      </Card>
    </div>
  );
}

"use client";

import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function SavedSearchesPage() {
  const router = useRouter();
  const query = useQuery({
    queryKey: ["saved-searches"],
    queryFn: () => fetch("/api/saved-searches").then((res) => res.json()),
  });
  const templates = useQuery({
    queryKey: ["templates"],
    queryFn: () => fetch("/api/templates").then((res) => res.json()),
  });

  async function saveFromTemplate(template: { name: string; config: object }) {
    const response = await fetch("/api/saved-searches", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: template.name, config: template.config }),
    });
    if (!response.ok) toast.error("Could not save");
    else {
      toast.success("Saved");
      query.refetch();
    }
  }

  async function run(config: Record<string, unknown>) {
    const response = await fetch("/api/leads/discover", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        businessType: config.businessType,
        city: config.city,
        country: config.country,
        keywords: config.keywords ?? [],
        maxLeads: config.maxLeads ?? 50,
      }),
    });
    const data = await response.json();
    if (!response.ok) toast.error(data.error || "Failed");
    else router.push(`/jobs/${data.jobId}`);
  }

  async function duplicate(item: { name: string; config: object }) {
    await fetch("/api/saved-searches", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: `${item.name} copy`, config: item.config }),
    });
    query.refetch();
  }

  async function remove(id: string) {
    await fetch(`/api/saved-searches?id=${id}`, { method: "DELETE" });
    query.refetch();
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold tracking-tight">Saved searches</h1>
      <div className="grid gap-3 md:grid-cols-2">
        {(query.data?.items ?? []).map((item: { id: string; name: string; config: Record<string, unknown> }) => (
          <Card key={item.id}>
            <CardHeader><CardTitle>{item.name}</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <pre className="overflow-auto rounded-md bg-muted p-2 text-xs">{JSON.stringify(item.config, null, 2)}</pre>
              <div className="flex gap-2">
                <Button size="sm" onClick={() => run(item.config)}>Run</Button>
                <Button size="sm" variant="outline" onClick={() => duplicate(item)}>Duplicate</Button>
                <Button size="sm" variant="destructive" onClick={() => remove(item.id)}>Delete</Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      <h2 className="text-sm font-semibold">Templates</h2>
      <div className="flex flex-wrap gap-2">
        {(templates.data?.items ?? []).map((template: { name: string; config: object }) => (
          <Button key={template.name} variant="outline" size="sm" onClick={() => saveFromTemplate(template)}>
            Save “{template.name}”
          </Button>
        ))}
      </div>
    </div>
  );
}

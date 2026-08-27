"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";

export default function SettingsPage() {
  const query = useQuery({
    queryKey: ["settings"],
    queryFn: () => fetch("/api/settings").then((res) => res.json()),
  });
  const [draft, setDraft] = useState<string>();
  if (query.isLoading || !query.data) return <Skeleton className="h-80" />;
  const settings = draft ? JSON.parse(draft) : query.data;

  async function save() {
    const response = await fetch("/api/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(settings),
    });
    if (!response.ok) toast.error("Could not save settings");
    else toast.success("Settings saved");
  }

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <h1 className="text-xl font-semibold tracking-tight">Settings</h1>
      <Card>
        <CardHeader><CardTitle>Discovery</CardTitle></CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2">
          <label className="text-xs">Provider
            <select className="mt-1 h-8 w-full rounded-md border border-input bg-card px-2" value={settings.discovery.provider} onChange={(e) => setDraft(JSON.stringify({ ...settings, discovery: { ...settings.discovery, provider: e.target.value } }))}>
              <option value="auto">Auto (OpenStreetMap, free)</option>
              <option value="openstreetmap">OpenStreetMap (free)</option>
              <option value="mock">Mock</option>
              <option value="google-places">Google Places (paid)</option>
            </select>
          </label>
          <label className="text-xs">Max results
            <Input type="number" value={settings.discovery.maxResults} onChange={(e) => setDraft(JSON.stringify({ ...settings, discovery: { ...settings.discovery, maxResults: Number(e.target.value) } }))} />
          </label>
          <label className="flex items-center justify-between text-sm md:col-span-2">
            Query expansion
            <Switch checked={settings.discovery.queryExpansion} onCheckedChange={(checked) => setDraft(JSON.stringify({ ...settings, discovery: { ...settings.discovery, queryExpansion: checked } }))} />
          </label>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Scraping</CardTitle></CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-3">
          {(["concurrency","delayMs","timeoutMs","maxPages","maxDepth","retries"] as const).map((key) => (
            <label key={key} className="text-xs">
              {key}
              <Input type="number" value={settings.scraping[key]} onChange={(e) => setDraft(JSON.stringify({ ...settings, scraping: { ...settings.scraping, [key]: Number(e.target.value) } }))} />
            </label>
          ))}
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Scoring rules</CardTitle></CardHeader>
        <CardContent>
          <Textarea
            className="min-h-48 font-mono text-xs"
            value={JSON.stringify(settings.scoring, null, 2)}
            onChange={(e) => {
              try {
                setDraft(JSON.stringify({ ...settings, scoring: JSON.parse(e.target.value) }));
              } catch {
                // keep typing
              }
            }}
          />
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>AI</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <label className="flex items-center justify-between text-sm">
            Enable AI
            <Switch checked={settings.ai.enabled} onCheckedChange={(checked) => setDraft(JSON.stringify({ ...settings, ai: { ...settings.ai, enabled: checked } }))} />
          </label>
          <p className="text-xs text-muted-foreground">
            API keys are stored in server environment variables and are never sent to the browser.
          </p>
        </CardContent>
      </Card>
      <Button onClick={save}>Save settings</Button>
    </div>
  );
}

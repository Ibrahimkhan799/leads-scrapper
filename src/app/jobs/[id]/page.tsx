"use client";

import { use } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/skeleton";
import { Skeleton } from "@/components/ui/skeleton";

export default function JobDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const query = useQuery({
    queryKey: ["job", id],
    queryFn: () => fetch(`/api/jobs/${id}`).then((res) => res.json()),
    refetchInterval: (q) => {
      const status = q.state.data?.status;
      return status === "RUNNING" || status === "QUEUED" ? 1500 : false;
    },
  });

  if (query.isLoading || !query.data) return <Skeleton className="h-80" />;
  const job = query.data;
  const result = (job.result ?? {}) as Record<string, number>;

  async function act(path: string, label: string) {
    const response = await fetch(path, { method: "POST" });
    if (!response.ok) toast.error(`${label} failed`);
    else {
      toast.success(label);
      query.refetch();
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Generating leads</h1>
          <p className="text-sm text-muted-foreground">{job.type} · {id.slice(0, 10)}</p>
        </div>
        <div className="flex gap-2">
          <Badge variant="secondary">{job.status}</Badge>
          {(job.status === "RUNNING" || job.status === "QUEUED") && (
            <Button size="sm" variant="outline" onClick={() => act(`/api/jobs/${id}/cancel`, "Cancelled")}>Cancel</Button>
          )}
          {(job.status === "FAILED" || job.status === "CANCELLED" || job.status === "COMPLETED") && (
            <Button size="sm" variant="outline" onClick={() => act(`/api/jobs/${id}/retry`, "Retry queued")}>Retry</Button>
          )}
          <Button size="sm" variant="outline" onClick={() => act(`/api/jobs/${id}/retry?failed=true`, "Retry failed queued")}>Retry failed</Button>
        </div>
      </div>
      <Card>
        <CardContent className="space-y-3 p-4">
          <div className="flex items-center justify-between text-sm">
            <span>{job.progress}%</span>
            <span className="text-muted-foreground">{job.processed}/{job.total || "—"} processed · {job.failed} failed</span>
          </div>
          <Progress value={job.progress} />
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Metric label="Businesses discovered" value={result.discovered ?? job.processed} />
            <Metric label="Duplicates removed" value={result.duplicatesRemoved ?? 0} />
            <Metric label="Websites found" value={result.websitesFound ?? 0} />
            <Metric label="Emails found" value={result.emailsFound ?? 0} />
            <Metric label="WhatsApp found" value={result.whatsappFound ?? 0} />
            <Metric label="HOT" value={result.hot ?? 0} />
            <Metric label="HIGH" value={result.high ?? 0} />
            <Metric label="MEDIUM / LOW" value={`${result.medium ?? 0} / ${result.low ?? 0}`} />
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Logs</CardTitle></CardHeader>
        <CardContent className="max-h-80 overflow-auto font-mono text-xs space-y-1">
          {(job.logs ?? []).map((log: { id: string; level: string; message: string; createdAt: string }) => (
            <div key={log.id}>
              <span className="text-muted-foreground">{new Date(log.createdAt).toLocaleTimeString()} [{log.level}]</span> {log.message}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: unknown }) {
  return (
    <div className="rounded-lg border border-border p-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-lg font-semibold tabular-nums">{String(value)}</div>
    </div>
  );
}

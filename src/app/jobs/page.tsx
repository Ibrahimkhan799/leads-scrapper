"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/skeleton";

export default function JobsPage() {
  const query = useQuery({
    queryKey: ["jobs"],
    queryFn: () => fetch("/api/jobs").then((res) => res.json()),
    refetchInterval: 3000,
  });
  const items = query.data?.items ?? [];

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Jobs</h1>
        <p className="text-sm text-muted-foreground">Background discovery, enrichment, and scoring.</p>
      </div>
      <Card className="overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/60 text-xs text-muted-foreground">
            <tr>
              {["Job", "Type", "Status", "Progress", "Processed", "Failed", "Started"].map((col) => (
                <th key={col} className="p-2 text-left font-medium">{col}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {items.length === 0 && (
              <tr><td colSpan={7} className="p-8 text-center text-muted-foreground">No jobs yet.</td></tr>
            )}
            {items.map((job: { id: string; type: string; status: string; progress: number; processed: number; failed: number; startedAt?: string }) => (
              <tr key={job.id} className="border-t border-border">
                <td className="p-2"><Link className="hover:underline" href={`/jobs/${job.id}`}>{job.id.slice(0, 8)}</Link></td>
                <td className="p-2">{job.type}</td>
                <td className="p-2"><Badge variant="secondary">{job.status}</Badge></td>
                <td className="p-2 w-48"><Progress value={job.progress} /></td>
                <td className="p-2">{job.processed}</td>
                <td className="p-2">{job.failed}</td>
                <td className="p-2 text-xs text-muted-foreground">{job.startedAt ? new Date(job.startedAt).toLocaleString() : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

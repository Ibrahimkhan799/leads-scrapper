"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const COLORS = ["#0f766e", "#f43f5e", "#10b981", "#f59e0b", "#64748b", "#6366f1"];

export default function DashboardPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["analytics"],
    queryFn: () => fetch("/api/analytics").then((res) => res.json()),
  });

  if (isLoading || !data) {
    return (
      <div className="grid gap-3 md:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-24" />
        ))}
      </div>
    );
  }

  const totals = data.totals;
  const cards = [
    ["Total leads", totals.total],
    ["Hot leads", totals.hot],
    ["High leads", totals.high],
    ["No website", totals.noWebsite],
    ["Poor websites", totals.poorWebsites],
    ["Emails found", totals.emails],
    ["WhatsApp found", totals.whatsapp],
    ["Jobs running", totals.jobsRunning],
  ];

  return (
    <div className="space-y-5">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Website-development prospects across every local business category.
          </p>
        </div>
        <Link href="/generate" className="text-sm text-primary hover:underline">
          Generate leads →
        </Link>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map(([label, value]) => (
          <Card key={label}>
            <CardContent className="p-4">
              <div className="text-xs text-muted-foreground">{label}</div>
              <div className="mt-1 text-2xl font-semibold tabular-nums">{value}</div>
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="grid gap-3 lg:grid-cols-2">
        <ChartCard title="Leads by country" data={toChart(data.byCountry, "country")} />
        <ChartCard title="Leads by business type" data={toChart(data.byType, "businessType")} />
        <ChartCard title="Leads by city" data={toChart(data.byCity, "city")} />
        <Card>
          <CardHeader>
            <CardTitle>Lead categories</CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={toChart(data.scoreBuckets, "leadCategory")} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80}>
                  {toChart(data.scoreBuckets, "leadCategory").map((_, index) => (
                    <Cell key={index} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function toChart(rows: Array<Record<string, unknown>>, key: string) {
  return (rows ?? []).map((row) => ({
    name: String(row[key] ?? "Unknown"),
    value: Number((row._count as { _all?: number })?._all ?? 0),
  }));
}

function ChartCard({ title, data }: { title: string; data: Array<{ name: string; value: number }> }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="name" tick={{ fontSize: 11 }} interval={0} angle={-20} textAnchor="end" height={60} />
            <YAxis allowDecimals={false} width={32} />
            <Tooltip />
            <Bar dataKey="value" fill="#0f766e" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

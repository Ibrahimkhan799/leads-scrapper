"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { categoryVariant } from "@/components/leads/category";

interface Hit {
  id: string;
  name: string;
  businessType: string;
  city: string | null;
  country: string | null;
  leadScore: number;
  leadCategory: "HOT" | "HIGH" | "MEDIUM" | "LOW";
}

export function CommandPalette({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [query, setQuery] = React.useState("");
  const [items, setItems] = React.useState<Hit[]>([]);
  const router = useRouter();

  React.useEffect(() => {
    if (!open) return;
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`, {
        signal: controller.signal,
      });
      const data = await response.json();
      setItems(data.items ?? []);
    }, 150);
    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [query, open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="p-0">
        <DialogTitle className="sr-only">Search leads</DialogTitle>
        <div className="border-b border-border p-2">
          <Input
            autoFocus
            placeholder="Search businesses, cities, emails, Instagram…"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>
        <div className="max-h-80 overflow-auto p-1">
          {items.length === 0 ? (
            <div className="px-3 py-8 text-center text-sm text-muted-foreground">
              {query ? "No matches" : "Type to search the lead database"}
            </div>
          ) : (
            items.map((item) => (
              <button
                key={item.id}
                className="flex w-full items-center justify-between rounded-md px-3 py-2 text-left hover:bg-muted"
                onClick={() => {
                  onOpenChange(false);
                  router.push(`/leads/${item.id}`);
                }}
              >
                <div>
                  <div className="text-sm font-medium">{item.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {item.businessType} · {[item.city, item.country].filter(Boolean).join(", ")}
                  </div>
                </div>
                <Badge variant={categoryVariant(item.leadCategory)}>{item.leadScore}</Badge>
              </button>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

export default function TagsPage() {
  const query = useQuery({
    queryKey: ["tags"],
    queryFn: () => fetch("/api/tags").then((res) => res.json()),
  });
  const [name, setName] = useState("");

  async function create() {
    const response = await fetch("/api/tags", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    if (!response.ok) toast.error("Could not create tag");
    else {
      setName("");
      query.refetch();
    }
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold tracking-tight">Tags</h1>
      <div className="flex gap-2">
        <Input value={name} placeholder="Dubai, No Website, High Value…" onChange={(e) => setName(e.target.value)} />
        <Button onClick={create}>Create tag</Button>
      </div>
      <Card className="flex flex-wrap gap-2 p-4">
        {(query.data?.items ?? []).map((tag: { id: string; name: string }) => (
          <Badge key={tag.id} variant="secondary">{tag.name}</Badge>
        ))}
        {(query.data?.items ?? []).length === 0 && <div className="text-sm text-muted-foreground">No tags yet.</div>}
      </Card>
    </div>
  );
}

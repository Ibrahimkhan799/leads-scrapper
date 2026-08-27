"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Briefcase,
  Compass,
  LayoutDashboard,
  ListTodo,
  Search,
  Settings,
  Sparkles,
  Tags,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { CommandPalette } from "@/components/layout/command-palette";

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/generate", label: "Generate Leads", icon: Sparkles },
  { href: "/leads", label: "Leads", icon: Briefcase },
  { href: "/jobs", label: "Jobs", icon: ListTodo },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/saved-searches", label: "Saved Searches", icon: Compass },
  { href: "/tags", label: "Tags", icon: Tags },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="hidden w-56 shrink-0 border-r border-border bg-sidebar md:flex md:flex-col">
        <div className="flex h-12 items-center gap-2 px-4">
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary text-[11px] font-bold text-primary-foreground">
            L
          </div>
          <div>
            <div className="text-sm font-semibold leading-none">LeadIntel</div>
            <div className="text-[10px] text-muted-foreground">Local lead intelligence</div>
          </div>
        </div>
        <nav className="flex flex-1 flex-col gap-0.5 p-2">
          {NAV.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-2 rounded-md px-2 py-1.5 text-[13px] text-muted-foreground hover:bg-muted hover:text-foreground",
                  active && "bg-accent text-accent-foreground"
                )}
              >
                <item.icon className="h-3.5 w-3.5" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="flex items-center justify-between px-3 py-3 text-[11px] text-muted-foreground">
          <button className="inline-flex items-center gap-1" onClick={() => setOpen(true)}>
            <Search className="h-3 w-3" />
            Search
            <kbd className="rounded border border-border px-1">⌘K</kbd>
          </button>
          <ThemeToggle />
        </div>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-12 items-center justify-between border-b border-border px-4 md:hidden">
          <div className="text-sm font-semibold">LeadIntel</div>
          <ThemeToggle />
        </header>
        <main className="flex-1 p-4 md:p-6">{children}</main>
      </div>
      <CommandPalette open={open} onOpenChange={setOpen} />
    </div>
  );
}

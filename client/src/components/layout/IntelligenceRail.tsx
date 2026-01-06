import { cn } from "@/lib/utils";

interface IntelligenceRailProps {
  collapsed: boolean;
  onToggle: () => void;
}

export function IntelligenceRail({ collapsed, onToggle }: IntelligenceRailProps) {
  return (
    <aside
      className={cn(
        "relative h-full border border-border bg-card text-foreground",
        "transition-all duration-200 ease-out",
        collapsed ? "w-full lg:w-16" : "w-full"
      )}
      aria-label="Right-hand intelligence rail"
    >
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <p className={cn("text-sm font-semibold", collapsed && "sr-only")}>
          Intelligence Rail
        </p>
        <button
          type="button"
          onClick={onToggle}
          className="rounded border border-border px-2 py-1 text-xs uppercase tracking-wide text-muted-foreground transition-colors hover:text-foreground"
          aria-expanded={!collapsed}
          aria-label={collapsed ? "Expand intelligence rail" : "Collapse intelligence rail"}
        >
          {collapsed ? "Open" : "Collapse"}
        </button>
      </div>

      <div className={cn("space-y-6 px-4 py-4 text-sm", collapsed && "sr-only")}>
        <section>
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Definitions
          </h3>
          <p className="mt-2 text-sm text-muted-foreground">
            All risk grades map to ABFI methodology v1.0. Scores reflect verified
            supply, financial resilience, and registry standing.
          </p>
        </section>

        <section>
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Confidence Interval
          </h3>
          <p className="mt-2 text-sm text-muted-foreground">
            85% confidence band across validated inputs. Variance beyond threshold
            triggers regulatory review.
          </p>
        </section>

        <section>
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Regulatory Notes
          </h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Data aligns with AU FRR reporting guidance. Immutable audit trails are
            enforced for all assessments.
          </p>
        </section>

        <section>
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Why this matters for finance
          </h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Registry-backed metrics allow underwriting teams to price exposure with
            traceable, regulator-ready evidence.
          </p>
        </section>
      </div>
    </aside>
  );
}

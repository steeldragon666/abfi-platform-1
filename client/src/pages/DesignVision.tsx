import {
  ArrowUpRight,
  BadgeCheck,
  Bell,
  CircleDot,
  CloudDownload,
  Filter,
  LineChart,
  ListFilter,
  RefreshCw,
  Search,
  Settings2,
  ShieldAlert,
  SlidersHorizontal,
  Star,
  TrendingUp,
} from "lucide-react";

const marketSignals = [
  { label: "Hydrogen Spot Index", value: "102.4", delta: "Stable" },
  { label: "Green Ammonia Forward", value: "98.1", delta: "Moderate" },
  { label: "Registry Coverage", value: "86%", delta: "Verified" },
  { label: "Risk Heat", value: "Low", delta: "Contained" },
];

const registryRows = [
  {
    asset: "Pilbara Feedstock Corridor",
    score: "AA",
    confidence: "0.87",
    range: "92–108",
    status: "Verified",
  },
  {
    asset: "Northern Basin Biomass",
    score: "A",
    confidence: "0.81",
    range: "88–101",
    status: "Review",
  },
  {
    asset: "Mallee Agri Credits",
    score: "BBB",
    confidence: "0.73",
    range: "79–95",
    status: "Verified",
  },
];

export default function DesignVision() {
  return (
    <div className="relative space-y-6">
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden rounded-3xl">
        <div className="absolute -left-24 top-6 h-72 w-72 rounded-full bg-[radial-gradient(circle_at_center,rgba(47,74,96,0.45),transparent_65%)] blur-2xl" />
        <div className="absolute right-0 top-32 h-80 w-80 rounded-full bg-[radial-gradient(circle_at_center,rgba(58,95,82,0.45),transparent_60%)] blur-2xl" />
        <div className="absolute bottom-0 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full bg-[radial-gradient(circle_at_center,rgba(154,123,63,0.35),transparent_70%)] blur-2xl" />
      </div>

      <header className="flex flex-col gap-4 rounded-3xl border border-border bg-card/80 px-6 py-5 shadow-[0_18px_40px_rgba(0,0,0,0.35)] backdrop-blur">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-3">
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
              ABFI Platform Vision
            </p>
            <h1 className="text-xl font-semibold text-foreground">
              Sovereign Market Infrastructure — Unified Registry, Risk, and Market Access
            </h1>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-2 rounded-full border border-border bg-gradient-to-r from-background/80 via-background/50 to-transparent px-3 py-2 text-xs text-muted-foreground shadow-[0_0_0_1px_rgba(255,255,255,0.04)]">
              <Search className="h-4 w-4" />
              <span>Search registry, pricing, or assets</span>
            </div>
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-full border border-border bg-gradient-to-r from-background/80 via-background/50 to-transparent px-3 py-2 text-xs uppercase tracking-wide text-muted-foreground shadow-[0_0_0_1px_rgba(255,255,255,0.04)] hover:text-foreground"
            >
              <Bell className="h-4 w-4" />
              Alerts
            </button>
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-full border border-border bg-gradient-to-r from-primary via-primary to-[#2f4a60] px-3 py-2 text-xs uppercase tracking-wide text-primary-foreground shadow-[0_10px_20px_rgba(0,0,0,0.35)]"
            >
              <TrendingUp className="h-4 w-4" />
              Launch Market
            </button>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          A reference layout for a finance-grade operating system: exchange-grade
          market visibility, credit-style risk evaluation, and a registry-first audit trail.
        </p>
        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-background/60 px-3 py-1.5 shadow-[0_0_0_1px_rgba(255,255,255,0.04)]">
            <BadgeCheck className="h-4 w-4 text-foreground" />
            Verified data plane
          </span>
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-background/60 px-3 py-1.5 shadow-[0_0_0_1px_rgba(255,255,255,0.04)]">
            <ShieldAlert className="h-4 w-4 text-foreground" />
            Regulator-ready
          </span>
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-background/60 px-3 py-1.5 shadow-[0_0_0_1px_rgba(255,255,255,0.04)]">
            <CircleDot className="h-4 w-4 text-foreground" />
            Live market state
          </span>
        </div>
      </header>

      <section className="rounded-3xl border border-border bg-card/80 px-6 py-4 shadow-[0_18px_40px_rgba(0,0,0,0.35)] backdrop-blur">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              Market Signals
            </p>
            <p className="text-sm text-muted-foreground">
              Live registry-backed pricing and coverage indicators.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-full border border-border bg-background/60 px-3 py-2 text-xs uppercase tracking-wide text-muted-foreground shadow-[0_0_0_1px_rgba(255,255,255,0.04)] hover:text-foreground"
            >
              <LineChart className="h-4 w-4" />
              Analytics
            </button>
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-full border border-border bg-background/60 px-3 py-2 text-xs uppercase tracking-wide text-muted-foreground shadow-[0_0_0_1px_rgba(255,255,255,0.04)] hover:text-foreground"
            >
              <CloudDownload className="h-4 w-4" />
              Export
            </button>
          </div>
        </div>
        <div className="mt-4 grid gap-4 lg:grid-cols-4">
          {marketSignals.map((signal) => (
            <div
              key={signal.label}
              className="space-y-2 rounded-2xl border border-border bg-gradient-to-br from-background via-transparent to-black/40 px-4 py-4 shadow-[0_12px_24px_rgba(0,0,0,0.25)]"
            >
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                {signal.label}
              </p>
              <p className="text-2xl font-semibold text-foreground tabular-nums">
                {signal.value}
              </p>
              <p className="text-xs text-muted-foreground">{signal.delta}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-12">
        <div className="space-y-4 lg:col-span-7">
          <div className="rounded-3xl border border-border bg-card/80 px-6 py-5 shadow-[0_20px_45px_rgba(0,0,0,0.45)] backdrop-blur">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-foreground">Market Explorer</h2>
                <p className="text-xs text-muted-foreground">
                  Heatmap-first view with registry overlays and forward curves.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  className="inline-flex items-center gap-2 rounded-full border border-border bg-background/60 px-3 py-2 text-xs uppercase tracking-wide text-muted-foreground shadow-[0_0_0_1px_rgba(255,255,255,0.04)] hover:text-foreground"
                >
                  <Filter className="h-4 w-4" />
                  Filters
                </button>
                <button
                  type="button"
                  className="inline-flex items-center gap-2 rounded-full border border-border bg-background/60 px-3 py-2 text-xs uppercase tracking-wide text-muted-foreground shadow-[0_0_0_1px_rgba(255,255,255,0.04)] hover:text-foreground"
                >
                  <SlidersHorizontal className="h-4 w-4" />
                  Finance Mode
                </button>
              </div>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {["Heatmap", "Forward Curve", "Risk Bands", "Supply Coverage"].map((item) => (
                <div
                  key={item}
                  className="flex h-28 items-center justify-center rounded-2xl border border-dashed border-border bg-gradient-to-br from-background/40 via-transparent to-black/40 text-xs uppercase tracking-wide text-muted-foreground"
                >
                  {item}
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-border bg-card/80 px-6 py-5 shadow-[0_20px_45px_rgba(0,0,0,0.45)] backdrop-blur">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-foreground">Registry Table</h2>
                <p className="text-xs text-muted-foreground">
                  Immutable ledger entries with sortable confidence bands.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  className="inline-flex items-center gap-2 rounded-full border border-border bg-background/60 px-3 py-2 text-xs uppercase tracking-wide text-muted-foreground shadow-[0_0_0_1px_rgba(255,255,255,0.04)] hover:text-foreground"
                >
                  <Search className="h-4 w-4" />
                  Search
                </button>
                <button
                  type="button"
                  className="inline-flex items-center gap-2 rounded-full border border-border bg-background/60 px-3 py-2 text-xs uppercase tracking-wide text-muted-foreground shadow-[0_0_0_1px_rgba(255,255,255,0.04)] hover:text-foreground"
                >
                  <ListFilter className="h-4 w-4" />
                  Sort
                </button>
              </div>
            </div>
            <div className="mt-4 overflow-hidden rounded border border-border">
              <table className="w-full text-left text-sm">
                <thead className="bg-muted text-xs uppercase tracking-wide text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3">Asset</th>
                    <th className="px-4 py-3">ABFI Score</th>
                    <th className="px-4 py-3">Confidence</th>
                    <th className="px-4 py-3">Range</th>
                    <th className="px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {registryRows.map((row) => (
                    <tr key={row.asset} className="border-t border-border">
                      <td className="px-4 py-3 text-foreground">{row.asset}</td>
                      <td className="px-4 py-3 font-semibold text-foreground">{row.score}</td>
                      <td className="px-4 py-3 text-muted-foreground tabular-nums">
                        {row.confidence}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{row.range}</td>
                      <td className="px-4 py-3">
                        <span className="inline-flex rounded-full border border-border bg-background/60 px-2 py-1 text-xs text-muted-foreground shadow-[0_0_0_1px_rgba(255,255,255,0.04)]">
                          {row.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-2">
                <Star className="h-4 w-4 text-foreground" />
                Ledger entries retained for 7 years.
              </span>
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-full border border-border bg-background/60 px-3 py-2 text-xs uppercase tracking-wide text-muted-foreground shadow-[0_0_0_1px_rgba(255,255,255,0.04)] hover:text-foreground"
              >
                View full registry
                <ArrowUpRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        <div className="space-y-4 lg:col-span-5">
          <div className="rounded-3xl border border-border bg-card/80 px-6 py-5 shadow-[0_20px_45px_rgba(0,0,0,0.45)] backdrop-blur">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-foreground">Risk Panel</h2>
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-full border border-border bg-background/60 px-3 py-2 text-xs uppercase tracking-wide text-muted-foreground shadow-[0_0_0_1px_rgba(255,255,255,0.04)] hover:text-foreground"
              >
                <Filter className="h-4 w-4" />
                Scenario
              </button>
            </div>
            <div className="mt-4 space-y-3 text-sm text-muted-foreground">
              <p>
                Registry-integrated risk signals consolidate jurisdictional compliance,
                contract exposure, and verified production data.
              </p>
              <ul className="space-y-2">
                <li>• Immutable marker for regulator submissions</li>
                <li>• Confidence bands attached to every asset passport</li>
                <li>• Decision-grade evidence linked to audit trails</li>
              </ul>
            </div>
          </div>

          <div className="rounded-3xl border border-border bg-card/80 px-6 py-5 shadow-[0_20px_45px_rgba(0,0,0,0.45)] backdrop-blur">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-foreground">Export &amp; Print</h2>
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-full border border-border bg-background/60 px-3 py-2 text-xs uppercase tracking-wide text-muted-foreground shadow-[0_0_0_1px_rgba(255,255,255,0.04)] hover:text-foreground"
              >
                <Settings2 className="h-4 w-4" />
                Configure
              </button>
            </div>
            <div className="mt-4 space-y-2 text-sm text-muted-foreground">
              <p>Regulator-ready exports with frozen timestamps and provenance.</p>
              <div className="flex gap-3">
                <button
                  type="button"
                  className="inline-flex items-center gap-2 rounded-full border border-border bg-gradient-to-r from-primary via-primary to-[#2f4a60] px-4 py-2 text-xs uppercase tracking-wide text-primary-foreground shadow-[0_12px_24px_rgba(0,0,0,0.35)]"
                >
                  <CloudDownload className="h-4 w-4" />
                  Export A4
                </button>
                <button
                  type="button"
                  className="inline-flex items-center gap-2 rounded-full border border-border bg-background/60 px-4 py-2 text-xs uppercase tracking-wide text-muted-foreground shadow-[0_0_0_1px_rgba(255,255,255,0.04)]"
                >
                  <ArrowUpRight className="h-4 w-4" />
                  Print View
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

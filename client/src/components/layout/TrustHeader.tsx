const TRUST_METADATA = {
  registryId: "ABFI-REG-01.0",
  jurisdiction: "Commonwealth of Australia",
  methodologyVersion: "DS v1.0",
};

export function TrustHeader() {
  const timestamp = new Intl.DateTimeFormat("en-GB", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "UTC",
  })
    .format(new Date())
    .replace(",", "");

  return (
    <section
      className="mb-6 rounded border border-border bg-card px-6 py-4 text-sm text-muted-foreground"
      aria-label="ABFI trust header"
    >
      <div className="grid gap-4 md:grid-cols-4">
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">ABFI Registry ID</p>
          <p className="mt-1 text-sm font-semibold text-foreground tabular-nums">
            {TRUST_METADATA.registryId}
          </p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Jurisdiction</p>
          <p className="mt-1 text-sm font-semibold text-foreground">
            {TRUST_METADATA.jurisdiction}
          </p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Snapshot Timestamp</p>
          <p className="mt-1 text-sm font-semibold text-foreground tabular-nums">
            {timestamp}
          </p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Methodology Version</p>
          <p className="mt-1 text-sm font-semibold text-foreground">
            {TRUST_METADATA.methodologyVersion}
          </p>
        </div>
      </div>
    </section>
  );
}

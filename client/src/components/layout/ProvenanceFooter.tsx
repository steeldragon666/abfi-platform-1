export function ProvenanceFooter() {
  return (
    <footer
      className="mt-8 border-t border-border bg-card px-6 py-4 text-xs text-muted-foreground"
      aria-label="ABFI provenance footer"
    >
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-wide">Data sources</p>
          <p className="mt-1 text-sm text-foreground">
            ABFI Registry • Verified partner data • Regulator submissions
          </p>
        </div>
        <div className="space-y-1 text-right text-sm text-foreground">
          <p>Verification status: Immutable ledger confirmed</p>
          <p className="tabular-nums">Hash: 9f4d-7ac1-3b2e-91af</p>
          <a className="text-muted-foreground underline underline-offset-4" href="/audit-logs">
            Audit trail link
          </a>
        </div>
      </div>
    </footer>
  );
}

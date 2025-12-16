import { useState } from "react";
import { ExplainerCarousel, EXPLAINER_SETS } from "@/components/ExplainerCarousel";
import DashboardLayout from "@/components/DashboardLayout";
import {
  Hash,
  Cloud,
  AlertTriangle,
  TrendingUp,
  Database,
  ChevronRight
} from "lucide-react";

type ExplainerKey = keyof typeof EXPLAINER_SETS;

const EXPLAINER_CATEGORIES = [
  {
    key: "sha256" as ExplainerKey,
    icon: Hash,
    color: "#D4AF37",
    bgColor: "rgba(212, 175, 55, 0.1)",
  },
  {
    key: "weather" as ExplainerKey,
    icon: Cloud,
    color: "#3b82f6",
    bgColor: "rgba(59, 130, 246, 0.1)",
  },
  {
    key: "supplyShock" as ExplainerKey,
    icon: AlertTriangle,
    color: "#ef4444",
    bgColor: "rgba(239, 68, 68, 0.1)",
  },
  {
    key: "futuresMarketplace" as ExplainerKey,
    icon: TrendingUp,
    color: "#22c55e",
    bgColor: "rgba(34, 197, 94, 0.1)",
  },
  {
    key: "rsieArchitecture" as ExplainerKey,
    icon: Database,
    color: "#8b5cf6",
    bgColor: "rgba(139, 92, 246, 0.1)",
  },
];

export default function Explainers() {
  const [activeExplainer, setActiveExplainer] = useState<ExplainerKey>("sha256");
  const activeSet = EXPLAINER_SETS[activeExplainer];

  return (
    <DashboardLayout>
      <div style={{ background: "var(--bg-primary)" }}>
        {/* Header */}
      <div className="py-12 px-8" style={{ background: "var(--bg-secondary)", borderBottom: "1px solid var(--border-subtle)" }}>
        <div className="max-w-6xl mx-auto">
          <h1
            className="text-4xl mb-3"
            style={{
              fontFamily: "'DM Serif Display', serif",
              color: "var(--text-primary)"
            }}
          >
            Platform Explainers
          </h1>
          <p className="text-lg" style={{ color: "var(--text-secondary)", maxWidth: "700px" }}>
            Visual guides explaining how ABFI's technology protects your bioenergy investments
            through data integrity, weather intelligence, and supply chain monitoring.
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto py-10 px-8">
        <div className="grid grid-cols-12 gap-8">
          {/* Sidebar Navigation */}
          <div className="col-span-4">
            <div
              className="sticky top-8 rounded-2xl p-5"
              style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-subtle)" }}
            >
              <h2 className="text-sm font-semibold uppercase tracking-wide mb-4" style={{ color: "var(--text-tertiary)" }}>
                Select Topic
              </h2>
              <nav className="space-y-2">
                {EXPLAINER_CATEGORIES.map((category) => {
                  const Icon = category.icon;
                  const set = EXPLAINER_SETS[category.key];
                  const isActive = activeExplainer === category.key;

                  return (
                    <button
                      key={category.key}
                      onClick={() => setActiveExplainer(category.key)}
                      className={`w-full text-left p-4 rounded-xl transition-all flex items-start gap-3 ${
                        isActive ? "ring-2" : "hover:bg-opacity-50"
                      }`}
                      style={{
                        background: isActive ? category.bgColor : "transparent",
                        outlineColor: category.color,
                        borderColor: isActive ? category.color : "transparent",
                        // @ts-expect-error CSS custom property for ring color
                        "--tw-ring-color": category.color,
                      }}
                    >
                      <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{ background: category.bgColor }}
                      >
                        <Icon className="w-5 h-5" style={{ color: category.color }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h3
                            className="font-semibold text-sm truncate"
                            style={{ color: isActive ? category.color : "var(--text-primary)" }}
                          >
                            {set.title}
                          </h3>
                          {isActive && <ChevronRight className="w-4 h-4 flex-shrink-0" style={{ color: category.color }} />}
                        </div>
                        <p className="text-xs mt-1 line-clamp-2" style={{ color: "var(--text-tertiary)" }}>
                          {set.panels.length} panels
                        </p>
                      </div>
                    </button>
                  );
                })}
              </nav>

              {/* Quick Stats */}
              <div className="mt-6 pt-6" style={{ borderTop: "1px solid var(--border-subtle)" }}>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold" style={{ color: "var(--accent-gold)" }}>5</div>
                    <div className="text-xs" style={{ color: "var(--text-tertiary)" }}>Topics</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold" style={{ color: "var(--accent-gold)" }}>30</div>
                    <div className="text-xs" style={{ color: "var(--text-tertiary)" }}>Panels</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="col-span-8">
            <ExplainerCarousel
              title={activeSet.title}
              description={activeSet.description}
              panels={activeSet.panels}
            />

            {/* Additional Context */}
            <div
              className="mt-6 p-6 rounded-xl"
              style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-subtle)" }}
            >
              <h3 className="font-semibold mb-3" style={{ color: "var(--text-primary)" }}>
                About This Topic
              </h3>
              <div className="prose prose-sm" style={{ color: "var(--text-secondary)" }}>
                {activeExplainer === "sha256" && (
                  <p>
                    SHA-256 cryptographic hashing creates unique digital fingerprints for all evidence uploaded
                    to the platform. Any modification to the original file—even a single bit—produces a completely
                    different hash, making tampering immediately detectable. This ensures lenders can trust that
                    documents haven't been altered since upload.
                  </p>
                )}
                {activeExplainer === "weather" && (
                  <p>
                    Our weather intelligence system integrates real-time data from the Bureau of Meteorology,
                    satellite imagery, and forecast models to assess crop-specific risk windows. When conditions
                    threaten feedstock quality or availability, smart alerts notify stakeholders before issues
                    impact contracts.
                  </p>
                )}
                {activeExplainer === "supplyShock" && (
                  <p>
                    Supply shock detection continuously monitors for threats including bushfires (via FIRMS satellite data),
                    disease outbreaks, labor disruptions, and logistics failures. The system calculates exposure at the
                    contract level and proactively matches affected buyers with alternative suppliers.
                  </p>
                )}
                {activeExplainer === "futuresMarketplace" && (
                  <p>
                    The Futures Marketplace enables long-term contracting for perennial crops like bamboo, with yield
                    projections spanning up to 25 years. Suppliers create listings with year-by-year production estimates,
                    while buyers submit Expressions of Interest (EOI) to signal demand and negotiate terms.
                  </p>
                )}
                {activeExplainer === "rsieArchitecture" && (
                  <p>
                    The Real-time Supply Intelligence Engine (RSIE) aggregates data from 15+ sources including government
                    registries, satellite feeds, weather APIs, and news monitoring. Every data point is tagged with
                    provenance metadata and confidence scores, enabling sophisticated risk analytics across the supply chain.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      </div>
    </DashboardLayout>
  );
}

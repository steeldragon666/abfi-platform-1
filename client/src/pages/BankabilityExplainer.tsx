/**
 * Bankability Explainer - Nextgen Design
 *
 * Features:
 * - 5-step verification process visualization
 * - Assurance cards with check items
 * - Production, quality, and financial verification
 * - Blockchain certification explanation
 * - Typography components for consistent styling
 */

import {
  Shield,
  Database,
  FileCheck,
  Award,
  TrendingUp,
  Lock,
  FileText,
  CheckCircle2,
  Eye,
  Clock,
} from "lucide-react";
import { H1, H2, H3, Body, MetricValue, DataLabel } from "@/components/Typography";

export default function BankabilityExplainer() {
  const verificationSteps = [
    {
      icon: Database,
      title: "Data Collection",
      description:
        "Automated harvest of producer-submitted data with GPS verification",
      color: "var(--accent-green)",
    },
    {
      icon: FileCheck,
      title: "Independent Verification",
      description:
        "Third-party auditors validate claims against physical evidence",
      color: "var(--accent-blue, #3b82f6)",
    },
    {
      icon: TrendingUp,
      title: "Risk Assessment",
      description:
        "AI-powered analysis of production consistency and market exposure",
      color: "var(--accent-gold)",
    },
    {
      icon: Award,
      title: "Certification",
      description: "Immutable certificate issued with blockchain timestamp",
      color: "var(--accent-purple, #8b5cf6)",
    },
    {
      icon: Eye,
      title: "Continuous Monitoring",
      description:
        "Real-time alerts for material changes in supply or compliance status",
      color: "var(--accent-copper)",
    },
  ];

  const assuranceCards = [
    {
      icon: "📊",
      title: "Production Verification",
      description:
        "Cross-reference satellite imagery, weather data, and harvest records to confirm yield claims.",
      checks: [
        "Satellite-verified acreage",
        "Weather-adjusted yields",
        "Historical production trends",
      ],
    },
    {
      icon: "🔬",
      title: "Quality Assurance",
      description:
        "Independent lab testing of feedstock samples for energy content and contaminants.",
      checks: [
        "Moisture content analysis",
        "Calorific value testing",
        "Contaminant screening",
      ],
    },
    {
      icon: "💰",
      title: "Financial Due Diligence",
      description:
        "Validate producer financial health and track record of contract performance.",
      checks: [
        "Credit history review",
        "Contract履行 history",
        "Insurance coverage verification",
      ],
    },
    {
      icon: "📜",
      title: "Regulatory Compliance",
      description:
        "Ensure adherence to environmental permits, land use regulations, and sustainability standards.",
      checks: [
        "Environmental permits",
        "Land title verification",
        "Sustainability certifications",
      ],
    },
    {
      icon: "🔐",
      title: "Chain of Custody",
      description:
        "Track feedstock from field to facility with tamper-evident documentation.",
      checks: [
        "GPS-tracked logistics",
        "Weighbridge integration",
        "Delivery confirmations",
      ],
    },
    {
      icon: "📈",
      title: "Market Intelligence",
      description:
        "Real-time pricing data and supply forecasts to inform financing decisions.",
      checks: [
        "Regional price benchmarks",
        "Supply-demand forecasts",
        "Competitor analysis",
      ],
    },
  ];

  const immutabilityFeatures = [
    {
      icon: "🔗",
      title: "Blockchain Anchored",
      description: "Certificates hashed to Ethereum mainnet",
    },
    {
      icon: "📝",
      title: "Audit Trail",
      description: "Every data point timestamped and signed",
    },
    {
      icon: "🔒",
      title: "Tamper-Proof",
      description: "Cryptographic seals prevent alteration",
    },
    {
      icon: "⏱️",
      title: "Version Control",
      description: "Complete history of all revisions tracked",
    },
  ];

  const certFeatures = [
    {
      icon: "🎯",
      title: "Instant Verification",
      description:
        "Scan QR code or enter certificate ID to verify authenticity in real-time",
    },
    {
      icon: "📊",
      title: "Risk Scoring",
      description:
        "Automated credit risk assessment based on verified production data and market conditions",
    },
    {
      icon: "🔔",
      title: "Alert System",
      description:
        "Receive notifications for material changes in producer status or supply chain disruptions",
    },
  ];

  return (
    <div
      className="min-h-screen"
      style={{ background: "var(--bg-primary)", padding: "48px 32px 64px" }}
    >
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <header className="text-center mb-14 relative">
          <div className="flex items-center justify-center gap-3 mb-5">
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center"
              style={{ background: "var(--gradient-gold)" }}
            >
              <Shield
                className="h-5 w-5"
                style={{ color: "var(--bg-primary)" }}
              />
            </div>
            <h1
              className="text-2xl"
              style={{
                fontFamily: "'DM Serif Display', serif",
                color: "var(--text-[#D4AF37])",
              }}
            >
              BioFeed <span style={{ color: "var(--accent-gold)" }}>AU</span>
            </h1>
          </div>
          <H1
            className="text-4xl mb-3"
            style={{
              fontFamily: "'DM Serif Display', serif",
              fontWeight: 400,
              letterSpacing: "-0.5px",
            }}
          >
            Bankability Assurance Framework
          </H1>
          <Body
            style={{
              color: "var(--text-secondary)",
              fontSize: "16px",
              fontWeight: 300,
              maxWidth: "700px",
              margin: "0 auto",
            }}
          >
            Independent verification infrastructure that de-risks bioenergy
            project finance through immutable data provenance
          </Body>
          <div
            className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-32 h-0.5"
            style={{
              background:
                "linear-gradient(90deg, transparent, var(--accent-gold), transparent)",
            }}
          />
        </header>

        {/* Trust Badges */}
        <div className="flex justify-center gap-8 mb-14 flex-wrap">
          {[
            {
              icon: CheckCircle2,
              text: "ISO 27001 Certified",
              color: "var(--accent-green)",
            },
            {
              icon: Shield,
              text: "APRA Approved Data Provider",
              color: "var(--accent-blue, #3b82f6)",
            },
            {
              icon: Award,
              text: "Blockchain Verified",
              color: "var(--accent-gold)",
            },
          ].map((badge, idx) => (
            <div
              key={idx}
              className="flex items-center gap-3 px-5 py-3 rounded-lg"
              style={{
                background: "var(--bg-secondary)",
                border: "1px solid var(--border-subtle)",
              }}
            >
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center"
                style={{
                  background: `${badge.color}20`,
                  color: badge.color,
                }}
              >
                <badge.icon className="h-4 w-4" />
              </div>
              <span
                style={{
                  fontSize: "13px",
                  fontWeight: 500,
                  color: "var(--text-secondary)",
                }}
              >
                {badge.text}
              </span>
            </div>
          ))}
        </div>

        {/* Verification Pipeline */}
        <section className="mb-16">
          <div className="text-center mb-10">
            <H2
              className="text-3xl mb-2"
              style={{
                fontFamily: "'DM Serif Display', serif",
                fontWeight: 400,
              }}
            >
              5-Stage Verification Pipeline
            </H2>
            <Body style={{ color: "var(--text-tertiary)", fontSize: "14px" }}>
              Every data point passes through multiple validation layers before
              certification
            </Body>
          </div>

          <div className="relative">
            {/* Connection line */}
            <div
              className="absolute top-12 left-[10%] right-[10%] h-1 rounded"
              style={{
                background:
                  "linear-gradient(90deg, var(--accent-green) 0%, #3b82f6 25%, var(--accent-gold) 50%, #8b5cf6 75%, var(--accent-copper) 100%)",
              }}
            />

            <div className="grid grid-cols-5 gap-0 relative z-10">
              {verificationSteps.map((step, idx) => {
                const Icon = step.icon;
                return (
                  <div key={idx} className="flex flex-col items-center">
                    <div
                      className="w-24 h-24 rounded-full flex items-center justify-center mb-4 relative transition-all"
                      style={{
                        background: "var(--bg-secondary)",
                        border: `3px solid ${step.color}`,
                      }}
                    >
                      <Icon
                        className="h-9 w-9"
                        style={{ stroke: step.color }}
                      />
                      <div
                        className="absolute -top-2 -right-2 w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold"
                        style={{
                          background: "var(--bg-primary)",
                          border: `2px solid ${step.color}`,
                          color: step.color,
                          fontFamily: "'IBM Plex Mono', monospace",
                        }}
                      >
                        {idx + 1}
                      </div>
                    </div>
                    <div className="text-center max-w-[160px]">
                      <H3
                        className="text-sm font-semibold mb-1.5"
                        style={{ color: "var(--text-[#D4AF37])" }}
                      >
                        {step.title}
                      </H3>
                      <Body
                        style={{
                          fontSize: "12px",
                          color: "var(--text-tertiary)",
                          fontWeight: 300,
                        }}
                      >
                        {step.description}
                      </Body>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Assurance Cards Grid */}
        <section className="mb-14">
          <div className="grid grid-cols-3 gap-6">
            {assuranceCards.map((card, idx) => (
              <div
                key={idx}
                className="rounded-2xl p-7 relative overflow-hidden"
                style={{
                  background: "var(--bg-secondary)",
                  border: "1px solid var(--border-subtle)",
                }}
              >
                <div
                  className="absolute top-0 left-0 right-0 h-1"
                  style={{
                    background:
                      idx === 0
                        ? "var(--accent-green)"
                        : idx === 1
                          ? "#3b82f6"
                          : idx === 2
                            ? "var(--accent-gold)"
                            : idx === 3
                              ? "#8b5cf6"
                              : idx === 4
                                ? "var(--accent-copper)"
                                : "linear-gradient(90deg, var(--accent-green), var(--accent-gold))",
                  }}
                />
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl mb-4"
                  style={{
                    background:
                      idx === 0
                        ? "rgba(34, 197, 94, 0.12)"
                        : idx === 1
                          ? "rgba(59, 130, 246, 0.12)"
                          : idx === 2
                            ? "rgba(201, 169, 98, 0.12)"
                            : idx === 3
                              ? "rgba(139, 92, 246, 0.12)"
                              : idx === 4
                                ? "rgba(184, 115, 51, 0.12)"
                                : "rgba(34, 197, 94, 0.08)",
                  }}
                >
                  {card.icon}
                </div>
                <H3
                  className="text-base font-semibold mb-2.5"
                  style={{ color: "var(--text-[#D4AF37])" }}
                >
                  {card.title}
                </H3>
                <Body
                  style={{
                    fontSize: "13px",
                    color: "var(--text-secondary)",
                    fontWeight: 300,
                    marginBottom: "16px",
                    lineHeight: 1.6,
                  }}
                >
                  {card.description}
                </Body>
                <ul className="space-y-1.5">
                  {card.checks.map((check, checkIdx) => (
                    <li
                      key={checkIdx}
                      className="flex items-start gap-2 text-xs"
                      style={{ color: "var(--text-tertiary)" }}
                    >
                      <span
                        style={{
                          color: "var(--accent-green)",
                          fontWeight: 700,
                        }}
                      >
                        ✓
                      </span>
                      {check}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        {/* Immutability Section */}
        <section
          className="rounded-3xl p-10 mb-14"
          style={{
            background:
              "linear-gradient(135deg, rgba(59, 130, 246, 0.05) 0%, rgba(139, 92, 246, 0.05) 100%)",
            border: "1px solid rgba(59, 130, 246, 0.15)",
          }}
        >
          <div className="flex items-center gap-4 mb-8">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center"
              style={{
                background: "rgba(59, 130, 246, 0.15)",
              }}
            >
              <Lock className="h-7 w-7" style={{ stroke: "#3b82f6" }} />
            </div>
            <div>
              <H2
                className="text-2xl mb-1"
                style={{
                  fontFamily: "'DM Serif Display', serif",
                  fontWeight: 400,
                }}
              >
                Immutable Data Provenance
              </H2>
              <Body style={{ fontSize: "14px", color: "var(--text-tertiary)" }}>
                Blockchain-anchored audit trails ensure data integrity for
                lender confidence
              </Body>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-5">
            {immutabilityFeatures.map((feature, idx) => (
              <div
                key={idx}
                className="rounded-xl p-5 text-center"
                style={{ background: "var(--bg-secondary)" }}
              >
                <div
                  className="w-10 h-10 mx-auto mb-3 rounded-lg flex items-center justify-center text-lg"
                  style={{
                    background: "var(--bg-elevated)",
                  }}
                >
                  {feature.icon}
                </div>
                <h4
                  className="text-sm font-semibold mb-1.5"
                  style={{ color: "var(--text-[#D4AF37])" }}
                >
                  {feature.title}
                </h4>
                <p
                  style={{
                    fontSize: "11px",
                    color: "var(--text-tertiary)",
                    fontWeight: 300,
                  }}
                >
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Certificate Preview */}
        <section className="mb-14">
          <div className="text-center mb-10">
            <H2
              className="text-3xl mb-2"
              style={{
                fontFamily: "'DM Serif Display', serif",
                fontWeight: 400,
              }}
            >
              Bankability Certificate
            </H2>
            <Body style={{ color: "var(--text-tertiary)", fontSize: "14px" }}>
              Instantly verifiable proof of supply chain integrity for lender
              due diligence
            </Body>
          </div>

          <div className="grid grid-cols-5 gap-10 items-center">
            {/* Certificate Visual */}
            <div
              className="col-span-2 rounded-2xl p-8 relative"
              style={{
                background:
                  "linear-gradient(145deg, var(--bg-secondary) 0%, var(--bg-elevated) 100%)",
                border: "1px solid var(--border-subtle)",
              }}
            >
              <div
                className="absolute top-4 right-4 w-16 h-16 rounded-full opacity-10"
                style={{
                  background: "var(--gradient-gold)",
                }}
              />

              {/* Cert Header */}
              <div
                className="flex items-center gap-3 mb-6 pb-4"
                style={{ borderBottom: "1px solid var(--border-subtle)" }}
              >
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center"
                  style={{ background: "var(--accent-gold)" }}
                >
                  <Shield
                    className="h-5 w-5"
                    style={{ color: "var(--bg-primary)" }}
                  />
                </div>
                <span
                  style={{
                    fontFamily: "'DM Serif Display', serif",
                    fontSize: "18px",
                  }}
                >
                  ABFI Certificate
                </span>
                <span
                  className="ml-auto px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wide"
                  style={{
                    background: "rgba(34, 197, 94, 0.15)",
                    color: "var(--accent-green)",
                    letterSpacing: "0.5px",
                  }}
                >
                  Verified
                </span>
              </div>

              {/* Cert Body */}
              <div className="space-y-2.5 mb-5">
                {[
                  { label: "Producer", value: "Sunshine Sugarcane Co." },
                  { label: "Feedstock", value: "Bagasse" },
                  { label: "Volume", value: "12,500 tonnes" },
                  { label: "Valid Until", value: "2025-12-31" },
                ].map((row, idx) => (
                  <div
                    key={idx}
                    className="flex justify-between py-2.5"
                    style={{
                      borderBottom:
                        idx < 3 ? "1px dashed rgba(255,255,255,0.05)" : "none",
                    }}
                  >
                    <span
                      style={{
                        fontSize: "11px",
                        color: "var(--text-tertiary)",
                        textTransform: "uppercase",
                        letterSpacing: "0.5px",
                      }}
                    >
                      {row.label}
                    </span>
                    <span
                      style={{
                        fontFamily: "'IBM Plex Mono', monospace",
                        fontSize: "12px",
                        color: "var(--text-secondary)",
                      }}
                    >
                      {row.value}
                    </span>
                  </div>
                ))}
              </div>

              {/* Hash */}
              <div
                className="rounded-lg p-3 mt-4"
                style={{ background: "var(--bg-primary)" }}
              >
                <div
                  style={{
                    fontSize: "10px",
                    color: "var(--text-tertiary)",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                    marginBottom: "6px",
                  }}
                >
                  Blockchain Hash
                </div>
                <div
                  style={{
                    fontFamily: "'IBM Plex Mono', monospace",
                    fontSize: "11px",
                    color: "var(--accent-gold)",
                    wordBreak: "break-all",
                  }}
                >
                  0x4f3a2b1c...8d9e7f6a
                </div>
              </div>
            </div>

            {/* Features */}
            <div className="col-span-3 space-y-5">
              {certFeatures.map((feature, idx) => (
                <div key={idx} className="flex gap-4 items-start">
                  <div
                    className="w-11 h-11 rounded-lg flex items-center justify-center flex-shrink-0 text-xl"
                    style={{
                      background: "var(--bg-secondary)",
                      border: "1px solid var(--border-subtle)",
                    }}
                  >
                    {feature.icon}
                  </div>
                  <div>
                    <h4
                      className="text-sm font-semibold mb-1"
                      style={{ color: "var(--text-[#D4AF37])" }}
                    >
                      {feature.title}
                    </h4>
                    <p
                      style={{
                        fontSize: "13px",
                        color: "var(--text-secondary)",
                        fontWeight: 300,
                        lineHeight: 1.6,
                      }}
                    >
                      {feature.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <div
          className="text-center rounded-2xl p-10"
          style={{
            background: "var(--bg-secondary)",
            border: "1px solid var(--border-subtle)",
          }}
        >
          <H2
            className="text-2xl mb-3"
            style={{ fontFamily: "'DM Serif Display', serif", fontWeight: 400 }}
          >
            Ready to De-Risk Your Bioenergy Portfolio?
          </H2>
          <Body
            style={{
              color: "var(--text-secondary)",
              fontSize: "15px",
              fontWeight: 300,
              marginBottom: "24px",
              maxWidth: "600px",
              margin: "0 auto 24px",
            }}
          >
            Join leading financial institutions using BioFeed AU for project
            finance due diligence
          </Body>
          <button
            className="px-8 py-3 rounded-lg font-semibold transition-all"
            style={{
              background: "var(--gradient-gold)",
              color: "var(--bg-primary)",
            }}
          >
            Request Financial Institution Access
          </button>
        </div>
      </div>
    </div>
  );
}

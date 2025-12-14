import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  renderToBuffer,
} from "@react-pdf/renderer";
import type { CIMethodology, CarbonIntensityReport } from "@/types/database";
import { FOSSIL_FUEL_COMPARATOR } from "./constants";

// Certificate styles
const styles = StyleSheet.create({
  page: {
    flexDirection: "column",
    backgroundColor: "#ffffff",
    padding: 40,
    fontFamily: "Helvetica",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 30,
    borderBottomWidth: 2,
    borderBottomColor: "#16a34a",
    borderBottomStyle: "solid",
    paddingBottom: 20,
  },
  logo: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#16a34a",
  },
  logoSubtext: {
    fontSize: 10,
    color: "#6b7280",
    marginTop: 4,
  },
  certificateTitle: {
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "right",
    color: "#1f2937",
  },
  certificateType: {
    fontSize: 12,
    color: "#6b7280",
    textAlign: "right",
    marginTop: 4,
  },
  mainContent: {
    flexGrow: 1,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#374151",
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  infoRow: {
    flexDirection: "row",
    marginBottom: 6,
  },
  infoLabel: {
    fontSize: 10,
    color: "#6b7280",
    width: 140,
  },
  infoValue: {
    fontSize: 10,
    color: "#1f2937",
    fontWeight: "bold",
    flex: 1,
  },
  highlightBox: {
    backgroundColor: "#f0fdf4",
    borderRadius: 8,
    padding: 16,
    marginVertical: 16,
  },
  highlightRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
  },
  highlightItem: {
    alignItems: "center",
  },
  highlightLabel: {
    fontSize: 9,
    color: "#6b7280",
    marginBottom: 4,
  },
  highlightValue: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#16a34a",
  },
  highlightUnit: {
    fontSize: 8,
    color: "#6b7280",
    marginTop: 2,
  },
  scopeSection: {
    marginTop: 16,
  },
  scopeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
    borderBottomStyle: "solid",
  },
  scopeLabel: {
    fontSize: 10,
    color: "#374151",
  },
  scopeValue: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#1f2937",
  },
  complianceSection: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    borderTopStyle: "solid",
  },
  complianceBadgeCompliant: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    backgroundColor: "#dcfce7",
  },
  complianceBadgeNonCompliant: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    backgroundColor: "#fee2e2",
  },
  complianceTextCompliant: {
    fontSize: 9,
    fontWeight: "bold",
    color: "#166534",
  },
  complianceTextNonCompliant: {
    fontSize: 9,
    fontWeight: "bold",
    color: "#991b1b",
  },
  footer: {
    marginTop: "auto",
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    borderTopStyle: "solid",
  },
  footerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  footerLabel: {
    fontSize: 8,
    color: "#9ca3af",
  },
  footerValue: {
    fontSize: 8,
    color: "#6b7280",
  },
  verificationBox: {
    backgroundColor: "#f9fafb",
    padding: 12,
    borderRadius: 4,
    marginTop: 12,
  },
  verificationTitle: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#374151",
    marginBottom: 6,
  },
  verificationText: {
    fontSize: 8,
    color: "#6b7280",
    lineHeight: 1.4,
  },
  watermark: {
    position: "absolute",
    top: "50%",
    left: "50%",
    fontSize: 60,
    color: "#f3f4f6",
    fontWeight: "bold",
    opacity: 0.3,
  },
  centeredFooter: {
    marginTop: 12,
    alignItems: "center",
  },
  footerSmallText: {
    fontSize: 7,
    color: "#9ca3af",
  },
});

interface CertificateData {
  report: CarbonIntensityReport;
  feedstockName: string;
  feedstockCategory: string;
  supplierName: string;
  verifierName?: string;
}

const methodologyLabels: Record<CIMethodology, string> = {
  RED_II: "EU Renewable Energy Directive II",
  RTFO: "UK Renewable Transport Fuel Obligation",
  ISO_14064: "ISO 14064 GHG Standard",
  ISCC: "International Sustainability & Carbon Certification",
  RSB: "Roundtable on Sustainable Biomaterials",
};

const formatDate = (date: string | null): string => {
  if (!date) return "-";
  return new Date(date).toLocaleDateString("en-AU", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

// Create the certificate document component
const CICertificateDocument: React.FC<{ data: CertificateData }> = ({ data }) => {
  const { report, feedstockName, feedstockCategory, supplierName, verifierName } = data;

  const ghgSavings = report.ghg_savings_percentage ??
    ((FOSSIL_FUEL_COMPARATOR - report.total_ci_value) / FOSSIL_FUEL_COMPARATOR) * 100;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Watermark for non-verified */}
        {report.status !== "verified" && (
          <Text style={styles.watermark}>DRAFT</Text>
        )}

        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.logo}>ABFI</Text>
            <Text style={styles.logoSubtext}>
              Australian Biofuel Feedstock Index
            </Text>
          </View>
          <View>
            <Text style={styles.certificateTitle}>
              Carbon Intensity Certificate
            </Text>
            <Text style={styles.certificateType}>
              {methodologyLabels[report.methodology]}
            </Text>
          </View>
        </View>

        {/* Main Content */}
        <View style={styles.mainContent}>
          {/* Report Info Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Certificate Details</Text>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Report ID:</Text>
              <Text style={styles.infoValue}>{report.report_id}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Supplier:</Text>
              <Text style={styles.infoValue}>{supplierName}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Feedstock:</Text>
              <Text style={styles.infoValue}>
                {feedstockName} ({feedstockCategory})
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Reporting Period:</Text>
              <Text style={styles.infoValue}>
                {formatDate(report.reporting_period_start)} - {formatDate(report.reporting_period_end)}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Reference Year:</Text>
              <Text style={styles.infoValue}>{String(report.reference_year)}</Text>
            </View>
          </View>

          {/* Highlight Box - Key Metrics */}
          <View style={styles.highlightBox}>
            <View style={styles.highlightRow}>
              <View style={styles.highlightItem}>
                <Text style={styles.highlightLabel}>TOTAL CI VALUE</Text>
                <Text style={styles.highlightValue}>
                  {report.total_ci_value?.toFixed(1) ?? "-"}
                </Text>
                <Text style={styles.highlightUnit}>gCO2e/MJ</Text>
              </View>
              <View style={styles.highlightItem}>
                <Text style={styles.highlightLabel}>CI RATING</Text>
                <Text style={styles.highlightValue}>
                  {report.ci_rating ?? "-"}
                </Text>
              </View>
              <View style={styles.highlightItem}>
                <Text style={styles.highlightLabel}>GHG SAVINGS</Text>
                <Text style={styles.highlightValue}>
                  {ghgSavings.toFixed(1)}%
                </Text>
                <Text style={styles.highlightUnit}>
                  vs {FOSSIL_FUEL_COMPARATOR} gCO2e/MJ fossil
                </Text>
              </View>
            </View>
          </View>

          {/* Scope Breakdown */}
          <View style={styles.scopeSection}>
            <Text style={styles.sectionTitle}>Emissions Breakdown</Text>
            <View style={styles.scopeRow}>
              <Text style={styles.scopeLabel}>Scope 1 - Direct Emissions</Text>
              <Text style={styles.scopeValue}>
                {report.scope1_total?.toFixed(2) ?? "0.00"} gCO2e/MJ
              </Text>
            </View>
            <View style={styles.scopeRow}>
              <Text style={styles.scopeLabel}>Scope 2 - Energy Emissions</Text>
              <Text style={styles.scopeValue}>
                {report.scope2_total?.toFixed(2) ?? "0.00"} gCO2e/MJ
              </Text>
            </View>
            <View style={styles.scopeRow}>
              <Text style={styles.scopeLabel}>Scope 3 - Value Chain Emissions</Text>
              <Text style={styles.scopeValue}>
                {report.scope3_total?.toFixed(2) ?? "0.00"} gCO2e/MJ
              </Text>
            </View>
          </View>

          {/* Compliance Status */}
          <View style={styles.complianceSection}>
            <View style={report.red_ii_compliant ? styles.complianceBadgeCompliant : styles.complianceBadgeNonCompliant}>
              <Text style={report.red_ii_compliant ? styles.complianceTextCompliant : styles.complianceTextNonCompliant}>
                RED II: {report.red_ii_compliant ? "COMPLIANT" : "NON-COMPLIANT"}
              </Text>
            </View>
            <View style={report.rtfo_compliant ? styles.complianceBadgeCompliant : styles.complianceBadgeNonCompliant}>
              <Text style={report.rtfo_compliant ? styles.complianceTextCompliant : styles.complianceTextNonCompliant}>
                RTFO: {report.rtfo_compliant ? "COMPLIANT" : "NON-COMPLIANT"}
              </Text>
            </View>
            <View style={report.cfp_compliant ? styles.complianceBadgeCompliant : styles.complianceBadgeNonCompliant}>
              <Text style={report.cfp_compliant ? styles.complianceTextCompliant : styles.complianceTextNonCompliant}>
                CFP: {report.cfp_compliant ? "COMPLIANT" : "NON-COMPLIANT"}
              </Text>
            </View>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <View style={styles.footerRow}>
            <View>
              <Text style={styles.footerLabel}>Status</Text>
              <Text style={styles.footerValue}>
                {report.status.toUpperCase()}
              </Text>
            </View>
            <View>
              <Text style={styles.footerLabel}>Issued Date</Text>
              <Text style={styles.footerValue}>
                {formatDate(report.verified_at || new Date().toISOString())}
              </Text>
            </View>
            <View>
              <Text style={styles.footerLabel}>Valid Until</Text>
              <Text style={styles.footerValue}>
                {report.expiry_date ? formatDate(report.expiry_date) : "12 months from issue"}
              </Text>
            </View>
          </View>

          {report.status === "verified" && (
            <View style={styles.verificationBox}>
              <Text style={styles.verificationTitle}>
                Verification Statement
              </Text>
              <Text style={styles.verificationText}>
                This certificate has been independently verified by {verifierName || "ABFI Auditor"} on {formatDate(report.verified_at)}. The carbon intensity values presented in this certificate have been calculated in accordance with the {methodologyLabels[report.methodology]} methodology and represent the greenhouse gas emissions associated with the production and processing of the specified feedstock during the reporting period.
              </Text>
            </View>
          )}

          <View style={styles.centeredFooter}>
            <Text style={styles.footerSmallText}>
              Certificate generated by ABFI Platform | Report ID: {report.report_id} | Verify at: abfi.com.au/verify/{report.report_id}
            </Text>
          </View>
        </View>
      </Page>
    </Document>
  );
};

/**
 * Generate a PDF certificate for a CI report
 */
export async function generateCertificatePDF(data: CertificateData): Promise<Buffer> {
  const buffer = await renderToBuffer(<CICertificateDocument data={data} />);
  return Buffer.from(buffer);
}

/**
 * Get certificate data in JSON format for API integration
 */
export function getCertificateJSON(data: CertificateData) {
  const { report, feedstockName, feedstockCategory, supplierName, verifierName } = data;

  const ghgSavings = report.ghg_savings_percentage ??
    ((FOSSIL_FUEL_COMPARATOR - report.total_ci_value) / FOSSIL_FUEL_COMPARATOR) * 100;

  return {
    certificate: {
      report_id: report.report_id,
      issued_date: report.verified_at || new Date().toISOString(),
      expiry_date: report.expiry_date,
      status: report.status,
      methodology: report.methodology,
      methodology_label: methodologyLabels[report.methodology],
    },
    supplier: {
      name: supplierName,
    },
    feedstock: {
      name: feedstockName,
      category: feedstockCategory,
    },
    reporting_period: {
      start: report.reporting_period_start,
      end: report.reporting_period_end,
      reference_year: report.reference_year,
    },
    carbon_intensity: {
      total_ci_value: report.total_ci_value,
      ci_rating: report.ci_rating,
      ci_score: report.ci_score,
      ghg_savings_percentage: ghgSavings,
      fossil_fuel_comparator: FOSSIL_FUEL_COMPARATOR,
    },
    emissions: {
      scope1: {
        cultivation: report.scope1_cultivation,
        processing: report.scope1_processing,
        transport: report.scope1_transport,
        total: report.scope1_total,
      },
      scope2: {
        electricity: report.scope2_electricity,
        steam_heat: report.scope2_steam_heat,
        total: report.scope2_total,
      },
      scope3: {
        upstream_inputs: report.scope3_upstream_inputs,
        land_use_change: report.scope3_land_use_change,
        distribution: report.scope3_distribution,
        end_of_life: report.scope3_end_of_life,
        total: report.scope3_total,
      },
    },
    compliance: {
      red_ii: report.red_ii_compliant,
      rtfo: report.rtfo_compliant,
      cfp: report.cfp_compliant,
    },
    verification: {
      status: report.status,
      verified_at: report.verified_at,
      verified_by: verifierName,
      level: report.verification_level,
    },
    data_quality: {
      level: report.data_quality_level,
      uncertainty_range: {
        low: report.uncertainty_range_low,
        high: report.uncertainty_range_high,
      },
    },
  };
}

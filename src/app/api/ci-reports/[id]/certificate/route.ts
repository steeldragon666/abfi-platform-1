import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateCertificatePDF, getCertificateJSON } from "@/lib/ci/certificate";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get the CI report with related data
    const { data: report, error } = await supabase
      .from("carbon_intensity_reports")
      .select(`
        *,
        feedstock:feedstocks(id, feedstock_id, name, category),
        supplier:suppliers(id, company_name),
        verifier:profiles!carbon_intensity_reports_verified_by_fkey(id, full_name)
      `)
      .eq("id", id)
      .single();

    if (error || !report) {
      return NextResponse.json(
        { error: "CI report not found" },
        { status: 404 }
      );
    }

    // Check authorization
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    const { data: supplier } = await supabase
      .from("suppliers")
      .select("id")
      .eq("profile_id", user.id)
      .single();

    const isOwner = supplier?.id === report.supplier_id;
    const isAuditorOrAdmin = profile?.role === "auditor" || profile?.role === "admin";
    const isVerifiedAndBuyer = report.status === "verified" && profile?.role === "buyer";

    if (!isOwner && !isAuditorOrAdmin && !isVerifiedAndBuyer) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Check format query param
    const url = new URL(request.url);
    const format = url.searchParams.get("format") || "pdf";

    const certificateData = {
      report,
      feedstockName: report.feedstock?.name || "Unknown",
      feedstockCategory: report.feedstock?.category || "Unknown",
      supplierName: report.supplier?.company_name || "Unknown",
      verifierName: report.verifier?.full_name,
    };

    if (format === "json") {
      // Return JSON format for API integration
      const jsonData = getCertificateJSON(certificateData);
      return NextResponse.json(jsonData);
    }

    // Generate PDF
    const pdfBuffer = await generateCertificatePDF(certificateData);

    // Convert Buffer to Uint8Array for NextResponse compatibility
    const uint8Array = new Uint8Array(pdfBuffer);

    // Return PDF with appropriate headers
    return new NextResponse(uint8Array, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="CI-Certificate-${report.report_id}.pdf"`,
        "Content-Length": String(pdfBuffer.length),
      },
    });
  } catch (error) {
    console.error("Certificate generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate certificate" },
      { status: 500 }
    );
  }
}

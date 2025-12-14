import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { calculateCIReport } from "@/lib/ci/calculator";
import type { CIMethodology, CIDataQuality, CIEmissionInput } from "@/types/database";

// GET /api/ci-reports/[id] - Get a single CI report
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

    // Get the report with related data
    const { data: report, error } = await supabase
      .from("carbon_intensity_reports")
      .select(`
        *,
        feedstock:feedstocks(id, feedstock_id, name, category, location_state, location_country),
        supplier:suppliers(id, company_name, contact_email),
        verifier:profiles!carbon_intensity_reports_verified_by_fkey(id, full_name, email),
        assigned_auditor:profiles!carbon_intensity_reports_assigned_auditor_id_fkey(id, full_name, email)
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

    // Suppliers can view their own reports
    const { data: supplier } = await supabase
      .from("suppliers")
      .select("id")
      .eq("profile_id", user.id)
      .single();

    const isOwner = supplier && report.supplier_id === supplier.id;
    const isAuditor = profile && ["auditor", "admin"].includes(profile.role);
    const isBuyer = profile?.role === "buyer" && report.status === "verified";

    if (!isOwner && !isAuditor && !isBuyer) {
      return NextResponse.json(
        { error: "Not authorized to view this report" },
        { status: 403 }
      );
    }

    // Get audit logs for this report
    const { data: auditLogs } = await supabase
      .from("ci_audit_logs")
      .select(`
        *,
        user:profiles(id, full_name)
      `)
      .eq("report_id", id)
      .order("created_at", { ascending: false });

    return NextResponse.json({
      ...report,
      audit_logs: auditLogs || [],
    });
  } catch (error) {
    console.error("Error in GET /api/ci-reports/[id]:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PATCH /api/ci-reports/[id] - Update a CI report (draft only)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const body = await request.json();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get supplier
    const { data: supplier } = await supabase
      .from("suppliers")
      .select("id")
      .eq("profile_id", user.id)
      .single();

    if (!supplier) {
      return NextResponse.json(
        { error: "Supplier not found" },
        { status: 404 }
      );
    }

    // Get existing report
    const { data: existingReport } = await supabase
      .from("carbon_intensity_reports")
      .select("id, supplier_id, status, methodology, data_quality_level")
      .eq("id", id)
      .single();

    if (!existingReport) {
      return NextResponse.json(
        { error: "CI report not found" },
        { status: 404 }
      );
    }

    if (existingReport.supplier_id !== supplier.id) {
      return NextResponse.json(
        { error: "Not authorized to update this report" },
        { status: 403 }
      );
    }

    if (existingReport.status !== "draft") {
      return NextResponse.json(
        { error: "Only draft reports can be updated" },
        { status: 400 }
      );
    }

    // Allowed fields for update
    const allowedFields = [
      "reporting_period_start",
      "reporting_period_end",
      "reference_year",
      "methodology",
      "methodology_version",
      "data_quality_level",
      "scope1_cultivation",
      "scope1_processing",
      "scope1_transport",
      "scope2_electricity",
      "scope2_steam_heat",
      "scope3_upstream_inputs",
      "scope3_land_use_change",
      "scope3_distribution",
      "scope3_end_of_life",
      "calculation_notes",
      "supporting_documents",
    ];

    const updateData: Record<string, unknown> = {};

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: "No valid fields to update" },
        { status: 400 }
      );
    }

    // Recalculate CI values if emissions changed
    const emissionFields = [
      "scope1_cultivation",
      "scope1_processing",
      "scope1_transport",
      "scope2_electricity",
      "scope2_steam_heat",
      "scope3_upstream_inputs",
      "scope3_land_use_change",
      "scope3_distribution",
      "scope3_end_of_life",
    ];

    const hasEmissionUpdates = emissionFields.some((field) => body[field] !== undefined);

    if (hasEmissionUpdates) {
      // Get current values and merge with updates
      const { data: currentReport } = await supabase
        .from("carbon_intensity_reports")
        .select("*")
        .eq("id", id)
        .single();

      if (currentReport) {
        const ciInput: CIEmissionInput = {
          scope1_cultivation: body.scope1_cultivation ?? currentReport.scope1_cultivation,
          scope1_processing: body.scope1_processing ?? currentReport.scope1_processing,
          scope1_transport: body.scope1_transport ?? currentReport.scope1_transport,
          scope2_electricity: body.scope2_electricity ?? currentReport.scope2_electricity,
          scope2_steam_heat: body.scope2_steam_heat ?? currentReport.scope2_steam_heat,
          scope3_upstream_inputs: body.scope3_upstream_inputs ?? currentReport.scope3_upstream_inputs,
          scope3_land_use_change: body.scope3_land_use_change ?? currentReport.scope3_land_use_change,
          scope3_distribution: body.scope3_distribution ?? currentReport.scope3_distribution,
          scope3_end_of_life: body.scope3_end_of_life ?? currentReport.scope3_end_of_life,
        };

        const methodology = (body.methodology ?? currentReport.methodology) as CIMethodology;
        const dataQuality = (body.data_quality_level ?? currentReport.data_quality_level) as CIDataQuality;

        const calculations = calculateCIReport(ciInput, methodology, dataQuality);

        updateData.ci_score = calculations.ci_score;
        updateData.uncertainty_range_low = calculations.uncertainty_range_low;
        updateData.uncertainty_range_high = calculations.uncertainty_range_high;
      }
    }

    const { data, error } = await supabase
      .from("carbon_intensity_reports")
      .update(updateData)
      .eq("id", id)
      .select(`
        *,
        feedstock:feedstocks(id, feedstock_id, name, category)
      `)
      .single();

    if (error) {
      console.error("Error updating CI report:", error);
      return NextResponse.json(
        { error: "Failed to update CI report" },
        { status: 500 }
      );
    }

    // Create audit log entry
    await supabase.from("ci_audit_logs").insert({
      report_id: id,
      user_id: user.id,
      action: "updated",
      metadata: { updated_fields: Object.keys(updateData) },
    });

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error in PATCH /api/ci-reports/[id]:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE /api/ci-reports/[id] - Delete a draft CI report
export async function DELETE(
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

    // Get supplier
    const { data: supplier } = await supabase
      .from("suppliers")
      .select("id")
      .eq("profile_id", user.id)
      .single();

    if (!supplier) {
      return NextResponse.json(
        { error: "Supplier not found" },
        { status: 404 }
      );
    }

    // Get existing report
    const { data: report } = await supabase
      .from("carbon_intensity_reports")
      .select("id, supplier_id, status")
      .eq("id", id)
      .single();

    if (!report) {
      return NextResponse.json(
        { error: "CI report not found" },
        { status: 404 }
      );
    }

    if (report.supplier_id !== supplier.id) {
      return NextResponse.json(
        { error: "Not authorized to delete this report" },
        { status: 403 }
      );
    }

    if (report.status !== "draft") {
      return NextResponse.json(
        { error: "Only draft reports can be deleted" },
        { status: 400 }
      );
    }

    // Delete report (audit logs will cascade)
    const { error } = await supabase
      .from("carbon_intensity_reports")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Error deleting CI report:", error);
      return NextResponse.json(
        { error: "Failed to delete CI report" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in DELETE /api/ci-reports/[id]:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

// POST /api/ci-reports/[id]/submit - Submit a CI report for verification
export async function POST(
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
      .select("*")
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
        { error: "Not authorized to submit this report" },
        { status: 403 }
      );
    }

    if (report.status !== "draft") {
      return NextResponse.json(
        { error: `Cannot submit report with status '${report.status}'` },
        { status: 400 }
      );
    }

    // Validate minimum required data before submission
    const hasScope1 = report.scope1_cultivation > 0 || report.scope1_processing > 0 || report.scope1_transport > 0;
    const hasScope2 = report.scope2_electricity > 0 || report.scope2_steam_heat > 0;
    const hasScope3 = report.scope3_upstream_inputs > 0 || report.scope3_land_use_change > 0 ||
                      report.scope3_distribution > 0 || report.scope3_end_of_life !== 0;

    if (!hasScope1 && !hasScope2 && !hasScope3) {
      return NextResponse.json(
        { error: "Report must have at least some emission data before submission" },
        { status: 400 }
      );
    }

    // Update report status
    const { data, error } = await supabase
      .from("carbon_intensity_reports")
      .update({
        status: "submitted",
        submitted_at: new Date().toISOString(),
        verification_level: "self_declared",
      })
      .eq("id", id)
      .select(`
        *,
        feedstock:feedstocks(id, feedstock_id, name, category)
      `)
      .single();

    if (error) {
      console.error("Error submitting CI report:", error);
      return NextResponse.json(
        { error: "Failed to submit CI report" },
        { status: 500 }
      );
    }

    // Create audit log entry
    await supabase.from("ci_audit_logs").insert({
      report_id: id,
      user_id: user.id,
      action: "submitted",
      previous_status: "draft",
      new_status: "submitted",
      notes: "Report submitted for verification",
    });

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error in POST /api/ci-reports/[id]/submit:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

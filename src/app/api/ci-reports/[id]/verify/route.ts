import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

// POST /api/ci-reports/[id]/verify - Auditor approve/reject a CI report
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const body = await request.json();

    const { action, notes, rejection_reason, expiry_days = 365 } = body;

    if (!action || !["approve", "reject", "request_revision", "start_review"].includes(action)) {
      return NextResponse.json(
        { error: "action must be 'approve', 'reject', 'request_revision', or 'start_review'" },
        { status: 400 }
      );
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is auditor or admin
    const { data: profile } = await supabase
      .from("profiles")
      .select("id, role, full_name")
      .eq("id", user.id)
      .single();

    if (!profile || !["auditor", "admin"].includes(profile.role)) {
      return NextResponse.json(
        { error: "Not authorized - auditor or admin role required" },
        { status: 403 }
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

    // Validate status transitions
    const validTransitions: Record<string, string[]> = {
      start_review: ["submitted"],
      approve: ["under_review"],
      reject: ["under_review"],
      request_revision: ["under_review"],
    };

    if (!validTransitions[action].includes(report.status)) {
      return NextResponse.json(
        { error: `Cannot ${action} report with status '${report.status}'` },
        { status: 400 }
      );
    }

    // Build update data based on action
    const updateData: Record<string, unknown> = {};
    let newStatus: string;
    let auditAction: string;

    switch (action) {
      case "start_review":
        newStatus = "under_review";
        auditAction = "review_started";
        updateData.status = newStatus;
        updateData.assigned_auditor_id = user.id;
        break;

      case "approve":
        newStatus = "verified";
        auditAction = "approved";
        updateData.status = newStatus;
        updateData.verified_at = new Date().toISOString();
        updateData.verified_by = user.id;
        updateData.verification_level = "third_party_audited";
        updateData.auditor_notes = notes || null;
        // Set expiry date
        const expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + expiry_days);
        updateData.expiry_date = expiryDate.toISOString().split("T")[0];
        break;

      case "reject":
        if (!rejection_reason) {
          return NextResponse.json(
            { error: "rejection_reason is required when rejecting" },
            { status: 400 }
          );
        }
        newStatus = "rejected";
        auditAction = "rejected";
        updateData.status = newStatus;
        updateData.rejection_reason = rejection_reason;
        updateData.auditor_notes = notes || null;
        break;

      case "request_revision":
        newStatus = "draft"; // Return to draft for supplier revision
        auditAction = "revision_requested";
        updateData.status = newStatus;
        updateData.auditor_notes = notes || "Please address the issues noted and resubmit.";
        updateData.assigned_auditor_id = null;
        break;

      default:
        return NextResponse.json(
          { error: "Invalid action" },
          { status: 400 }
        );
    }

    // Update report
    const { data, error } = await supabase
      .from("carbon_intensity_reports")
      .update(updateData)
      .eq("id", id)
      .select(`
        *,
        feedstock:feedstocks(id, feedstock_id, name, category),
        supplier:suppliers(id, company_name, contact_email),
        verifier:profiles!carbon_intensity_reports_verified_by_fkey(id, full_name)
      `)
      .single();

    if (error) {
      console.error("Error verifying CI report:", error);
      return NextResponse.json(
        { error: "Failed to update CI report" },
        { status: 500 }
      );
    }

    // Create audit log entry
    await supabase.from("ci_audit_logs").insert({
      report_id: id,
      user_id: user.id,
      action: auditAction,
      previous_status: report.status,
      new_status: newStatus,
      notes: notes || rejection_reason || null,
      metadata: {
        auditor_name: profile.full_name,
        expiry_days: action === "approve" ? expiry_days : undefined,
      },
    });

    return NextResponse.json({
      ...data,
      message: `Report ${action === "approve" ? "approved" : action === "reject" ? "rejected" : action === "request_revision" ? "returned for revision" : "review started"}`,
    });
  } catch (error) {
    console.error("Error in POST /api/ci-reports/[id]/verify:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// GET /api/ci-reports/[id]/verify - Get audit history for a report
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

    // Check if user is auditor/admin or the supplier who owns the report
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    const isAuditor = profile && ["auditor", "admin"].includes(profile.role);

    if (!isAuditor) {
      // Check if supplier owns this report
      const { data: supplier } = await supabase
        .from("suppliers")
        .select("id")
        .eq("profile_id", user.id)
        .single();

      if (supplier) {
        const { data: report } = await supabase
          .from("carbon_intensity_reports")
          .select("supplier_id")
          .eq("id", id)
          .single();

        if (!report || report.supplier_id !== supplier.id) {
          return NextResponse.json(
            { error: "Not authorized to view audit history" },
            { status: 403 }
          );
        }
      } else {
        return NextResponse.json(
          { error: "Not authorized to view audit history" },
          { status: 403 }
        );
      }
    }

    // Get audit logs
    const { data: auditLogs, error } = await supabase
      .from("ci_audit_logs")
      .select(`
        *,
        user:profiles(id, full_name, role)
      `)
      .eq("report_id", id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching audit logs:", error);
      return NextResponse.json(
        { error: "Failed to fetch audit history" },
        { status: 500 }
      );
    }

    return NextResponse.json(auditLogs);
  } catch (error) {
    console.error("Error in GET /api/ci-reports/[id]/verify:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

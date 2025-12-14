import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { CIReportWizard } from "./wizard";

export const metadata = {
  title: "New CI Report",
};

export default async function NewCIReportPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Get supplier
  const { data: supplier } = await supabase
    .from("suppliers")
    .select("*")
    .eq("profile_id", user.id)
    .single();

  if (!supplier) {
    redirect("/supplier/settings?setup=required");
  }

  // Get supplier's feedstocks
  const { data: feedstocks } = await supabase
    .from("feedstocks")
    .select("id, feedstock_id, name, category, state")
    .eq("supplier_id", supplier.id)
    .in("status", ["active", "pending_review"])
    .order("name", { ascending: true });

  if (!feedstocks || feedstocks.length === 0) {
    redirect("/supplier/feedstocks/new?notice=feedstock_required");
  }

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Create CI Report</h1>
        <p className="text-muted-foreground mt-2">
          Document your carbon intensity by scope. All emission values are in gCO2e/MJ.
        </p>
      </div>
      <CIReportWizard
        supplierId={supplier.id}
        feedstocks={feedstocks}
      />
    </div>
  );
}

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { MarketsClient } from "@/app/(dashboard)/buyer/markets/client";

export const metadata = {
  title: "Commodity Markets | ABFI",
  description: "Browse and signal interest in bioenergy feedstocks and commodities",
};

export default async function SupplierMarketsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Get profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "supplier") {
    redirect("/dashboard");
  }

  // Get supplier data
  const { data: supplier } = await supabase
    .from("suppliers")
    .select("id")
    .eq("profile_id", user.id)
    .single();

  // Get existing market signals for this user
  const { data: signals } = await supabase
    .from("market_signals")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <div className="container max-w-7xl py-8">
      <MarketsClient
        userRole="supplier"
        userId={user.id}
        supplierId={supplier?.id}
        existingSignals={signals || []}
      />
    </div>
  );
}

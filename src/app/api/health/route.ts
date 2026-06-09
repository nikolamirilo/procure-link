import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

// Liveness + dependency check for uptime monitors (UptimeRobot). Returns 200
// only if a trivial Supabase read succeeds. The proxy whitelists /api/* so this
// is reachable without auth.
export async function GET() {
  try {
    const supabase = await createClient();
    const { error } = await supabase
      .from("categories")
      .select("id")
      .limit(1);
    if (error) {
      return NextResponse.json(
        { status: "degraded", db: false },
        { status: 503 }
      );
    }
    return NextResponse.json({ status: "ok", db: true });
  } catch {
    return NextResponse.json({ status: "error" }, { status: 503 });
  }
}

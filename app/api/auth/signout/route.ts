import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function POST() {
  const supabase = await createClient()
  
  // Check if session exists before signing out
  const { data: { session } } = await supabase.auth.getSession()
  
  if (session) {
    await supabase.auth.signOut()
  }

  return NextResponse.json({ success: true })
}

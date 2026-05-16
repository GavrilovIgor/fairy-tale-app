import { NextResponse } from 'next/server'
import { writeRegistrationBonus } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  await writeRegistrationBonus(user.id)
  return NextResponse.json({ ok: true })
}

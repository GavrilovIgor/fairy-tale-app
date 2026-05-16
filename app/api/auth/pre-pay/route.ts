import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

// Creates or finds a Supabase user by email before payment
// Returns userId so it can be passed to YooKassa metadata
export async function POST(req: NextRequest) {
  const { email } = await req.json()
  if (!email || !email.includes('@')) {
    return NextResponse.json({ error: 'Invalid email' }, { status: 400 })
  }

  try {
    // Try to find existing user first
    const { data: { users } } = await supabaseAdmin.auth.admin.listUsers()
    const existing = users.find(u => u.email?.toLowerCase() === email.toLowerCase())

    if (existing) {
      return NextResponse.json({ userId: existing.id, isNew: false })
    }

    // Create new user (auto-confirmed, no email verification needed at this step)
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email: email.toLowerCase(),
      email_confirm: true,
      user_metadata: {
        full_name: email.split('@')[0],
      },
    })

    if (error) throw error

    // Send magic link so they can sign in after payment
    await supabaseAdmin.auth.admin.generateLink({
      type: 'magiclink',
      email: email.toLowerCase(),
    })

    return NextResponse.json({ userId: data.user.id, isNew: true })
  } catch (e) {
    console.error('pre-pay error:', e)
    return NextResponse.json({ error: 'Failed to create account' }, { status: 500 })
  }
}

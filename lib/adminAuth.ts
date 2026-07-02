import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export function checkAdminAuth(): { authorized: boolean; error?: NextResponse } {
  const cookieStore = cookies()
  const session = cookieStore.get('admin_session')
  const adminPassword = process.env.ADMIN_PASSWORD

  if (!adminPassword || !session || session.value !== adminPassword) {
    return { authorized: false, error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  }
  return { authorized: true }
}

import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function GET() {
  try {
    const cookieStore = await cookies()
    const isLoggedIn = await cookieStore.get('isLoggedIn')

    if (isLoggedIn?.value === 'true') {
      return NextResponse.json({ authenticated: true })
    }

    return NextResponse.json({ authenticated: false }, { status: 401 })
  } catch (error) {
    console.error('Auth check error:', error)
    return NextResponse.json({ authenticated: false }, { status: 500 })
  }
} 
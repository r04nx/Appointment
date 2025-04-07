import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import * as crypto from 'crypto'

// Simple hash function for passwords (must match the one in init-db.ts)
function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex')
}

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json()

    // Find admin user in the database
    const admin = await prisma.admin.findUnique({
      where: { username }
    })

    // Hash the provided password and compare with stored hash
    const hashedPassword = hashPassword(password)
    const isValidCredentials = admin && admin.password === hashedPassword

    if (isValidCredentials) {
      const response = NextResponse.json({ success: true })
      
      // Set cookie in the response
      response.cookies.set('isLoggedIn', 'true', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 // 24 hours
      })

      return response
    }

    return NextResponse.json(
      { error: 'Invalid credentials' },
      { status: 401 }
    )
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'An error occurred during login' },
      { status: 500 }
    )
  }
} 
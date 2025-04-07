import { NextResponse } from 'next/server'

export async function POST() {
  try {
    const response = NextResponse.json({ success: true })
    
    // Clear the cookie
    response.cookies.set('isLoggedIn', '', {
      httpOnly: true,
      expires: new Date(0),
      path: '/'
    })

    return response
  } catch (error) {
    console.error('Logout error:', error)
    return NextResponse.json(
      { error: 'An error occurred during logout' },
      { status: 500 }
    )
  }
} 
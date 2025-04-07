import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // Skip auth check for public routes and auth-related routes
  if (
    request.nextUrl.pathname === '/' ||
    request.nextUrl.pathname === '/login' ||
    request.nextUrl.pathname.startsWith('/api/auth')
  ) {
    return NextResponse.next()
  }

  // Check if the request is for protected routes
  if (
    request.nextUrl.pathname.startsWith('/admin') || 
    request.nextUrl.pathname.startsWith('/api/appointments')
  ) {
    const isLoggedIn = request.cookies.get('isLoggedIn')?.value === 'true'
    
    if (!isLoggedIn) {
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('from', request.nextUrl.pathname)
      return NextResponse.redirect(loginUrl)
    }
  }
  
  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ]
} 
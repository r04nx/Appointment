"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import AdminCalendar from "@/components/admin-calendar"
import { ThemeProvider } from "@/components/theme-provider"
import ThemeSelector from "@/components/theme-selector"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import Loading from "@/components/loading"

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const checkAuth = async () => {
      try {
        setIsLoading(true)
        const response = await fetch('/api/auth/check', {
          credentials: 'include',
          cache: 'no-store' // Prevent caching
        })
        
        if (!response.ok) {
          throw new Error('Not authenticated')
        }
        
        setIsAuthenticated(true)
      } catch (error) {
        console.error('Auth check error:', error)
        router.push('/login')
      } finally {
        setIsLoading(false)
      }
    }

    checkAuth()
  }, [router])

  const handleLogout = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include'
      })

      if (response.ok) {
        router.push('/login')
        router.refresh()
      }
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return <Loading />
  }

  if (!isAuthenticated) {
    return null
  }

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <div className="min-h-screen bg-background">
        <header className="border-b">
          <div className="container mx-auto flex items-center justify-between py-4">
            <div className="flex items-center gap-4">
              <Image src="/logo.png" alt="SPIT Logo" width={60} height={60} className="h-12 w-auto" />
              <div>
                <h1 className="text-2xl font-bold">Appointment with Principal</h1>
                <p className="text-sm text-muted-foreground">Sardar Patel Institute of Technology - Admin Panel</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <ThemeSelector />
              <Link
                href="/"
                className="rounded-md bg-secondary px-4 py-2 text-secondary-foreground hover:bg-secondary/90"
              >
                Public View
              </Link>
              <Button variant="destructive" onClick={handleLogout}>
                Logout
              </Button>
            </div>
          </div>
        </header>
        <main className="container mx-auto py-8">
          <AdminCalendar />
        </main>
      </div>
    </ThemeProvider>
  )
}


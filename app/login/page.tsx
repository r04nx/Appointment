"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { ThemeProvider } from "@/components/theme-provider"
import ThemeSelector from "@/components/theme-selector"
import Image from "next/image"
import Link from "next/link"

export default function LoginPage() {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
        credentials: 'include'
      })

      const data = await response.json()

      if (response.ok) {
        // Check if there's a redirect URL in the query params
        const params = new URLSearchParams(window.location.search)
        const from = params.get('from') || '/admin'
        router.push(from)
        router.refresh()
      } else {
        setError(data.error || 'Invalid username or password')
      }
    } catch (error) {
      console.error("Login error:", error)
      setError("An error occurred during login")
    } finally {
      setIsLoading(false)
    }
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
                <p className="text-sm text-muted-foreground">Sardar Patel Institute of Technology</p>
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
            </div>
          </div>
        </header>
        <main className="container mx-auto flex items-center justify-center py-16">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Admin Login</CardTitle>
              <CardDescription>Login to manage principal's appointment schedule</CardDescription>
            </CardHeader>
            <form onSubmit={handleLogin}>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    disabled={isLoading}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isLoading}
                    required
                  />
                </div>
                {error && <p className="text-sm text-destructive">{error}</p>}
              </CardContent>
              <CardFooter>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Logging in..." : "Login"}
                </Button>
              </CardFooter>
            </form>
          </Card>
        </main>
      </div>
    </ThemeProvider>
  )
}


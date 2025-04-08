"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useSession, signOut } from "next-auth/react"
import Image from "next/image"
import AdminView from "@/components/admin-view"
import { Button } from "@/components/ui/button"
import { LogOut, User } from "lucide-react"

export default function AdminDashboard() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
    } else if (status === "authenticated") {
      setIsLoaded(true)
    }
  }, [status, router])

  const handleLogout = async () => {
    await signOut({ redirect: false })
    router.push("/")
  }

  if (status === "loading" || !isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 relative">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <Image
          src="https://images.unsplash.com/photo-1523050854058-8df90110c9f1?q=80&w=2071&auto=format&fit=crop"
          alt="SPIT Campus"
          fill
          className="object-cover opacity-5"
          priority
        />
      </div>

      <header className="relative z-10 bg-white shadow-sm">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Image
              src="https://www.spit.ac.in/wp-content/uploads/2021/01/LogoSPIT.png"
              alt="SPIT Logo"
              width={50}
              height={50}
              className="h-12 w-auto"
            />
            <div>
              <h1 className="text-xl font-bold text-gray-800">Principal's Schedule - Admin Panel</h1>
              <p className="text-xs text-gray-500">Sardar Patel Institute of Technology, Mumbai</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <User className="h-4 w-4" />
              <span>
                Logged in as: <span className="font-medium">Admin</span>
              </span>
            </div>
            <Button variant="outline" size="sm" onClick={handleLogout} className="flex items-center gap-2">
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main
        className={`container mx-auto px-4 py-8 transition-opacity duration-500 relative z-10 ${isLoaded ? "opacity-100" : "opacity-0"}`}
      >
        <AdminView />
      </main>

      <footer className="bg-gray-800 text-white mt-10 relative z-10">
        <div className="container mx-auto px-4 py-4 text-center text-gray-400 text-sm">
          © {new Date().getFullYear()} Sardar Patel Institute of Technology. All rights reserved.
        </div>
      </footer>
    </div>
  )
}


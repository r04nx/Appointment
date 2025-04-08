"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import PublicView from "@/components/public-view"
import { Button } from "@/components/ui/button"
import { UserCircle } from "lucide-react"

export default function Home() {
  const router = useRouter()
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    setIsLoaded(true)
  }, [])

  const handleAdminLogin = () => {
    router.push("/login")
  }

  return (
    <div className="min-h-screen bg-gray-50 relative">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <Image
          src="https://images.unsplash.com/photo-1541339907198-e08756dedf3f?q=80&w=2070&auto=format&fit=crop"
          alt="SPIT Campus"
          fill
          className="object-cover opacity-10"
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
              <h1 className="text-xl font-bold text-gray-800">Principal's Schedule</h1>
              <p className="text-xs text-gray-500">Sardar Patel Institute of Technology, Mumbai</p>
            </div>
          </div>
          <Button onClick={handleAdminLogin} variant="outline" className="flex items-center gap-2">
            <UserCircle className="h-4 w-4" />
            Admin Login
          </Button>
        </div>
      </header>

      <main
        className={`container mx-auto px-4 py-8 transition-opacity duration-500 relative z-10 ${isLoaded ? "opacity-100" : "opacity-0"}`}
      >
        <PublicView />
      </main>

      <footer className="bg-gray-800 text-white mt-10 relative z-10">
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <Image
                  src="https://www.spit.ac.in/wp-content/uploads/2021/01/LogoSPIT.png"
                  alt="SPIT Logo"
                  width={40}
                  height={40}
                  className="h-10 w-auto"
                />
                <h3 className="text-lg font-bold">SPIT Mumbai</h3>
              </div>
              <p className="text-sm text-gray-300">
                Sardar Patel Institute of Technology is one of the premier engineering colleges in Mumbai, offering
                quality education in various engineering disciplines.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-bold mb-4">Contact</h3>
              <p className="text-sm text-gray-300">
                Bhavans Campus, Munshi Nagar,
                <br />
                Andheri (West), Mumbai 400 058
                <br />
                Maharashtra, India
                <br />
                <br />
                Phone: +91-22-26707440
                <br />
                Email: principal@spit.ac.in
              </p>
            </div>
            <div>
              <h3 className="text-lg font-bold mb-4">Quick Links</h3>
              <ul className="space-y-2 text-sm text-gray-300">
                <li>
                  <a href="https://www.spit.ac.in/" className="hover:text-white">
                    Official Website
                  </a>
                </li>
                <li>
                  <a href="https://www.spit.ac.in/about/principal/" className="hover:text-white">
                    About Principal
                  </a>
                </li>
                <li>
                  <a href="https://www.spit.ac.in/academics/" className="hover:text-white">
                    Academics
                  </a>
                </li>
                <li>
                  <a href="https://www.spit.ac.in/contact-us/" className="hover:text-white">
                    Contact Us
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-700 mt-8 pt-6 text-center text-gray-400 text-sm">
            © {new Date().getFullYear()} Sardar Patel Institute of Technology. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  )
}


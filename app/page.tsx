import PublicCalendar from "@/components/public-calendar"
import { ThemeProvider } from "@/components/theme-provider"
import ThemeSelector from "@/components/theme-selector"
import Image from "next/image"
import Link from "next/link"

export default function Home() {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <div className="min-h-screen bg-background">
        <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container mx-auto flex items-center justify-between py-3">
            <div className="flex items-center gap-4">
              <Image src="/logo.png" alt="SPIT Logo" width={48} height={48} className="h-12 w-auto" />
              <div>
                <h1 className="text-xl font-bold sm:text-2xl">Principal's Calendar</h1>
                <p className="text-sm text-muted-foreground">SPIT</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <ThemeSelector />
              <Link
                href="/admin"
                className="rounded-md bg-primary px-3 py-2 text-sm text-primary-foreground hover:bg-primary/90"
              >
                Admin
              </Link>
            </div>
          </div>
        </header>

        <main className="container mx-auto py-4">
          <PublicCalendar />
        </main>
      </div>
    </ThemeProvider>
  )
}


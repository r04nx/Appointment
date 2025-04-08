import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { prisma } from "@/lib/prisma"
import { authOptions } from "@/lib/auth"

// GET all schedule entries
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const date = searchParams.get("date")
    const type = searchParams.get("type")

    let whereClause = {}

    if (date) {
      whereClause = {
        ...whereClause,
        date: date,
      }
    }

    if (type && type !== "all") {
      whereClause = {
        ...whereClause,
        type: type,
      }
    }

    const entries = await prisma.scheduleEntry.findMany({
      where: whereClause,
      orderBy: {
        startTime: "asc",
      },
    })

    return NextResponse.json(entries)
  } catch (error) {
    console.error("Error fetching schedule entries:", error)
    return NextResponse.json({ error: "Failed to fetch schedule entries" }, { status: 500 })
  }
}

// POST a new schedule entry
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const data = await request.json()

    // Validate required fields
    if (!data.title || !data.date || !data.startTime || !data.endTime || !data.type || !data.status) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const entry = await prisma.scheduleEntry.create({
      data,
    })

    return NextResponse.json(entry, { status: 201 })
  } catch (error) {
    console.error("Error creating schedule entry:", error)
    return NextResponse.json({ error: "Failed to create schedule entry" }, { status: 500 })
  }
}


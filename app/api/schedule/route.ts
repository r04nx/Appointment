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
    const room = searchParams.get("room")

    let whereClause: any = {}

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

    if (room) {
      whereClause = {
        ...whereClause,
        room: room,
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
    const userRole = session?.user?.role

    // Validate required fields
    if (!data.title || !data.date || !data.startTime || !data.endTime || !data.type || !data.status || !data.room) {
      return NextResponse.json({ error: "Missing required fields, including room" }, { status: 400 })
    }

    // Overlap Detection
    const existingOverlappingEntry = await prisma.scheduleEntry.findFirst({
      where: {
        room: data.room,
        date: data.date,
        approved: true,
        OR: [
          { // New entry starts during an existing entry OR existing entry starts during new entry
            startTime: { lt: data.endTime },
            endTime: { gt: data.startTime },
          },
        ],
      },
    })

    let responseMessage = "Schedule entry created successfully."
    let responseStatus = 201
    data.approved = true // Default to true

    if (existingOverlappingEntry) {
      if (userRole === "superadmin") {
        // Superadmin can override and create overlapping entries, keep approved: true
        responseMessage = "Warning: Overlapping schedule entry created by superadmin."
        // data.approved is already true
      } else if (userRole === "admin") {
        // Admin creating an overlapping entry, set approved to false
        data.approved = false
        responseMessage = "Schedule entry created but is pending approval due to a conflict."
        // responseStatus remains 201, but client should check 'approved' status and message
      } else {
        // Should not happen if role check is exhaustive, but as a fallback
        return NextResponse.json({ error: "Overlap detected and user role cannot override." }, { status: 409 }) // 409 Conflict
      }
    }

    const entry = await prisma.scheduleEntry.create({
      data: {
        title: data.title,
        date: data.date,
        startTime: data.startTime,
        endTime: data.endTime,
        type: data.type,
        status: data.status,
        color: data.color,
        meetingWith: data.meetingWith,
        location: data.location,
        description: data.description,
        room: data.room, // Ensure room is included
        approved: data.approved, // Set based on overlap logic
      },
    })

    return NextResponse.json({ message: responseMessage, entry }, { status: responseStatus })
  } catch (error) {
    console.error("Error creating schedule entry:", error)
    return NextResponse.json({ error: "Failed to create schedule entry" }, { status: 500 })
  }
}


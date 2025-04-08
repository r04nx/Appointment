import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { prisma } from "@/lib/prisma"
import { authOptions } from "@/lib/auth"

// GET a specific schedule entry
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const entry = await prisma.scheduleEntry.findUnique({
      where: {
        id: params.id,
      },
    })

    if (!entry) {
      return NextResponse.json({ error: "Schedule entry not found" }, { status: 404 })
    }

    return NextResponse.json(entry)
  } catch (error) {
    console.error("Error fetching schedule entry:", error)
    return NextResponse.json({ error: "Failed to fetch schedule entry" }, { status: 500 })
  }
}

// PUT (update) a schedule entry
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const data = await request.json()

    // Check if entry exists
    const existingEntry = await prisma.scheduleEntry.findUnique({
      where: {
        id: params.id,
      },
    })

    if (!existingEntry) {
      return NextResponse.json({ error: "Schedule entry not found" }, { status: 404 })
    }

    // Update entry
    const updatedEntry = await prisma.scheduleEntry.update({
      where: {
        id: params.id,
      },
      data,
    })

    return NextResponse.json(updatedEntry)
  } catch (error) {
    console.error("Error updating schedule entry:", error)
    return NextResponse.json({ error: "Failed to update schedule entry" }, { status: 500 })
  }
}

// DELETE a schedule entry
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if entry exists
    const existingEntry = await prisma.scheduleEntry.findUnique({
      where: {
        id: params.id,
      },
    })

    if (!existingEntry) {
      return NextResponse.json({ error: "Schedule entry not found" }, { status: 404 })
    }

    // Delete entry
    await prisma.scheduleEntry.delete({
      where: {
        id: params.id,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting schedule entry:", error)
    return NextResponse.json({ error: "Failed to delete schedule entry" }, { status: 500 })
  }
}


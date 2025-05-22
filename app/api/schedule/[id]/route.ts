import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { prisma } from "@/lib/prisma"
import { authOptions } from "@/lib/auth"

// GET a specific schedule entry
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const id = params.id
  
  try {
    const entry = await prisma.scheduleEntry.findUnique({
      where: {
        id,
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
  const id = params.id
  
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userRole = session?.user?.role
    const data = await request.json()

    const entryBeingUpdated = await prisma.scheduleEntry.findUnique({
      where: { id },
    })

    if (!entryBeingUpdated) {
      return NextResponse.json({ error: "Schedule entry not found" }, { status: 404 })
    }

    // Authorization for Admin
    const allowedRoomsForAdmin = ["Principal's Office", "Conference Hall", "Auditorium"]
    if (userRole === "admin" && !allowedRoomsForAdmin.includes(entryBeingUpdated.room)) {
      return NextResponse.json({ error: "Admin not authorized to update entries in this room" }, { status: 403 })
    }
    // Superadmin can update any.

    // Determine values for overlap check (updated values or existing ones if not provided)
    const checkRoom = data.room || entryBeingUpdated.room
    const checkDate = data.date || entryBeingUpdated.date
    const checkStartTime = data.startTime || entryBeingUpdated.startTime
    const checkEndTime = data.endTime || entryBeingUpdated.endTime
    
    let newApprovedStatus = data.approved !== undefined ? data.approved : entryBeingUpdated.approved

    // Overlap Detection Logic - only if relevant fields are changing or entry is not approved
    if (data.room || data.date || data.startTime || data.endTime || !entryBeingUpdated.approved) {
      const existingOverlappingEntry = await prisma.scheduleEntry.findFirst({
        where: {
          id: { not: id }, // Exclude the current entry
          room: checkRoom,
          date: checkDate,
          approved: true, // Only check against approved entries
          OR: [
            {
              startTime: { lt: checkEndTime },
              endTime: { gt: checkStartTime },
            },
          ],
        },
      })

      if (existingOverlappingEntry) {
        if (userRole === "superadmin") {
          // Superadmin can override. If they are explicitly setting 'approved', use that.
          // Otherwise, if it's an overlap, it implicitly remains approved.
          newApprovedStatus = data.approved !== undefined ? data.approved : true;
          // Consider adding a warning to the response if an overlap is created/maintained.
        } else if (userRole === "admin") {
          // If an admin's change causes an overlap with an approved entry, mark as not approved.
          newApprovedStatus = false
          // Cannot approve an entry if it causes an overlap
          if (data.approved === true) {
             return NextResponse.json({ error: "Admin cannot approve an entry that causes an overlap." }, { status: 403 });
          }
        } else { // Should not happen
          return NextResponse.json({ error: "Overlap detected and user role cannot override." }, { status: 409 })
        }
      } else {
        // No overlap found. If user is admin and trying to approve, let them if it resolves a previous conflict.
        // Superadmin can always set approved status.
        if (userRole === "superadmin") {
            newApprovedStatus = data.approved !== undefined ? data.approved : true;
        } else if (userRole === "admin") {
            // Admin can only set approved to true if it doesn't cause an overlap (checked above)
            // and if they are explicitly trying to approve it.
            // If data.approved is not provided, keep existing status or default to true if no overlap.
            if (data.approved === true) { // Admin is trying to approve
                newApprovedStatus = true;
            } else if (data.approved === false) { // Admin is explicitly disapproving
                newApprovedStatus = false;
            } else { // data.approved is undefined
                newApprovedStatus = entryBeingUpdated.approved; // keep current status if no overlap and not specified
                 // If it was previously unapproved due to an overlap, and now there's no overlap,
                 // an admin *could* be allowed to make it approved, or it defaults to its current state.
                 // For simplicity, let's say if no overlap, it can become approved if admin intended or was already approved.
                 // If admin is not explicitly setting approved status, and no overlap, let it be true.
                 if(data.approved === undefined && !entryBeingUpdated.approved && !existingOverlappingEntry) {
                    newApprovedStatus = true; // Auto-approve if conflict resolved by changes
                 } else {
                    newApprovedStatus = data.approved !== undefined ? data.approved : entryBeingUpdated.approved;
                 }

                 if (data.approved === true && !existingOverlappingEntry) {
                    newApprovedStatus = true;
                 } else if (data.approved === undefined && !existingOverlappingEntry) {
                    // If not explicitly set, and no overlap, keep current approved state or approve if it was false
                    newApprovedStatus = entryBeingUpdated.approved !== false ? true : false;
                 } else {
                    newApprovedStatus = data.approved !== undefined ? data.approved : entryBeingUpdated.approved;
                 }

            }
        }
      }
    }
    
    // Admin cannot change approved from false to true unless resolving an overlap (handled above)
    if (userRole === "admin" && entryBeingUpdated.approved === false && newApprovedStatus === true) {
        // Re-check for overlap to ensure this approval is valid
        const stillOverlapping = await prisma.scheduleEntry.findFirst({
            where: {
                id: { not: id }, room: checkRoom, date: checkDate, approved: true,
                OR: [{ startTime: { lt: checkEndTime }, endTime: { gt: checkStartTime } }],
            },
        });
        if (stillOverlapping) {
            return NextResponse.json({ error: "Admin cannot approve an entry that still causes an overlap." }, { status: 403 });
        }
    }


    // Prepare data for update, ensuring all fields are correctly merged
    const updateData = { ...entryBeingUpdated, ...data, approved: newApprovedStatus }
    // Remove id from updateData if it was spread from entryBeingUpdated to avoid Prisma error
    delete updateData.id; 
    // Remove fields that should not be directly updated or are managed by Prisma (e.g. createdAt, updatedAt)
    delete updateData.createdAt;
    delete updateData.updatedAt;


    const updatedEntry = await prisma.scheduleEntry.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json(updatedEntry)
  } catch (error) {
    console.error("Error updating schedule entry:", error)
    return NextResponse.json({ error: "Failed to update schedule entry" }, { status: 500 })
  }
}

// DELETE a schedule entry
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  if (!params || typeof params.id !== 'string') {
    return NextResponse.json({ error: "Invalid ID parameter" }, { status: 400 })
  }
  
  const id = params.id
  
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const userRole = session?.user?.role

    const entryToDelete = await prisma.scheduleEntry.findUnique({
      where: { id },
    })

    if (!entryToDelete) {
      return NextResponse.json({ error: "Schedule entry not found" }, { status: 404 })
    }

    // Authorization
    const allowedRoomsForAdminDelete = ["Principal's Office", "Conference Hall", "Auditorium"]
    if (userRole === "admin" && !allowedRoomsForAdminDelete.includes(entryToDelete.room)) {
      return NextResponse.json({ error: "Admin not authorized to delete entries in this room" }, { status: 403 })
    }
    // Superadmin can delete any.

    await prisma.scheduleEntry.delete({
      where: { id },
    })

    return NextResponse.json({ message: "Schedule entry deleted successfully" })
  } catch (error) {
    console.error("Error deleting schedule entry:", error)
    return NextResponse.json({ error: "Failed to delete schedule entry" }, { status: 500 })
  }
}


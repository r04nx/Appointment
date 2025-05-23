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
    const room = searchParams.get("room") // For predefined rooms
    const dynamicEntityId = searchParams.get("dynamicEntityId") // For dynamic entities

    let whereClause: any = {}

    if (date) {
      whereClause.date = date;
    }

    if (type && type !== "all") {
      whereClause.type = type;
    }
    
    // Enhanced filtering for room vs dynamicEntity
    if (dynamicEntityId) {
        whereClause.dynamicEntityId = dynamicEntityId;
        whereClause.isDynamicEntry = true;
    } else if (room && room !== "all") { // "all" might be used by client to signify no specific room/entity filter
        whereClause.room = room;
        whereClause.isDynamicEntry = false; // Explicitly for predefined rooms
    }
    // If neither room nor dynamicEntityId is specified (or room is "all"),
    // the whereClause (potentially just with date/type) will fetch matching entries.

    const entries = await prisma.scheduleEntry.findMany({
      where: whereClause,
      orderBy: {
        startTime: "asc",
      },
      include: { // Include details for display
        dynamicEntity: { 
          select: { 
            id: true, 
            name: true, 
            entityTypeLabel: true 
          } 
        },
        user: { // To show who booked it, if needed
            select: {
                id: true,
                username: true
            }
        }
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

    if (!session || !session.user) { // Ensure session.user exists
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const data = await request.json()
    const { 
      title, date: entryDate, startTime, endTime, type, status, color, 
      meetingWith, location, description, 
      room, isDynamicEntry, dynamicEntityId, forceOverlap 
    } = data;

    // Cast session.user to include custom properties like role and permissions
    const user = session.user as any; 

    // Validate required base fields
    if (!title || !entryDate || !startTime || !endTime || !type || !status) {
      return NextResponse.json({ error: "Missing required fields (title, date, times, type, status)" }, { status: 400 });
    }

    // Validate room vs dynamicEntityId based on isDynamicEntry
    if (isDynamicEntry === true) {
      if (!dynamicEntityId) {
        return NextResponse.json({ error: "Dynamic Entity ID is required for dynamic entries." }, { status: 400 });
      }
      if (room && room.trim() !== "") { // room should not be provided or be an empty string for dynamic entries
        return NextResponse.json({ error: "Room should not be specified for dynamic entries." }, { status: 400 });
      }
    } else { // Predefined room entry
      if (!room || room.trim() === "") {
        return NextResponse.json({ error: "Room is required for non-dynamic (predefined room) entries." }, { status: 400 });
      }
      if (dynamicEntityId) {
        return NextResponse.json({ error: "Dynamic Entity ID should not be specified for non-dynamic (room-based) entries." }, { status: 400 });
      }
    }
    
    // Authorization
    let authorized = false;
    if (user.role === "superadmin") {
      authorized = true;
    } else if (user.role === "admin") {
        if (isDynamicEntry) {
            if (user.canManageDynamicEntities) {
                authorized = true;
            } else {
                // Check if they are a manager of THIS specific dynamic entity
                if (dynamicEntityId){ // Ensure dynamicEntityId is present before querying
                    const entity = await prisma.dynamicEntity.findUnique({ where: { id: dynamicEntityId } });
                    if (entity?.managerId === user.id) {
                        authorized = true;
                    }
                }
            }
        } else { // Predefined room
            if (room === "Principal's Office" && user.canEditPrincipalSchedule) authorized = true;
            else if (room === "Auditorium" && user.canManageAuditorium) authorized = true;
            else if (room === "Conference Hall" && user.canManageConferenceHall) authorized = true;
        }
    }

    if (!authorized) {
      return NextResponse.json({ error: "Forbidden. You do not have permission to create entries for this room/entity." }, { status: 403 });
    }

    // Conflict Detection
    let conflictWhereClause: any = {
      date: entryDate,
      NOT: { status: "cancelled" }, 
      OR: [
        { startTime: { lt: endTime }, endTime: { gt: startTime } }, 
      ],
    };

    if (isDynamicEntry) {
      conflictWhereClause.dynamicEntityId = dynamicEntityId;
      conflictWhereClause.isDynamicEntry = true;
    } else {
      conflictWhereClause.room = room;
      conflictWhereClause.isDynamicEntry = false;
    }
    
    const existingOverlappingEntry = await prisma.scheduleEntry.findFirst({
      where: conflictWhereClause,
      include: { 
          dynamicEntity: {select: {name: true, entityTypeLabel: true}},
          user: {select: {username: true}} 
      }
    });

    if (existingOverlappingEntry && !forceOverlap) {
      const conflictingDetails = {
        id: existingOverlappingEntry.id,
        title: existingOverlappingEntry.title,
        startTime: existingOverlappingEntry.startTime,
        endTime: existingOverlappingEntry.endTime,
        bookedBy: existingOverlappingEntry.user?.username,
        ...(existingOverlappingEntry.isDynamicEntry && existingOverlappingEntry.dynamicEntity 
            ? { dynamicEntityName: existingOverlappingEntry.dynamicEntity.name, entityTypeLabel: existingOverlappingEntry.dynamicEntity.entityTypeLabel } 
            : { room: existingOverlappingEntry.room })
      };
      return NextResponse.json({ 
        error: "Schedule conflict detected. Please choose a different time or contact the administrator if you believe this is an error.", 
        conflictingEntry: conflictingDetails
      }, { status: 409 });
    }

    // Prepare data for creation
    const createData: any = {
      title, date: entryDate, startTime, endTime, type, status, color,
      meetingWith: meetingWith || null,
      location: location || null,
      description: description || null,
      isDynamicEntry: !!isDynamicEntry, 
      userId: user.id, 
    };

    if (isDynamicEntry) {
      createData.dynamicEntityId = dynamicEntityId;
      createData.room = null; 
    } else {
      createData.room = room;
      createData.dynamicEntityId = null; 
    }
    
    const entry = await prisma.scheduleEntry.create({
      data: createData,
      include: { 
        dynamicEntity: { select: { id: true, name: true, entityTypeLabel: true } },
        user: { select: { id: true, username: true }} 
      },
    });

    let message = "Schedule entry created successfully.";
    if (existingOverlappingEntry && forceOverlap) {
        message = "Schedule entry created. Note: This entry overlaps with an existing booking, which was allowed by force."
    }

    return NextResponse.json({ message, entry }, { status: 201 });
  } catch (error) {
    console.error("Error creating schedule entry:", error);
    if (error instanceof Error && error.message.includes("Foreign key constraint failed")) {
      if (error.message.includes("dynamicEntityId")) {
        return NextResponse.json({ error: "Invalid Dynamic Entity ID provided." }, { status: 400 });
      }
       if (error.message.includes("userId")) { 
        return NextResponse.json({ error: "Invalid User ID provided for schedule entry." }, { status: 400 });
      }
    }
    return NextResponse.json({ error: "Failed to create schedule entry" }, { status: 500 });
  }
}

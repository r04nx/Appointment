import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// GET /api/dynamic-entities/[id] - Get a specific dynamic entity (superadmin only)
export async function GET(
  req: NextRequest,
  context: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  const { id } = context.params;

  if (!session || session.user.role !== "superadmin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const dynamicEntity = await prisma.dynamicEntity.findUnique({
      where: { id },
      include: {
        manager: {
          select: {
            username: true,
            id: true,
          },
        },
      },
    });

    if (!dynamicEntity) {
      return NextResponse.json(
        { error: "Dynamic entity not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(dynamicEntity);
  } catch (error) {
    console.error("Error fetching dynamic entity:", error);
    return NextResponse.json(
      { error: "Failed to fetch dynamic entity" },
      { status: 500 }
    );
  }
}

// PUT /api/dynamic-entities/[id] - Update a dynamic entity (superadmin only)
export async function PUT(
  req: NextRequest,
  context: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  const { id } = context.params;

  if (!session || session.user.role !== "superadmin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const { name, entityTypeLabel, managerId } = await req.json();

    // Validate input
    if (!name || !entityTypeLabel) {
      return NextResponse.json(
        { error: "Name and Entity Type Label are required" },
        { status: 400 }
      );
    }
    
    // Check if entity exists
    const existingEntity = await prisma.dynamicEntity.findUnique({ where: { id } });
    if (!existingEntity) {
        return NextResponse.json({ error: "Dynamic entity not found" }, { status: 404 });
    }

    // Prepare update data
    const updateData: {
      name: string;
      entityTypeLabel: string;
      managerId?: string | null;
    } = {
      name,
      entityTypeLabel,
    };

    if (managerId === null || managerId === "" || managerId === "none") {
      updateData.managerId = null;
    } else if (managerId) {
      updateData.managerId = managerId;
    }
    // If managerId is undefined, it's not included in updateData, so it won't be changed.

    const updatedDynamicEntity = await prisma.dynamicEntity.update({
      where: { id },
      data: updateData,
      include: {
        manager: {
          select: {
            username: true,
            id: true,
          },
        },
      }
    });

    return NextResponse.json(updatedDynamicEntity);
  } catch (error) {
    console.error("Error updating dynamic entity:", error);
    if (error instanceof Error && error.message.includes("Foreign key constraint failed")) {
        return NextResponse.json({ error: "Invalid manager ID provided." }, { status: 400 });
    }
    return NextResponse.json(
      { error: "Failed to update dynamic entity" },
      { status: 500 }
    );
  }
}

// DELETE /api/dynamic-entities/[id] - Delete a dynamic entity (superadmin only)
export async function DELETE(
  req: NextRequest,
  context: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  const { id } = context.params;

  if (!session || session.user.role !== "superadmin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    // Check if entity exists
    const existingEntity = await prisma.dynamicEntity.findUnique({ where: { id } });
    if (!existingEntity) {
        return NextResponse.json({ error: "Dynamic entity not found" }, { status: 404 });
    }
    
    await prisma.dynamicEntity.delete({
      where: { id },
    });

    // Due to `onDelete: SetNull` in the schema for ScheduleEntry.dynamicEntity,
    // related ScheduleEntry records will have their dynamicEntityId set to null automatically.

    return new NextResponse(null, { status: 204 }); // Or return NextResponse.json({ message: "Dynamic entity deleted successfully" });
  } catch (error) {
    console.error("Error deleting dynamic entity:", error);
    return NextResponse.json(
      { error: "Failed to delete dynamic entity" },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// GET /api/dynamic-entities - Get all dynamic entities (superadmin only)
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "superadmin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const dynamicEntities = await prisma.dynamicEntity.findMany({
      include: {
        manager: {
          select: {
            username: true,
            id: true,
          },
        },
        // Optionally, count related schedule entries if useful for the frontend
        // _count: {
        //   select: { scheduleEntries: true },
        // },
      },
      orderBy: {
        name: "asc",
      },
    });
    return NextResponse.json(dynamicEntities);
  } catch (error) {
    console.error("Error fetching dynamic entities:", error);
    return NextResponse.json(
      { error: "Failed to fetch dynamic entities" },
      { status: 500 }
    );
  }
}

// POST /api/dynamic-entities - Create a new dynamic entity (superadmin only)
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);

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

    // Create dynamic entity
    const dynamicEntity = await prisma.dynamicEntity.create({
      data: {
        name,
        entityTypeLabel,
        managerId: managerId || null, // Ensure managerId is null if not provided or empty string
      },
      include: { // Include manager details in the response
        manager: {
          select: {
            username: true,
            id: true,
          },
        },
      }
    });

    return NextResponse.json(dynamicEntity, { status: 201 });
  } catch (error) {
    console.error("Error creating dynamic entity:", error);
    if (error instanceof Error && error.message.includes("Foreign key constraint failed")) {
        return NextResponse.json({ error: "Invalid manager ID provided." }, { status: 400 });
    }
    return NextResponse.json(
      { error: "Failed to create dynamic entity" },
      { status: 500 }
    );
  }
}

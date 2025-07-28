import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { hash } from "bcryptjs"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

// GET /api/users/[id] - Get a specific user (superadmin only)
export async function GET(
  req: NextRequest,
  context: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  const { id } = context.params

  // Check if user is authenticated and is a superadmin
  if (!session || session.user.role !== "superadmin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        username: true,
        role: true,
        canManageAuditorium: true,
        canManageConferenceHall: true,
        canEditPrincipalSchedule: true,
        canManageDynamicEntities: true,
      },
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    return NextResponse.json(user)
  } catch (error) {
    console.error("Error fetching user:", error)
    return NextResponse.json({ error: "Failed to fetch user" }, { status: 500 })
  }
}

// PUT /api/users/[id] - Update a user (superadmin only)
export async function PUT(
  req: NextRequest,
  context: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  const { id } = context.params

  // Check if user is authenticated and is a superadmin
  if (!session || session.user.role !== "superadmin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
  }

  try {
    const { 
      username, 
      password, 
      role,
      canManageAuditorium,
      canManageConferenceHall,
      canEditPrincipalSchedule,
      canManageDynamicEntities
    } = await req.json()

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id },
    })

    if (!existingUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Prevent updating superadmin users
    if (existingUser.role === "superadmin") {
      return NextResponse.json({ error: "Cannot update superadmin users" }, { status: 403 })
    }

    // Only allow updating to admin role
    if (role && role !== "admin") {
      return NextResponse.json({ error: "Can only set role to admin" }, { status: 400 })
    }

    // Prepare update data
    const updateData: any = {}
    if (username) updateData.username = username
    if (password) updateData.password = await hash(password, 12)
    if (role) updateData.role = role

    // Add new permissions, explicitly checking for boolean to allow setting to false
    if (typeof canManageAuditorium === 'boolean') updateData.canManageAuditorium = canManageAuditorium;
    if (typeof canManageConferenceHall === 'boolean') updateData.canManageConferenceHall = canManageConferenceHall;
    if (typeof canEditPrincipalSchedule === 'boolean') updateData.canEditPrincipalSchedule = canEditPrincipalSchedule;
    if (typeof canManageDynamicEntities === 'boolean') updateData.canManageDynamicEntities = canManageDynamicEntities;

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        username: true,
        role: true,
        canManageAuditorium: true,
        canManageConferenceHall: true,
        canEditPrincipalSchedule: true,
        canManageDynamicEntities: true,
      },
    })

    return NextResponse.json(updatedUser)
  } catch (error) {
    console.error("Error updating user:", error)
    return NextResponse.json({ error: "Failed to update user" }, { status: 500 })
  }
}

// DELETE /api/users/[id] - Delete a user (superadmin only)
export async function DELETE(
  req: NextRequest,
  context: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  const { id } = context.params

  // Check if user is authenticated and is a superadmin
  if (!session || session.user.role !== "superadmin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
  }

  try {
    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id },
    })

    if (!existingUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Prevent deleting superadmin users
    if (existingUser.role === "superadmin") {
      return NextResponse.json({ error: "Cannot delete superadmin users" }, { status: 403 })
    }

    // Delete user
    await prisma.user.delete({
      where: { id },
    })

    return NextResponse.json({ message: "User deleted successfully" })
  } catch (error) {
    console.error("Error deleting user:", error)
    return NextResponse.json({ error: "Failed to delete user" }, { status: 500 })
  }
}

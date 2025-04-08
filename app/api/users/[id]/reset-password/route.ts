import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { hash } from "bcryptjs"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

// POST /api/users/[id]/reset-password - Reset user password (superadmin only)
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)

  // Check if user is authenticated and is a superadmin
  if (!session || session.user.role !== "superadmin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
  }

  try {
    const { password } = await req.json()

    // Validate input
    if (!password) {
      return NextResponse.json({ error: "Password is required" }, { status: 400 })
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: params.id },
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Don't allow superadmins to modify other superadmins
    if (user.role === "superadmin" && session.user.id !== user.id) {
      return NextResponse.json(
        { error: "Superadmins cannot modify other superadmins" },
        { status: 403 }
      )
    }

    // Hash the new password
    const hashedPassword = await hash(password, 10)

    // Update the user's password
    await prisma.user.update({
      where: { id: params.id },
      data: { password: hashedPassword },
    })

    return NextResponse.json({ message: "Password reset successfully" })
  } catch (error) {
    console.error("Error resetting password:", error)
    return NextResponse.json(
      { error: "Failed to reset password" },
      { status: 500 }
    )
  }
}

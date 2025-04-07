import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const data = await request.json()
    const appointment = await prisma.appointment.update({
      where: { id: params.id },
      data: {
        date: data.date,
        time: data.time,
        endTime: data.endTime,
        status: data.status,
        with: data.with,
      },
    })
    return NextResponse.json(appointment)
  } catch (error) {
    console.error('Error updating appointment:', error)
    return NextResponse.json(
      { error: 'Failed to update appointment' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.appointment.delete({
      where: { id: params.id },
    })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting appointment:', error)
    return NextResponse.json(
      { error: 'Failed to delete appointment' },
      { status: 500 }
    )
  }
} 
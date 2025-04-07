import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { z } from 'zod'
import { Prisma } from '@prisma/client'

const AppointmentSchema = z.object({
  date: z.string(),
  time: z.string(),
  endTime: z.string().optional(),
  status: z.enum(['available', 'booked']),
  with: z.string().optional(),
  duration: z.number().optional(), // Added duration field
})

export async function GET() {
  try {
    const appointments = await prisma.appointment.findMany({
      orderBy: [
        { date: 'asc' },
        { time: 'asc' },
      ],
    })
    return NextResponse.json(appointments)
  } catch (error) {
    console.error('Database error:', error)
    if (error instanceof Prisma.PrismaClientInitializationError) {
      return NextResponse.json(
        { error: 'Database connection failed' },
        { status: 503 }
      )
    }
    return NextResponse.json(
      { error: 'Failed to fetch appointments' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const validated = AppointmentSchema.parse(body)

    // Check if an appointment already exists for this date and time
    const existingAppointment = await prisma.appointment.findFirst({
      where: {
        date: validated.date,
        time: validated.time,
      },
    })

    if (existingAppointment) {
      return NextResponse.json(
        { error: 'An appointment already exists for this time slot' },
        { status: 409 }
      )
    }

    const appointment = await prisma.appointment.create({
      data: validated,
    })

    return NextResponse.json(appointment)
  } catch (error) {
    console.error('Database error:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid appointment data', details: error.errors },
        { status: 400 }
      )
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      return NextResponse.json(
        { error: 'Database constraint violation' },
        { status: 409 }
      )
    }
    return NextResponse.json(
      { error: 'Failed to create appointment' },
      { status: 500 }
    )
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json()
    const { id, ...data } = body

    if (!id) {
      return NextResponse.json(
        { error: 'Appointment ID is required' },
        { status: 400 }
      )
    }

    const validated = AppointmentSchema.parse(data)

    // Check if the appointment exists
    const existingAppointment = await prisma.appointment.findUnique({
      where: { id },
    })

    if (!existingAppointment) {
      return NextResponse.json(
        { error: 'Appointment not found' },
        { status: 404 }
      )
    }

    const appointment = await prisma.appointment.update({
      where: { id },
      data: validated,
    })

    return NextResponse.json(appointment)
  } catch (error) {
    console.error('Error updating appointment:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid appointment data', details: error.errors },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: 'Failed to update appointment' },
      { status: 500 }
    )
  }
} 
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  try {
    // Clear existing appointments
    await prisma.appointment.deleteMany({})
    
    // Create initial appointments
    const appointments = await prisma.appointment.createMany({
      data: [
        {
          date: new Date().toISOString().split('T')[0], // Today
          time: '10:00',
          endTime: '10:30',
          status: 'available'
        },
        {
          date: new Date().toISOString().split('T')[0],
          time: '10:30',
          endTime: '11:00',
          status: 'available'
        },
        {
          date: new Date().toISOString().split('T')[0],
          time: '11:00',
          endTime: '11:30',
          status: 'available'
        },
        {
          date: new Date(Date.now() + 86400000).toISOString().split('T')[0], // Tomorrow
          time: '10:00',
          endTime: '10:30',
          status: 'available'
        },
        {
          date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
          time: '10:30',
          endTime: '11:00',
          status: 'available'
        }
      ]
    })

    console.log('Database seeded with initial appointments')
  } catch (error) {
    console.error('Error seeding database:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main() 
const { PrismaClient } = require('@prisma/client')
const cryptoModule = require('crypto')
const dotenv = require('dotenv')

// Load environment variables
dotenv.config()

const prisma = new PrismaClient()

// Simple hash function for passwords
function hashPassword(password: string): string {
  return cryptoModule.createHash('sha256').update(password).digest('hex')
}

async function main() {
  try {
    // Test the connection
    await prisma.$connect()
    console.log('Database connection successful')

    // Create admin user if it doesn't exist
    const adminUsername = process.env.ADMIN_USERNAME || 'admin'
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123'
    
    const adminCount = await prisma.admin.count()
    if (adminCount === 0) {
      console.log('Creating admin user...')
      
      // Hash the password
      const hashedPassword = hashPassword(adminPassword)
      
      // Create admin user
      await prisma.admin.create({
        data: {
          username: adminUsername,
          password: hashedPassword
        }
      })
      
      console.log(`Admin user created with username: ${adminUsername}`)
    }

    // Create some initial appointments if needed
    const appointmentCount = await prisma.appointment.count()
    if (appointmentCount === 0) {
      console.log('Creating initial appointments...')
      
      // Get current date
      const today = new Date()
      const tomorrow = new Date(today)
      tomorrow.setDate(today.getDate() + 1)
      
      const formatDate = (date: Date) => {
        return date.toISOString().split('T')[0]
      }
      
      // Add some sample appointments
      await prisma.appointment.createMany({
        data: [
          {
            date: formatDate(today),
            time: '10:00',
            endTime: '10:30',
            status: 'available'
          },
          {
            date: formatDate(today),
            time: '11:00',
            endTime: '11:30',
            status: 'available'
          },
          {
            date: formatDate(tomorrow),
            time: '14:00',
            endTime: '14:30',
            status: 'available'
          },
          {
            date: formatDate(tomorrow),
            time: '15:00',
            endTime: '15:30',
            status: 'available'
          }
        ]
      })
      console.log('Initial appointments created')
    }
  } catch (error) {
    console.error('Database initialization error:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main() 
const { PrismaClient } = require('@prisma/client')
const { hash } = require('bcryptjs')

const prisma = new PrismaClient()

async function main() {
  // Create superadmin user with bcryptjs
  const superadminPassword = await hash(process.env.SUPERADMIN_PASSWORD || 'superadmin456', 12)

  await prisma.user.upsert({
    where: { username: 'superadmin' },
    update: {},
    create: {
      username: 'superadmin',
      password: superadminPassword,
      role: 'superadmin',
    },
  })

  // Create admin user with bcryptjs
  const adminPassword = await hash(process.env.ADMIN_PASSWORD || 'admin123', 12)

  await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      password: adminPassword,
      role: 'admin',
    },
  })

  // Create sample schedule entries
  const today = new Date().toISOString().split('T')[0]
  const tomorrow = new Date(new Date().setDate(new Date().getDate() + 1)).toISOString().split('T')[0]
  const dayAfterTomorrow = new Date(new Date().setDate(new Date().getDate() + 2)).toISOString().split('T')[0]

  const sampleEntries = [
    {
      title: 'Faculty Meeting',
      date: today,
      startTime: '09:00',
      endTime: '10:30',
      type: 'meeting',
      status: 'confirmed',
      color: '#4f46e5',
      meetingWith: 'Department Heads',
      location: 'Conference Room A',
      description: 'Monthly faculty meeting to discuss curriculum updates',
    },
    {
      title: 'Student Council',
      date: today,
      startTime: '11:00',
      endTime: '12:00',
      type: 'meeting',
      status: 'confirmed',
      color: '#4f46e5',
      meetingWith: 'Student Council Representatives',
      location: 'Principal\'s Office',
      description: 'Discussion about upcoming school events',
    },
    {
      title: 'Lunch Break',
      date: today,
      startTime: '12:30',
      endTime: '13:30',
      type: 'unavailable',
      status: 'confirmed',
      color: '#ef4444',
      description: 'Personal time',
    },
    {
      title: 'Parent-Teacher Conference',
      date: today,
      startTime: '14:00',
      endTime: '15:30',
      type: 'appointment',
      status: 'confirmed',
      color: '#10b981',
      meetingWith: 'Mr. & Mrs. Johnson',
      location: 'Meeting Room 2',
      description: 'Discussing student progress and concerns',
    },
    {
      title: 'Budget Review',
      date: today,
      startTime: '16:00',
      endTime: '17:00',
      type: 'meeting',
      status: 'confirmed',
      color: '#4f46e5',
      meetingWith: 'Finance Committee',
      location: 'Conference Room B',
      description: 'Quarterly budget review and planning',
    },
    {
      title: 'School Board Meeting',
      date: tomorrow,
      startTime: '10:00',
      endTime: '12:00',
      type: 'meeting',
      status: 'confirmed',
      color: '#4f46e5',
      meetingWith: 'School Board Members',
      location: 'Board Room',
      description: 'Monthly school board meeting',
    },
    {
      title: 'Teacher Evaluation',
      date: tomorrow,
      startTime: '13:00',
      endTime: '14:00',
      type: 'appointment',
      status: 'confirmed',
      color: '#10b981',
      meetingWith: 'Ms. Smith - Computer Science Department',
      location: 'Classroom 101',
      description: 'Annual teacher performance evaluation',
    },
    {
      title: 'Curriculum Development',
      date: tomorrow,
      startTime: '15:00',
      endTime: '16:30',
      type: 'meeting',
      status: 'confirmed',
      color: '#4f46e5',
      meetingWith: 'Curriculum Committee',
      location: 'Conference Room A',
      description: 'Planning for next semester\'s curriculum',
    },
    {
      title: 'Industry Expert Coordination',
      date: dayAfterTomorrow,
      startTime: '09:30',
      endTime: '10:30',
      type: 'appointment',
      status: 'tentative',
      color: '#10b981',
      meetingWith: 'Dr. Patel - Industry Expert',
      location: 'Principal\'s Office',
      description: 'Planning for upcoming guest lecture series',
    },
    {
      title: 'Faculty Development Workshop',
      date: dayAfterTomorrow,
      startTime: '13:00',
      endTime: '16:00',
      type: 'event',
      status: 'confirmed',
      color: '#8b5cf6',
      location: 'Auditorium',
      description: 'Professional development workshop for all faculty',
    },
  ]

  for (const entry of sampleEntries) {
    await prisma.scheduleEntry.create({
      data: entry,
    })
  }

  console.log('Database has been seeded.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })


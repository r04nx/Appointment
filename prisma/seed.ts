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

  // No sample schedule entries - removed dummy data

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


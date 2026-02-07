import { PrismaClient } from '@prisma/client'
import { hash } from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const passwordHash = await hash('123456', 8)

  await prisma.user.upsert({
    where: { email: 'fernando@crm.com' },
    update: {}, 
    create: {
      name: 'Fernando Vieira',
      email: 'fernando@crm.com',
      password: passwordHash,
      role: 'ADMIN'
    },
  })

  console.log("🌱 Seed realizado com sucesso! Usuário admin criado.")
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
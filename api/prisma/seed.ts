import { PrismaClient, FunnelStage } from '@prisma/client'
import { hash } from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log("Iniciando o seed...")

  const passwordHash = await hash("123456", 8);

  const user = await prisma.user.upsert({
    where: { email: "fernando@crm.com" },
    update: {}, 
    create: {
      name: "Fernando Vieira",
      email: "fernando@crm.com",
      password: passwordHash,
      role: "ADMIN"
    }
  })

  console.log(`Usuário garantido: ${user.name} (${user.id})`)

  const leadsData = [
    {
      companyName: "Padaria do Seu Zé",
      phone: "11999990001",
      city: "São Paulo",
      ownerId: user.id,
      funnelStage: FunnelStage.NOVO, 
      tags: ["novo"] 
    },
    {
      companyName: "Oficina Mecânica Rapidão",
      phone: "11999990002",
      city: "Curitiba",
      ownerId: user.id,
      funnelStage: FunnelStage.NOVO,
      tags: ["novo"]
    },
    {
      companyName: "Tech Solutions Ltda",
      phone: "11999990005",
      city: "Florianópolis",
      ownerId: user.id,
      funnelStage: FunnelStage.NOVO,
      tags: ["novo"]
    },
    {
      companyName: "Supermercado Preço Bom",
      phone: "11999990004",
      city: "Belo Horizonte",
      ownerId: user.id,
      funnelStage: FunnelStage.NOVO,
      tags: ["novo"]
    },
    {
      companyName: "Clínica de Estética Bela",
      phone: "11999990003",
      city: "Rio de Janeiro",
      ownerId: user.id,
      funnelStage: FunnelStage.NOVO,
      tags: ["novo"]
    },
    {
      companyName: "Lead Antigo Ltda",
      phone: "11999990006",
      city: "Porto Alegre",
      ownerId: user.id,
      funnelStage: FunnelStage.NOVO, 
      tags: ["novo"]
    }
  ]

  await prisma.lead.deleteMany({ where: { ownerId: user.id } });

  await prisma.lead.createMany({
    data: leadsData
  })

  console.log(`6 Leads criados com sucesso na coluna NOVO para o usuário ${user.name}!`)
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
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding Ex Officio initial database records...');

  // Create demo Lead user
  const lead = await prisma.user.upsert({
    where: { email: 'lead@exofficio.dev' },
    update: {},
    create: {
      name: 'Sarah Connor',
      email: 'lead@exofficio.dev',
      role: 'PROJECT_LEAD',
    },
  });

  // Create demo Departing user
  const departing = await prisma.user.upsert({
    where: { email: 'alex.chen@acme.com' },
    update: {},
    create: {
      name: 'Alex Chen',
      email: 'alex.chen@acme.com',
      role: 'MEMBER',
    },
  });

  // Create demo Successor user
  const successor = await prisma.user.upsert({
    where: { email: 'priya.sharma@acme.com' },
    update: {},
    create: {
      name: 'Priya Sharma',
      email: 'priya.sharma@acme.com',
      role: 'MEMBER',
    },
  });

  // Create sample Project
  const project = await prisma.project.upsert({
    where: { slug: 'apollo-core' },
    update: {},
    create: {
      name: 'Apollo Core Platform',
      slug: 'apollo-core',
      description: 'Distributed event-driven transaction gateway with PostgreSQL, Prisma, and NextAuth.js.',
      status: 'HANDOVER_IN_PROGRESS',
      techStack: ['TypeScript', 'Next.js', 'PostgreSQL', 'Prisma', 'Kafka'],
      ownerId: lead.id,
    },
  });

  console.log(`Demo project seeded: ${project.name} (${project.id})`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

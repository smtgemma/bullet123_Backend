const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const result = await prisma.$queryRaw`SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'`;
    console.log('Tables in public schema:', result);
  } catch (error) {
    console.error('Error fetching tables:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();

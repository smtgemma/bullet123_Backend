import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Starting data migration for PropertyStatus enum...");

  // Update existing string values to match new ENUM values
  try {
    // 1. Update 'Vacant' to 'VACANT'
    const vacantUpdate = await prisma.$executeRawUnsafe(
      `UPDATE property_infos SET "vacancyStatus" = 'VACANT' WHERE "vacancyStatus" = 'Vacant'`
    );
    console.log(`Updated ${vacantUpdate} rows from 'Vacant' to 'VACANT'`);

    // 2. Update 'Closed' to 'CLOSED'
    const closedUpdate = await prisma.$executeRawUnsafe(
      `UPDATE property_infos SET "vacancyStatus" = 'CLOSED' WHERE "vacancyStatus" = 'Closed'`
    );
    console.log(`Updated ${closedUpdate} rows from 'Closed' to 'CLOSED'`);

    // 3. Update 'Under Contract' to 'UNDER_CONTRACT'
    const contractUpdate = await prisma.$executeRawUnsafe(
      `UPDATE property_infos SET "vacancyStatus" = 'UNDER_CONTRACT' WHERE "vacancyStatus" = 'Under Contract'`
    );
    console.log(`Updated ${contractUpdate} rows from 'Under Contract' to 'UNDER_CONTRACT'`);

    console.log("Migration completed successfully!");
  } catch (error) {
    console.error("Migration failed:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();

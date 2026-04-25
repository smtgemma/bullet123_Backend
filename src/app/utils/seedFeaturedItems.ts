import prisma from "./prisma";
import * as fs from "fs";
import * as path from "path";

export const seedFeaturedItems = async () => {
  try {
    console.log(" Starting Featured Items seed...");

    const jsonPath = path.resolve(__dirname, "..", "..", "featuredItems.json");

    if (!fs.existsSync(jsonPath)) {
      console.log("featuredItems.json not found. Skipping seed.");
      console.log("Expected path:", jsonPath);
      return;
    }

    const jsonData = fs.readFileSync(jsonPath, "utf-8");
    const data = JSON.parse(jsonData);

    if (!data.featuredItems || !Array.isArray(data.featuredItems)) {
      console.log("Invalid JSON format. Skipping seed.");
      return;
    }

    let createdCount = 0;
    let updatedCount = 0;

    for (const item of data.featuredItems) {
      await prisma.featuredItem.upsert({
        where: { key: item.key },
        update: {
          name: item.name,
          type: item.type,
          active: item.active ?? true,
        },
        create: {
          name: item.name,
          key: item.key,
          type: item.type,
          active: item.active ?? true,
        },
      });
      createdCount++;
    }

    console.log(
      `Featured items seeded successfully! (${createdCount} items processed)`
    );
  } catch (error) {
    console.error("Error seeding featured items:", error);
    throw error;
  }
};

import prisma from "./prisma";
import * as fs from "fs";
import * as path from "path";

export const seedFeaturedItems = async () => {
  try {
    // Check if already seeded — only run once on first startup
    const existingCount = await prisma.featuredItem.count();
    if (existingCount > 0) {
      console.log(`⏭️  Featured items already seeded (${existingCount} items found). Skipping.`);
      return;
    }

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

    for (const item of data.featuredItems) {
      await prisma.featuredItem.create({
        data: {
          name: item.name,
          key: item.key,
          type: item.type,
          active: item.active ?? true,
        },
      });
      createdCount++;
    }

    console.log(
      `✅ Featured items seeded successfully! (${createdCount} items created)`
    );
  } catch (error) {
    console.error("Error seeding featured items:", error);
    throw error;
  }
};

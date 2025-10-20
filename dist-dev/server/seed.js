import { db } from "./db";
import { institutions } from "@shared/schema";
async function seed() {
  console.log("Seeding database...");
  const existing = await db.select().from(institutions);
  if (existing.length > 0) {
    console.log("Database already has data, skipping seed");
    return;
  }
  const sampleInstitutions = [
    {
      code: "CBZ",
      name: "CBZ Bank Limited",
      type: "commercial_bank",
      status: "active"
    },
    {
      code: "FBC",
      name: "FBC Bank Limited",
      type: "commercial_bank",
      status: "active"
    },
    {
      code: "STANBIC",
      name: "Stanbic Bank Zimbabwe Limited",
      type: "commercial_bank",
      status: "active"
    },
    {
      code: "STEWARD",
      name: "Steward Bank Limited",
      type: "commercial_bank",
      status: "active"
    },
    {
      code: "CABS",
      name: "CABS",
      type: "commercial_bank",
      status: "active"
    },
    {
      code: "NMB",
      name: "NMB Bank Limited",
      type: "commercial_bank",
      status: "active"
    }
  ];
  for (const inst of sampleInstitutions) {
    await db.insert(institutions).values(inst);
  }
  console.log(`Seeded ${sampleInstitutions.length} institutions`);
  console.log("Seed complete!");
}
seed().then(() => process.exit(0)).catch((error) => {
  console.error("Seed failed:", error);
  process.exit(1);
});

import { storage } from "../storage";

async function run() {
  const userId = 1; // Default dev user
  console.log("Seeding wizard templates for user", userId);
  try {
    const { seedWizardTemplates } = await import("../seed-wizard");
    await seedWizardTemplates(userId);
    console.log("Done!");
    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}

run();

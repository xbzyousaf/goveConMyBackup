import "dotenv/config";
import { db } from "./server/db";
import { users, serviceRequests, reviews } from "./shared/schema";
import { AuthService } from "./server/auth";
import { eq } from "drizzle-orm";
import type { InferInsertModel } from "drizzle-orm";

type UserInsert = InferInsertModel<typeof users>;

async function seed() {
  const passwordHash = await AuthService.hashPassword("11223344");

  // --- 1. Seed Users ---
  const seedUsers: UserInsert[] = [
    { email: "admin@gmail.com", firstName: "Super",lastName: "Admin", password: passwordHash, userType: "admin", isEmailVerified: true },
    { email: "vendor@gmail.com", firstName: "Vendor", lastName: "1",password: passwordHash, userType: "vendor", isEmailVerified: true },
    { email: "contractor@gmail.com", firstName: "Contractor", lastName: "1", password: passwordHash, userType: "contractor", isEmailVerified: true },
  ];

  for (const user of seedUsers) {
    const existing = await db.select().from(users).where(eq(users.email, user.email!));
    if (existing.length) {
      console.log(`⚠️ Skipping ${user.email}`);
      continue;
    }
    await db.insert(users).values(user);
    console.log(`✅ Created ${user.userType}: ${user.email}`);
  }
}

seed()
  .catch(console.error)
  .finally(() => process.exit(0));

import "dotenv/config";
import { db } from "./server/db";
import { users, serviceRequests, reviews,wallets } from "./shared/schema";
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
    const existing = await db
      .select()
      .from(users)
      .where(eq(users.email, user.email!));

    let userId: string;

    if (existing.length) {
      console.log(`⚠️ Skipping ${user.email}`);
      userId = existing[0].id;
    } else {
      const inserted = await db
        .insert(users)
        .values(user)
        .returning();

      userId = inserted[0].id;
      console.log(`✅ Created ${user.userType}: ${user.email}`);
    }

    const existingWallet = await db
      .select()
      .from(wallets)
      .where(eq(wallets.userId, userId));

    if (!existingWallet.length) {
      await db.insert(wallets).values({
        userId,
        balance: "0.00",
      });

      console.log(`💰 Wallet created for ${user.email}`);
    }
  }
}

seed()
  .catch(console.error)
  .finally(() => process.exit(0));

import "dotenv/config";
import { db } from "./server/db";
import { users, serviceRequests, reviews } from "./shared/schema";
import { AuthService } from "./server/auth";
import { eq } from "drizzle-orm";
import type { InferInsertModel } from "drizzle-orm";

type UserInsert = InferInsertModel<typeof users>;
type ServiceRequestInsert = InferInsertModel<typeof serviceRequests>;
type ReviewInsert = InferInsertModel<typeof reviews>;

async function seed() {
  const passwordHash = await AuthService.hashPassword("11223344");

  // --- 1. Seed Users ---
  const seedUsers: UserInsert[] = [
    { email: "admin@gmail.com", password: passwordHash, userType: "admin", isEmailVerified: true },
    { email: "vendor@gmail.com", password: passwordHash, userType: "vendor", isEmailVerified: true },
    { email: "contractor@gmail.com", password: passwordHash, userType: "contractor", isEmailVerified: true },
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

  // --- 2. Fetch vendor and contractor IDs ---
  const vendor = await db.select().from(users).where(eq(users.email, "vendor@gmail.com")).limit(1);
  const contractor = await db.select().from(users).where(eq(users.email, "contractor@gmail.com")).limit(1);

  if (!vendor[0] || !contractor[0]) {
    console.error("❌ Vendor or Contractor not found, cannot seed service requests");
    return;
  }

  const vendorId = vendor[0].id;
  const contractorId = contractor[0].id;

  // --- 3. Seed Service Requests ---
  const requests: ServiceRequestInsert[] = [
    {
      contractorId,
      vendorId,
      title: "Website Redesign",
      description: "Redesign our corporate website with modern UX/UI.",
      category: "marketing",
      priority: "high",
      status: "completed", // mark one as completed for review
      budget: "5000",
      estimatedDuration: "2 weeks",
    },
    {
      contractorId,
      vendorId,
      title: "IT Security Audit",
      description: "Perform a full security audit for our internal systems.",
      category: "cybersecurity",
      priority: "medium",
      status: "pending",
      budget: "3000",
      estimatedDuration: "1 week",
    },
  ];

  const insertedRequests = [];
  for (const req of requests) {
    const inserted = await db.insert(serviceRequests).values(req).returning();
    insertedRequests.push(inserted[0]);
    console.log(`✅ Created service request: ${req.title}`);
  }

  // --- 4. Seed Reviews for completed service requests ---
  const completedRequest = insertedRequests.find(r => r.status === "completed");
  if (completedRequest) {
    const review: ReviewInsert = {
      serviceRequestId: completedRequest.id,
      reviewerId: contractorId,
      revieweeId: vendorId,
      rating: 5,
      comment: "Excellent work! Delivered on time and exceeded expectations.",
    };
    await db.insert(reviews).values(review);
    console.log(`✅ Created review for service request: ${completedRequest.title}`);
  }
}

seed()
  .catch(console.error)
  .finally(() => process.exit(0));

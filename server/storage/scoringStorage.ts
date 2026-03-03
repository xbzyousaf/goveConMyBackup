import { db } from "../db";
import { userMaturityProfiles, vendorProfiles, wallets, walletTransactions } from "@shared/schema";
import { eq, sql } from "drizzle-orm";

export const scoringStorage = {
 async incrementVendorMetrics(vendorId: string, metrics: any) {
   await db
     .update(vendorProfiles)
     .set({
       totalRequests: sql`total_requests + ${metrics.totalRequests || 0}`,
       completedRequests: sql`completed_requests + ${metrics.completedRequests || 0}`,
       onTimeDeliveries: sql`on_time_deliveries + ${metrics.onTimeDeliveries || 0}`,
       autoCompletedRequests: sql`auto_completed_requests + ${metrics.autoCompletedRequests || 0}`,
     })
     .where(eq(vendorProfiles.userId, vendorId));
 },
async incrementContractorScore(userId: string, amount: number) {
  await db
    .update(userMaturityProfiles)
    .set({
      contractorScore: sql`contractor_score + ${amount}`,
    })
    .where(eq(userMaturityProfiles.userId, userId));
},
async incrementAutoCompletionPenalty(userId: string) {
  await db
    .update(userMaturityProfiles)
    .set({
      autoCompletionPenalty: sql`auto_completion_penalty + 1`,
    })
    .where(eq(userMaturityProfiles.userId, userId));
},
async incrementVendorDisputesLost(vendorId: string) {
  await db
    .update(vendorProfiles)
    .set({
      disputesLost: sql`disputes_lost + 1`,
    })
    .where(eq(vendorProfiles.userId, vendorId));
},
async updateVendorScore(vendorId: string, score: number) {
  await db
    .update(vendorProfiles)
    .set({
      vendorScore: score,
    })
    .where(eq(vendorProfiles.userId, vendorId));
}


  // end===============================
}
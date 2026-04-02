import { db } from "../db";
import { vendorImports } from "@shared/schema";
import { desc, eq } from "drizzle-orm";

export const vendorStorage = {
async createVendorImport(data: any) {
  const [record] = await db
    .insert(vendorImports)
    .values(data)
    .returning();

  return record;
},

async updateVendorImport(id: string, updates: any) {
  const [record] = await db
    .update(vendorImports)
    .set({ ...updates, updatedAt: new Date() })
    .where(eq(vendorImports.id, id))
    .returning();

  return record;
},

async getVendorImports() {
  return await db
    .select()
    .from(vendorImports)
    .orderBy(desc(vendorImports.createdAt));
},
async findByFileName(fileName: string) {
  return await db
    .select()
    .from(vendorImports)
    .where(eq(vendorImports.fileName, fileName))
    .limit(1)
    .then((res) => res[0]);
}

  // end===============================
}
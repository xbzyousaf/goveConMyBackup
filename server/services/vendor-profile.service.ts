import { eq } from "drizzle-orm";
import { db } from "../db";
import { vendorProfiles } from "@shared/schema";

export async function syncVendorProfileCategory(
  tx: any,
  vendorId: string,
  categoryId: string
) {
  if (!categoryId) return;

  const [vendorProfile] = await tx
    .select()
    .from(vendorProfiles)
    .where(eq(vendorProfiles.userId, vendorId));

  if (!vendorProfile) return;

  const existingCategoryIds = vendorProfile.categoryIds || [];

  // already exists
  if (existingCategoryIds.includes(categoryId)) {
    return;
  }

  await tx
    .update(vendorProfiles)
    .set({
      categoryIds: [
        ...existingCategoryIds,
        categoryId,
      ],
      updatedAt: new Date(),
    })
    .where(eq(vendorProfiles.userId, vendorId));
}
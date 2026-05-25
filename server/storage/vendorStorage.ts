import { db } from "../db";
import { certificates, escrows, portfolios, services, vendorImports, vendorProfiles,
  Portfolio, Certificate, serviceRequests, VendorProfile, InsertVendorProfile,
  deliveries,
  deliveryAttachments,
  users, 

 } from "@shared/schema";
import { and, count, desc, eq } from "drizzle-orm";
import { syncVendorProfileCategory } from "server/services/vendor-profile.service";
export interface IStorage {
    // Deliveries
  createDelivery(data: {
    serviceRequestId: string;
    deliveredBy: string;
    message: string;
    attachments?: {
      filePath: string;
      fileName: string;
      fileSize?: number;
    }[];
  }): Promise<any>;
  createVendorProfile(profile: InsertVendorProfile, userId: string): Promise<VendorProfile>;
  updateVendorProfile(id: string, updates: Partial<InsertVendorProfile>): Promise<VendorProfile>;
}
export const vendorStorage = {

async getVendorEarnings(userId: string, page: number = 1, limit: number = 5) {
  const offset = (page - 1) * limit;

  // ✅ total count
  const totalResult = await db
    .select({ count: count() })
    .from(escrows)
    .where(
      and(
        eq(escrows.vendorId, userId),
        eq(escrows.status, "released")
      )
    );

  const total = totalResult[0]?.count ?? 0;

  // ✅ paginated data
  const data = await db.query.escrows.findMany({
    where: and(
      eq(escrows.vendorId, userId),
      eq(escrows.status, "released")
    ),
    orderBy: [desc(escrows.heldAt)],
    limit,
    offset,
  });

  return {
    data,
    total,
    totalPages: Math.ceil(total / limit),
    currentPage: page,
  };
},

async updateVendorStripeAccount(
  userId: string,
  data: {
    stripeAccountId: string;
    stripeDetailsSubmitted: boolean;
    stripeChargesEnabled: boolean;
    stripePayoutsEnabled: boolean;
  }
) {
  await db
    .update(vendorProfiles)
    .set({
      stripeAccountId: data.stripeAccountId,
      stripeDetailsSubmitted: data.stripeDetailsSubmitted,
      stripeChargesEnabled: data.stripeChargesEnabled,
      stripePayoutsEnabled: data.stripePayoutsEnabled,
    })
    .where(eq(vendorProfiles.userId, userId));
},
async getVendorServices(vendorId: string) {
    return await db.query.services.findMany({
      where: eq(services.vendorId, vendorId),
      orderBy: (services, { desc }) => [desc(services.createdAt)],
      with: {
        categoryData: true, // ✅ load category
      },
    });
},
async createService(data: any, vendorId: string) {
    return await db.transaction(async tx => {
      // Create service (single-level pricing)
      const [service] = await tx
        .insert(services)
        .values({
          vendorId,
          name: data.name,
          description: data.description,
          categoryId: data.categoryId,
          pricingModel: data.pricingModel ?? null,
          priceMin: data.priceMin != null ? String(data.priceMin) : null,
          priceMax: data.priceMax != null ? String(data.priceMax) : null,
          isActive: true,
        })
        .returning();
        await syncVendorProfileCategory(
          tx,
          vendorId,
          data.categoryId
        );

      return service;
    });
},
async updateService(id: string, data: any, vendorId: string) {
    return await db.transaction(async tx => {
      const [service] = await tx
        .update(services)
        .set({
          name: data.name,
          description: data.description,
          categoryId: data.categoryId ?? null,
          pricingModel: data.pricingModel ?? null,
          priceMin: data.priceMin != null ? String(data.priceMin) : null,
          priceMax: data.priceMax != null ? String(data.priceMax) : null,
        })
        .where(
          and(
            eq(services.id, id),
            eq(services.vendorId, vendorId)
          )
        )
        .returning();
        await syncVendorProfileCategory(
          tx,
          vendorId,
          data.categoryId
        );

      return service;
    });
},
  async createPortfolio(data: any, vendorId: string) {
    return await db.transaction(async tx => {
      const [portfolio] = await tx
        .insert(portfolios)
        .values({
          vendorId,
          projectName: data.projectName,
          industry: data.industry,
          duration: data.duration,
          description: data.description,
          cost: data.cost != null ? String(data.cost) : null,
          startDate: new Date(data.startDate),
          endDate: new Date(data.endDate),
          attachmentUrl: data.attachmentUrl || null,
        })
        .returning();

      return portfolio;
    });
  },
  async createCertificate(data: any, vendorId: string) {
    return await db.transaction(async tx => {
      const [certificate] = await tx
        .insert(certificates)
        .values({
          vendorId,
          certificateName: data.certificateName,
          receivedFrom: data.receivedFrom,
          yearReceived: data.yearReceived,

          // imageUrl: data.imageUrl || null,
        })
        .returning();

      return certificate;
    });
  },
    async getVendorPortfolios(vendorId: string): Promise<Portfolio[]> {
      return await db
        .select()
        .from(portfolios)
        .where(eq(portfolios.vendorId, vendorId))
        .orderBy(desc(portfolios.createdAt)); // optional: latest first
    },
    async getVendorCertificates(vendorId: string): Promise<Certificate[]> {
      return await db
        .select()
        .from(certificates)
        .where(eq(certificates.vendorId, vendorId))
        .orderBy(desc(certificates.createdAt)); // optional: latest first
    },
  async getVendorPayments(vendorId: string) {
    return db
      .select({
        id: escrows.id,
        title: serviceRequests.title,
        status: serviceRequests.status,
        paymentStatus: serviceRequests.paymentStatus,
        finalPrice: serviceRequests.finalPrice,
        proposedPrice: serviceRequests.proposedPrice,
        actualCost: serviceRequests.actualCost,
        completedAt: serviceRequests.completedAt,
        heldAt: escrows.heldAt,
        escrowStatus: escrows.status,
        escrowAmount: escrows.amount,
        vendorEarning: escrows.vendorEarning,
        platformFee: escrows.platformFee,
        releasedAt: escrows.releasedAt,
      })
      .from(escrows)
      .innerJoin(
        serviceRequests,
        eq(serviceRequests.id, escrows.serviceRequestId)
      )
      .where(eq(serviceRequests.vendorId, vendorId))
      .orderBy(desc(escrows.heldAt));
  },
  async createDelivery(data: { serviceRequestId: string; deliveredBy: string; message: string; attachments?: {
      filePath: string; fileName: string; fileSize?: number; }[]; }) 
  {
    return await db.transaction(async (tx) => {
      // 1️⃣ Insert delivery
      const [delivery] = await tx
        .insert(deliveries)
        .values({
          serviceRequestId: data.serviceRequestId,
          deliveredBy: data.deliveredBy,
          message: data.message,
        })
        .returning();
  
      // 2️⃣ Insert attachments (if any)
      if (data.attachments?.length) {
        await tx.insert(deliveryAttachments).values(
          data.attachments.map((file) => ({
            deliveryId: delivery.id,
            filePath: file.filePath,
            fileName: file.fileName,
            fileSize: file.fileSize ?? null,
          }))
        );
      }
  
      // 3️⃣ Update service request status
      await tx
        .update(serviceRequests)
        .set({
          status: "delivered",
          deliveredAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(serviceRequests.id, data.serviceRequestId));
  
      return delivery;
    });
  },
  
  async createVendorProfile( profile: InsertVendorProfile, userId: string ): Promise<VendorProfile> 
  {
  const sanitizedProfile: InsertVendorProfile = { ...profile };
  
  // Parse skills if string
  if (typeof sanitizedProfile.skills === "string") {
    try {
        sanitizedProfile.skills = JSON.parse(sanitizedProfile.skills);
    } catch (e) {
      console.warn("Failed to parse skills:", sanitizedProfile.skills);
      sanitizedProfile.skills = [];
    }
  }
  if (typeof sanitizedProfile.agenciesServed === "string") {
    try {
      sanitizedProfile.agenciesServed = JSON.parse(
      sanitizedProfile.agenciesServed
      );
    } catch {
      sanitizedProfile.agenciesServed = [];
    }
  }
  
  // Parse categories if string
  if (typeof sanitizedProfile.categoryIds === "string") {
  try {
      sanitizedProfile.categoryIds = JSON.parse(sanitizedProfile.categoryIds);
    } catch {
      sanitizedProfile.categoryIds = [];
    }
  }

  
  sanitizedProfile.updatedAt = new Date();
  
  const [vendorProfile] = await db
  .insert(vendorProfiles)
  .values({
  ...sanitizedProfile,
  responseTime: '0 min', // default value
  userId: userId
  })
  .returning();
  return vendorProfile;
  },
async updateVendorProfile(
  id: string,
  updates: Partial<InsertVendorProfile> & {
    skills?: any;
    categories?: any;
    avatar?: string;
    businessType?: string;
  }
): Promise<VendorProfile> {

  const sanitizedUpdates: any = { ...updates };

  // Parse skills
  if (typeof sanitizedUpdates.skills === "string") {
    try {
      sanitizedUpdates.skills = JSON.parse(sanitizedUpdates.skills);
    } catch {
      sanitizedUpdates.skills = [];
    }
  }
  if (typeof sanitizedUpdates.agenciesServed === "string") {
    try {
      sanitizedUpdates.agenciesServed = JSON.parse(
        sanitizedUpdates.agenciesServed
      );
    } catch {
      sanitizedUpdates.agenciesServed = [];
    }
  }

  // Parse categories
  if (typeof sanitizedUpdates.categoryIds === "string") {
    try {
      sanitizedUpdates.categoryIds = JSON.parse(
        sanitizedUpdates.categoryIds
      );
    } catch {
      sanitizedUpdates.categoryIds = [];
    }
  }

  sanitizedUpdates.updatedAt = new Date();

  const [profile] = await db
    .update(vendorProfiles)
    .set(sanitizedUpdates)
    .where(eq(vendorProfiles.id, id))
    .returning();

  return profile;
}
  // end===============================
}
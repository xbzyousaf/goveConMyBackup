import { categories, InsertPlatformFee, milestones, platformFee, processes, serviceRequests, services, stages, users, vendorImports, vendorProfiles, type VendorProfile, } from "@shared/schema";
import { db } from "../db";
import { and, desc, eq, sql } from "drizzle-orm";

export const adminStorage = {

  async getAdmins() {
    const admins = await db.query.users.findMany({
      where: eq(users.userType, "admin"),
    });

    return admins; // returns array
  },
  async getOnlyVendors() {
    return await db
      .select({
        id: vendorProfiles.id,
        title: vendorProfiles.title,
        companyName: vendorProfiles.companyName,
        isApproved: vendorProfiles.isApproved,

        userId: users.id,
        userEmail: users.email,
        userName: users.username,
      })
      .from(vendorProfiles)
      .leftJoin(users, eq(vendorProfiles.userId, users.id));
  },
   async updateVendorApproval(vendorId: string, approve: boolean) {
      await db.update(vendorProfiles)
              .set({ isApproved: approve })
              .where(eq(vendorProfiles.id, vendorId));
    },
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
  async getRequestLogs(options?: { requestId?: string; page?: number; limit?: number;}) {
    const page = options?.page ?? 1;
    const limit = options?.limit ?? 11;
    const offset = (page - 1) * limit;
  
    // Count total records
    const totalQuery = await db.query.requestLogs.findMany({
      where: (logs, { eq }) =>
        options?.requestId
          ? eq(logs.serviceRequestId, options.requestId)
          : undefined,
    });
  
    const total = totalQuery.length;
  
    // Get paginated data
    const data = await db.query.requestLogs.findMany({
      where: (logs, { eq }) =>
        options?.requestId
          ? eq(logs.serviceRequestId, options.requestId)
          : undefined,
  
      orderBy: (logs, { desc }) => [desc(logs.createdAt)],
  
      limit,
      offset,
    });
  
    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  },
  async getAllServices() {
    return await db.query.services.findMany({
      with: {
        vendorProfile: {
          columns: {
            id: true,
            companyName: true,
            title: true,
            location: true,
          },
          with: {
          user: {
            columns: {
              id: true,
              username: true,
              email: true,
            },
          },
        },
        },
      },
      orderBy: desc(services.createdAt),
    });
  },
async getVendorCounts() {
    const rows = await db
      .select({
        isApproved: vendorProfiles.isApproved,
        count: sql<number>`count(*)`,
      })
      .from(vendorProfiles)
      .groupBy(vendorProfiles.isApproved);

    return {
      approved: Number(rows.find(r => r.isApproved)?.count || 0),
      pending: Number(rows.find(r => !r.isApproved)?.count || 0),
    };
},
async getMilestones() {
  const data = await db.query.processes.findMany({
    with: {
  stages: {
    with: {
      milestones: {
        with: {
          category: true, // if relation exists
        }
      },
    },
  },
},
  });

  const result: any[] = [];

  for (const process of data) {
    for (const stage of process.stages) {
      for (const milestone of stage.milestones) {
        result.push({
          ...milestone,
          process: process.key,
          stage: stage.key,
          categoryName: milestone.category?.name
        });
      }
    }
  }

  return result;
},
async createProcessMilestone(data: {key: string; process: string; stage: string; title: string; description?: string; required?: boolean; resources?: any[]; categoryId: string;}) 
{
    const {
      key,
      process: processKey,
      stage: stageKey,
      title,
      description,
      required,
      categoryId,
      resources
    } = data;

    // 1️⃣ Find process
    const processRecord = await db
      .select()
      .from(processes)
      .where(eq(processes.key, processKey));

    if (!processRecord.length) {
      throw new Error("Process not found");
    }

    const processId = processRecord[0].id;

    // 2️⃣ Find stage
    const stageRecord = await db.select().from(stages).where(
        and( eq(stages.key, stageKey), eq(stages.processId, processId)));

    if (!stageRecord.length) {
      throw new Error("Stage not found");
    }
    if (!categoryId) {
      throw new Error("Category is required");
    }

    const stageId = stageRecord[0].id;

    // 3️⃣ Create milestone
    const [milestone] = await db
      .insert(milestones)
      .values({
        stageId,
        key,
        title,
        description: description ?? null,
        required: required ?? false,
        resources: JSON.stringify(resources || []),
        categoryId,
      })
      .returning();

    return milestone;
},
async updateMilestone(id: string, data: any) {
  const {
    key,
    process,
    stage,
    title,
    description,
    required,
    resources,
    categoryId
  } = data;

  // 1. Find process
  const processRecord = await db
    .select()
    .from(processes)
    .where(eq(processes.key, process));

  if (!processRecord.length) throw new Error("Process not found");

  const processId = processRecord[0].id;

  // 2. Find stage
  const stageRecord = await db
    .select()
    .from(stages)
    .where(and(eq(stages.key, stage), eq(stages.processId, processId)));

  if (!stageRecord.length) throw new Error("Stage not found");

  const stageId = stageRecord[0].id;

  // 3. Update milestone
  const [updated] = await db
    .update(milestones)
    .set({
      key,
      title,
      description,
      required,
      categoryId, // ✅ important
      stageId,
      resources: JSON.stringify(resources || []),
    })
    .where(eq(milestones.id, id))
    .returning();

  return updated;
},
async getMilestoneById(id: string) {
  const data = await db.query.milestones.findFirst({
    where: eq(milestones.id, id),
    with: {
      stage: {
        with: {
          process: true
        }
      }
    }
  });

  if (!data) throw new Error("Milestone not found");

  return {
    ...data,
    process: data.stage.process.key,
    stage: data.stage.key,
    resources:
  typeof data.resources === "string"
    ? JSON.parse(data.resources)
    : data.resources || [],
  };
},
async getAllServiceRequestsWithDisputes(
  limit: number,
  offset: number
) {
  return await db.query.serviceRequests.findMany({
    where: eq(serviceRequests.status, "disputed"),

    with: {
      vendor: {
        columns: {
          id: true,
          firstName: true,
          lastName: true,
        },
      },
      contractor: {
        columns: {
          firstName: true,
          lastName: true,
        },
      },
      service: {
        columns: {
          name: true,
        },
      },
      disputes: true,
      reviews: true,
    },

    orderBy: (serviceRequests, { desc }) => [
      desc(serviceRequests.createdAt),
    ],

    limit,
    offset,
  });
},
async countAllServiceRequestsWithDisputes() {
  const result = await db
    .select({ count: sql<number>`count(*)` })
    .from(serviceRequests)
    .where(eq(serviceRequests.status, "disputed"));
  return result[0]?.count ?? 0;
},
async deleteVendor(vendorId: string): Promise<boolean> {
  const result = await db
    .delete(users)
    .where(eq(users.id, vendorId))
    .returning({ id: users.id });
  return result.length > 0;
},
async deleteService(serviceId: string): Promise<boolean> {
  const result = await db
    .delete(services)
    .where(eq(services.id, serviceId))
    .returning({ id: services.id });
  return result.length > 0;
},
async deleteVendorImport(importId: string): Promise<boolean> {
  const result = await db
    .delete(vendorImports)
    .where(eq(vendorImports.id, importId))
    .returning({ id: vendorImports.id });
  return result.length > 0;
},
// Get all categories
async getCategories() {
  return await db.select().from(categories).orderBy(desc(categories.createdAt));
},

//  Create category
async createCategory(data: { name: string, key: string, description: string, keyDeliverables: string[] }) {
  const [category] = await db
    .insert(categories)
    .values({
      name: data.name,
      key: data.key,
      description: data.description,
      keyDeliverables: data.keyDeliverables,
    })
    .returning();

  return category;
},

//  Update category
async updateCategory(id: string, data: { name: string, key: string, description: string, keyDeliverables: string[] }) {
  const [category] = await db
    .update(categories)
    .set({
      name: data.name,
      key: data.key,
      description: data.description,
      keyDeliverables: data.keyDeliverables,
    })
    .where(eq(categories.id, id))
    .returning();

  return category;
},
async getCategory(id: string) {
  const result = await db
    .select()
    .from(categories)
    .where(eq(categories.id, id))
    .limit(1);

  return result[0] || null;
},

//  Delete category
async deleteCategory(id: string): Promise<boolean> {
  const result = await db
    .delete(categories)
    .where(eq(categories.id, id))
    .returning({ id: categories.id });

  return result.length > 0;
},
// ================= PLATFORM FEE =================
// Get all platform fees
async getPlatformFees() {
  return await db
    .select()
    .from(platformFee)
    .orderBy(desc(platformFee.createdAt));
},

// Get single platform fee
async getPlatformFee(id: string) {
  const result = await db
    .select()
    .from(platformFee)
    .where(eq(platformFee.id, id))
    .limit(1);

  return result[0] || null;
},

// Update platform fee
async updatePlatformFee(
  id: string,
  data: InsertPlatformFee
) {

  // deactivate other active fees
  if (data.isActive) {
    await db
      .update(platformFee)
      .set({
        isActive: false,
      })
      .where(eq(platformFee.isActive, true));
  }

  const [fee] = await db
    .update(platformFee)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(eq(platformFee.id, id))
    .returning();

  return fee;
},
async getActivePlatformFee() {
  return await db.query.platformFee.findFirst({
    where: eq(platformFee.isActive, true),
  });
},
async deleteMilestone(id: string) {
  const [deleted] = await db
    .delete(milestones)
    .where(eq(milestones.id, id))
    .returning();

  return deleted;
}
// end===============================
};
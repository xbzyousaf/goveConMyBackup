import { BusinessType, businessTypeEnum, categories, conversations, supportMessages, supportTickets } from './../shared/schema';
// From javascript_database integration
import { 
  users, 
  vendorProfiles, 
  serviceRequests, 
  messages,
  reviews,
  transactions,
  userMaturityProfiles,
  assessments,
  contentLibrary,
  userJourneys,
  type User, 
  type InsertUser,
  type UpsertUser,
  type VendorProfile,
  type InsertVendorProfile,
  type ServiceRequest,
  type InsertServiceRequest,
  type Message,
  type InsertMessage,
  type Review,
  type InsertReview,
  type Transaction,
  type InsertTransaction,
  type UserMaturityProfile,
  type InsertUserMaturityProfile,
  type Assessment,
  type InsertAssessment,
  type ContentLibrary,
  type UserJourney,
  type InsertUserJourney,
  services,
  InsertNotification,
  requestLogs,
  portfolios,
  Portfolio,
  certificates,
  Certificate,
  escrows,
  disputes,
  milestones,
  subscriptions,
  InsertSubscription,
} from "@shared/schema";
import { db } from "./db";
import { sql, eq, ne, and, desc, asc, inArray, or, ilike, count } from "drizzle-orm";
import { notifications } from "@shared/schema";
import { PRIORITY_STATUSES } from "constants/serviceRequest";
import { Gap, GapType } from '@shared/types/gaps';
import { ServiceCategory } from '@shared/types/service';
import { GAP_CATEGORY_MAP } from './../constants/gapCategoryMap';
import bcrypt from 'bcryptjs';
export interface IStorage {
  // User management
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  upsertUser(user: UpsertUser): Promise<User>; // For Replit Auth
  updateUser(id: string, updates: Partial<InsertUser>): Promise<User>;

  // Vendor management
  getVendorProfile(userId: string): Promise<VendorProfile | undefined>;
  getVendorProfileById(id: string): Promise<VendorProfile | undefined>;
  getVendors(filters?: { category?: string; location?: string; verified?: boolean }): Promise<VendorProfile[]>;
  
  // Service request management
  getServiceRequest(id: string): Promise<ServiceRequest | undefined>;
  createServiceRequest(request: InsertServiceRequest): Promise<ServiceRequest>;
  updateServiceRequest(id: string, updates: Partial<ServiceRequest>): Promise<ServiceRequest>;
  getServiceRequestsByContractor(contractorId: string, limit: number, offset: number): Promise<ServiceRequest[]>;
  getServiceRequestsByVendor(vendorId: string, limit: number, offset: number): Promise<ServiceRequest[]>;
  getPendingServiceRequests(): Promise<ServiceRequest[]>;

  // Messaging
  createMessage(message: InsertMessage): Promise<Message>;
  getMessagesByServiceRequest(serviceRequestId: string): Promise<Message[]>;
  markMessageAsRead(messageId: string): Promise<void>;

  // Reviews
  createReview(review: InsertReview): Promise<Review>;
  getReviewsByVendor(vendorId: string): Promise<Review[]>;
  getReviewsByServiceRequest(serviceRequestId: string): Promise<Review[]>;

  // Transactions
  createTransaction(transaction: InsertTransaction): Promise<Transaction>;
  getTransactionsByServiceRequest(serviceRequestId: string): Promise<Transaction[]>;
  updateTransactionStatus(id: string, status: string): Promise<Transaction>;

  // User maturity profiles & assessments
  getUserMaturityProfile(userId: string): Promise<UserMaturityProfile | undefined>;
  upsertUserMaturityProfile(profile: Partial<InsertUserMaturityProfile> & { userId: string }): Promise<UserMaturityProfile>;
  createAssessment(assessment: InsertAssessment): Promise<Assessment>;
  getAssessmentsByUser(userId: string): Promise<Assessment[]>;

  // Content library
  getContentLibrary(filters?: { process?: string; stage?: string; type?: string }): Promise<ContentLibrary[]>;
  getContentById(id: string): Promise<ContentLibrary | undefined>;

  // User journeys
  getUserJourneys(userId: string, process?: string): Promise<UserJourney[]>;
  createUserJourney(journey: InsertUserJourney): Promise<UserJourney>;
  updateUserJourney(id: string, updates: Partial<UserJourney>): Promise<UserJourney>;
  
  // Reset assessment data
  deleteUserMaturityProfile(userId: string): Promise<void>;
  deleteUserAssessments(userId: string): Promise<void>;
  deleteUserJourneys(userId: string): Promise<void>;
  getConversationBetweenUsers( contractorId: string, vendorId: string): Promise<any>;
  createConversation(data: { contractorId: string; vendorId: string; serviceRequestId?: string | null;}): Promise<any>;

}

// Database storage implementation
export class DatabaseStorage implements IStorage {
  // User management
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async getUserByVerificationToken(token: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.emailVerificationToken, token));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }
  async getUserByPasswordResetToken(token: string) {
    return await db.query.users.findFirst({
      where: eq(users.passwordResetToken, token),
    });
  }

  async updateUser(id: string, updates: Partial<InsertUser>): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  // Vendor management
  async getVendorProfile(userId: string): Promise<any> {
    const profile = await db.query.vendorProfiles.findFirst({
      where: eq(vendorProfiles.userId, userId),
      with: {
        user: true,
      },
    });

    if (!profile) {
      return undefined;
    }

    return {
      ...profile,
      businessType: profile.user?.businessType,
    };
  }

  async getContractorById(id: string) {
    const result = await db
      .select({
        id: users.id,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
        username: users.username,
        profileImageUrl: users.profileImageUrl,
        userType: users.userType,
        hasCompletedOnboarding: users.hasCompletedOnboarding,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
      })
      .from(users)
      .where(eq(users.id, id))
      .limit(1);

    if (!result.length) return undefined;

    return result[0];
  }
async getVendorProfileById(
  id: string
): Promise<(VendorProfile & { rating: number; reviewCount: number }) | undefined> {

  const result = await db
    .select({
      id: vendorProfiles.id,

      // user fields
      username: sql<string>`MAX(${users.username})`,
      firstName: sql<string>`MAX(${users.firstName})`,
      lastName: sql<string>`MAX(${users.lastName})`,
      email: sql<string>`MAX(${users.email})`,
      businessType: sql<string>`MAX(${users.businessType})`,
      profileImageUrl: sql<string>`MAX(${users.profileImageUrl})`,
      isEmailVerified: sql<boolean>`BOOL_OR(${users.isEmailVerified})`,

      // vendor fields
      userId: vendorProfiles.userId,
      title: vendorProfiles.title,
      companyName: vendorProfiles.companyName,
      description: vendorProfiles.description,
      categoryIds: vendorProfiles.categoryIds,
      avatar: vendorProfiles.avatar,
      skills: vendorProfiles.skills,
      location: vendorProfiles.location,
      hourlyRate: vendorProfiles.hourlyRate,
      responseTime: vendorProfiles.responseTime,
      availability: vendorProfiles.availability,
      certifications: vendorProfiles.certifications,
      isApproved: vendorProfiles.isApproved,
      isFeatured: vendorProfiles.isFeatured,
      yearsOfExperience: vendorProfiles.yearsOfExperience,
      agenciesServed: vendorProfiles.agenciesServed,
      createdAt: vendorProfiles.createdAt,
      updatedAt: vendorProfiles.updatedAt,

      // computed
      rating: sql<number>`COALESCE(AVG(${reviews.rating}), 0)`.as("rating"),
      reviewCount: sql<number>`COUNT(${reviews.id})`.as("reviewCount"),
    })
    .from(vendorProfiles)
    .leftJoin(
      reviews,
      eq(reviews.revieweeId, vendorProfiles.userId)
    )
    .leftJoin(users, eq(users.id, vendorProfiles.userId))
    .where(eq(vendorProfiles.userId, id))
    .groupBy(vendorProfiles.id)
    .limit(1);

  if (!result.length) return undefined;

  const vendor = result[0];

  // fetch category names
  const categoryData = vendor.categoryIds?.length
    ? await db
        .select({
          id: categories.id,
          name: categories.name,
        })
        .from(categories)
        .where(inArray(categories.id, vendor.categoryIds))
    : [];

  return {
    ...vendor,

    categories: categoryData,

    username: vendor.username,
    firstName: vendor.firstName,
    lastName: vendor.lastName,
    email: vendor.email,
    businessType: vendor.businessType,
    profileImageUrl: vendor.profileImageUrl,
    isEmailVerified: vendor.isEmailVerified,

    rating: Number(vendor.rating),
    reviewCount: Number(vendor.reviewCount),
    
  };
}

  async getVendors(
    filters?: { categories ?: string[]; location?: string; verified?: boolean; businessType?: BusinessType;  search?: string; }
  ): Promise<(VendorProfile & { reviewCount: number })[]> {

    const whereConditions = [];
    if (filters?.search) {
      const search = `%${filters.search.trim()}%`;

      whereConditions.push(
        or(
          // USERS
          sql`${users.username} ILIKE ${search}`,
          sql`${users.firstName} ILIKE ${search}`,
          sql`${users.lastName} ILIKE ${search}`,
          sql`${users.email} ILIKE ${search}`,

          // VENDOR PROFILE
          sql`${vendorProfiles.companyName} ILIKE ${search}`,
          sql`${vendorProfiles.title} ILIKE ${search}`,
          sql`${vendorProfiles.description} ILIKE ${search}`,
          sql`${vendorProfiles.location} ILIKE ${search}`,

          // SKILLS SEARCH
          sql`EXISTS (
            SELECT 1
            FROM unnest(${vendorProfiles.skills}) AS s
            WHERE s ILIKE ${search}
          )`,
        )
      );
    }
    if (filters?.verified !== undefined) {
      whereConditions.push(eq(vendorProfiles.isApproved, filters.verified));
    }
    if (filters?.location) {
      whereConditions.push(eq(vendorProfiles.location, filters.location));
    }
    whereConditions.push(eq(vendorProfiles.isApproved, true));
    // ✅ NEW: multi-category match (IMPORTANT)
    if (filters?.categories && filters.categories.length > 0) {
      const categoryConditions = filters.categories.map(
      (category) =>
        sql`EXISTS (
          SELECT 1
          FROM unnest(${vendorProfiles.categoryIds}) AS c
          WHERE c::text = ${category}
        )`
    );

    whereConditions.push(or(...categoryConditions));
  }
    if (filters?.businessType && filters.businessType !== "both") {
      whereConditions.push(
        or(
          eq(users.businessType, filters.businessType),
          eq(users.businessType, "both")
        )
      );
    }

    // Create a subquery for review stats
    const reviewStats = db
      .select({
        revieweeId: reviews.revieweeId,
        reviewCount: sql<number>`COUNT(${reviews.id})`.as('review_count'),
        avgRating: sql<number>`COALESCE(AVG(${reviews.rating}), 0)`.as('avg_rating')
      })
      .from(reviews)
      .groupBy(reviews.revieweeId)
      .as('review_stats');

    const baseQuery = db
      .select({
        vendor: vendorProfiles,
        username: sql<string>`MAX(${users.username})`,
        businessType: sql<string>`MAX(${users.businessType})`,
        firstName: sql<string>`MAX(${users.firstName})`,
        lastName: sql<string>`MAX(${users.lastName})`,
        reviewCount: sql<number>`COALESCE(MAX(review_stats.review_count), 0)`,
        rating: sql<number>`COALESCE(MAX(review_stats.avg_rating), 0)`
      })
      .from(vendorProfiles)
      .leftJoin(users, eq(users.id, vendorProfiles.userId))
      // .innerJoin(
      //   services,
      //   eq(services.vendorId, vendorProfiles.userId)
      // )
      .leftJoin(
        reviewStats,
        eq(reviewStats.revieweeId, vendorProfiles.userId)
      )
      .groupBy(vendorProfiles.id)
      .orderBy(desc(vendorProfiles.rating));

    const rows =
      whereConditions.length > 0
        ? await baseQuery.where(
            whereConditions.length === 1
              ? whereConditions[0]
              : and(...whereConditions as [any, ...any[]])
          )
        : await baseQuery;

    return rows.map(row => ({
      ...row.vendor,
       // ✅ merge user fields
      username: row.username,
      businessType: row.businessType,
      firstName: row.firstName,
      lastName: row.lastName,
      rating: Number(row.rating) || 0,
      reviewCount: Number(row.reviewCount) || 0,
    }));
  }

  // Service request management
  async getServiceRequest(id: string) {
  return await db.query.serviceRequests.findFirst({
    where: eq(serviceRequests.id, id),
    with: {
      vendorProfile: {
        columns: {
          id: true,
          avatar: true,
        },
      },
      vendor: {
        columns: {
          id: true,
          firstName: true,
          lastName: true,
          username: true,
        },
      },
      contractor: {
        columns: {
          id: true,
          firstName: true,
          lastName: true,
          username: true,
        },
      },
      service: {
        with: {
          categoryData: true,
        },
      },
      escrow: true,
      disputes: true,
      messages: true,     // optional
      deliveries: {
        with: {
          attachments: true,
        },
      },
      reviews: {   // 🔥 ADD THIS
        columns: {
          id: true,
          reviewerId: true,
          revieweeId: true,
          rating: true,
          comment: true,
          createdAt: true,
        },
      },
    },
  });
}


  async createServiceRequest(request: InsertServiceRequest): Promise<ServiceRequest> {
    const [serviceRequest] = await db
      .insert(serviceRequests)
      .values(request)
      .returning();
      if (!serviceRequest) {
        throw new Error("Insert failed");
      }
    return serviceRequest;
  }

  async updateServiceRequest(id: string, updates: Partial<ServiceRequest>): Promise<ServiceRequest> {
  const allowedUpdates: Partial<ServiceRequest> = {};
  
  if (updates.vendorId !== undefined)
    allowedUpdates.vendorId = updates.vendorId;
    if (updates.platformFeeId !== undefined)
    allowedUpdates.platformFeeId = updates.platformFeeId;

  if (updates.platformFeeType !== undefined)
    allowedUpdates.platformFeeType = updates.platformFeeType;

  if (updates.platformFeeValue !== undefined)
    allowedUpdates.platformFeeValue = updates.platformFeeValue;

  if (updates.platformFeeAmount !== undefined)
    allowedUpdates.platformFeeAmount = updates.platformFeeAmount;

  if (updates.status !== undefined)
    allowedUpdates.status = updates.status;

  if (updates.aiAnalysis !== undefined)
    allowedUpdates.aiAnalysis = updates.aiAnalysis;

  if (updates.estimatedCost !== undefined)
    allowedUpdates.estimatedCost = updates.estimatedCost;

  if (updates.actualCost !== undefined)
    allowedUpdates.actualCost = updates.actualCost;

  if (updates.estimatedDuration !== undefined)
    allowedUpdates.estimatedDuration = updates.estimatedDuration;

  // 🔥 ADD THESE PAYMENT FIELDS HERE
  if (updates.paymentStatus !== undefined)
    allowedUpdates.paymentStatus = updates.paymentStatus;

  if (updates.paidAt !== undefined)
    allowedUpdates.paidAt = updates.paidAt;

  if (updates.finalPrice !== undefined)
    allowedUpdates.finalPrice = updates.finalPrice;

  if (updates.proposedPrice !== undefined)
    allowedUpdates.proposedPrice = updates.proposedPrice;

  if (updates.platformFee !== undefined)
    allowedUpdates.platformFee = updates.platformFee;

  if (updates.vendorEarning !== undefined)
    allowedUpdates.vendorEarning = updates.vendorEarning;

  const [request] = await db
    .update(serviceRequests)
    .set({ ...allowedUpdates, updatedAt: new Date() })
    .where(eq(serviceRequests.id, id))
    .returning();

  return request;
}

  async getServiceRequestsByContractor(
  contractorId: string,
  limit: number,
  offset: number,
  status?: string,
  search?: string
) {

  let whereCondition = eq(serviceRequests.contractorId, contractorId);

  if (status && status !== "all") {

    if (status === "priority") {
      whereCondition = and(
        eq(serviceRequests.contractorId, contractorId),
        inArray(serviceRequests.status, PRIORITY_STATUSES)
      );
    } else {
      whereCondition = and(
        eq(serviceRequests.contractorId, contractorId),
        eq(serviceRequests.status, status)
      );
    }
  }
  if (search) {
      whereCondition = and(
        whereCondition,
        or(
          ilike(serviceRequests.title, `%${search}%`),
          ilike(serviceRequests.description, `%${search}%`)
        )
      );
    }

  return await db.query.serviceRequests.findMany({
    where: whereCondition,

    with: {
      service: {
        columns: {
          id: true,
          name: true,
        },
      },

      vendor: {
        columns: {
          id: true,
          firstName: true,
          lastName: true,
          username:true
        },
      },

      reviews: true,
    },

    orderBy: (serviceRequests, { desc }) => [
      desc(serviceRequests.createdAt),
    ],

    limit,
    offset,
  });
}

async countServiceRequestsByContractor(
  contractorId: string,
  status?: string,
  search?: string
) {

  let whereCondition = eq(serviceRequests.contractorId, contractorId);

  if (status && status !== "all") {

    if (status === "priority") {
      whereCondition = and(
        eq(serviceRequests.contractorId, contractorId),
        inArray(serviceRequests.status, PRIORITY_STATUSES)
      );
    } else {
      whereCondition = and(
        eq(serviceRequests.contractorId, contractorId),
        eq(serviceRequests.status, status)
      );
    }

  }
  if (search) {
      whereCondition = and(
        whereCondition,
        or(
          ilike(serviceRequests.title, `%${search}%`),
          ilike(serviceRequests.description, `%${search}%`)
        )
      );
    }

  const result = await db
    .select({ count: sql<number>`count(*)` })
    .from(serviceRequests)
    .where(whereCondition);

  return result[0]?.count ?? 0;
}
  async getServiceRequestsByVendor(
  vendorId: string,
  limit: number,
  offset: number,
  status?: string,
  search?: string
) {
  let whereCondition = eq(serviceRequests.vendorId, vendorId);

  if (status && status !== "all") {

    if (status === "priority") {
      whereCondition = and(
        eq(serviceRequests.vendorId, vendorId),
        inArray(serviceRequests.status, PRIORITY_STATUSES)
      );
    } else {
      whereCondition = and(
        eq(serviceRequests.vendorId, vendorId),
        eq(serviceRequests.status, status)
      );
    }

  }
    
    if (search) {
      whereCondition = and(
        whereCondition,
        or(
          ilike(serviceRequests.title, `%${search}%`),
          ilike(serviceRequests.description, `%${search}%`)
        )
      );
    }
  return await db.query.serviceRequests.findMany({
    where: whereCondition,

    with: {
      contractor: {
        columns: {
          firstName: true,
          lastName: true,
          username:true
        },
      },
      service: {
        columns: {
          name: true,
        },
      },
      reviews: true,
    },

    orderBy: (serviceRequests, { desc }) => [
      desc(serviceRequests.createdAt),
    ],

    limit,
    offset,
  });
}
async countServiceRequestsByVendor(vendorId: string, status?: string, search?: string) {
 let whereCondition = eq(serviceRequests.vendorId, vendorId);

  if (status && status !== "all") {

    if (status === "priority") {
      whereCondition = and(
        eq(serviceRequests.vendorId, vendorId),
        inArray(serviceRequests.status, PRIORITY_STATUSES)
      );
    } else {
      whereCondition = and(
        eq(serviceRequests.vendorId, vendorId),
        eq(serviceRequests.status, status)
      );
    }

  }
   if (search) {
      whereCondition = and(
        whereCondition,
        or(
          ilike(serviceRequests.title, `%${search}%`),
          ilike(serviceRequests.description, `%${search}%`)
        )
      );
    }

  const result = await db
    .select({ count: sql<number>`count(*)` })
    .from(serviceRequests)
    .where(whereCondition);

  return result[0]?.count ?? 0;
}

  async getPendingServiceRequests(): Promise<ServiceRequest[]> {
    const requests = await db
      .select()
      .from(serviceRequests)
      .where(eq(serviceRequests.status, "pending"))
      .orderBy(desc(serviceRequests.createdAt));
    return requests;
  }

  // Messaging
  async createMessage(message: InsertMessage): Promise<Message> {
    const [newMessage] = await db
      .insert(messages)
      .values(message)
      .returning();

    // ===== RESPONSE TIME LOGIC =====
    const serviceRequest = await db.query.serviceRequests.findFirst({
      where: eq(serviceRequests.id, message.serviceRequestId),
      with: {
        messages: true,
      },
    });

    if (!serviceRequest) return newMessage;

    // Only calculate if sender is vendor
    if (serviceRequest.vendorId !== message.senderId) {
      return newMessage;
    }

    const contractorMessages = serviceRequest.messages
      ?.filter(m => m.senderId === serviceRequest.contractorId)
      .sort((a, b) =>
        (a.createdAt ? a.createdAt.getTime() : 0) -
        (b.createdAt ? b.createdAt.getTime() : 0)
      );

    const vendorMessages = serviceRequest.messages
      ?.filter(m => m.senderId === serviceRequest.vendorId)
      .sort((a, b) =>
        (a.createdAt ? a.createdAt.getTime() : 0) -
        (b.createdAt ? b.createdAt.getTime() : 0)
      );

    if (
      contractorMessages?.length > 0 &&
      vendorMessages?.length === 1
    ) {
      const firstContractorMessage = contractorMessages[0];
      const firstVendorReply = vendorMessages[0];

      if (
        firstVendorReply.createdAt &&
        firstContractorMessage.createdAt
      ) {
        const diffMinutes = Math.floor(
          (firstVendorReply.createdAt.getTime() -
            firstContractorMessage.createdAt.getTime()) / 60000
        );

        await this.updateVendorResponseTime(
          serviceRequest.vendorId!,
          diffMinutes
        );
      }
    }

    // ===== END LOGIC =====

    return newMessage;
  }


  async getMessagesByServiceRequest(serviceRequestId: string) {
    return await db.query.messages.findMany({
      where: eq(messages.serviceRequestId, serviceRequestId),
      with: {
        sender: {
          columns: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        receiver: {
          columns: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: (messages, { asc }) => [asc(messages.createdAt)],
    });
  }

  async markMessageAsRead(messageId: string): Promise<void> {
    await db
      .update(messages)
      .set({ isRead: true })
      .where(eq(messages.id, messageId));
  }

  // Reviews
  async createReview(review: InsertReview): Promise<Review> {
    // const existing = await db.query.reviews.findFirst({
    //   where: and(
    //     eq(reviews.serviceRequestId, review.serviceRequestId),
    //     eq(reviews.reviewerId, review.reviewerId)
    //   ),
    // });

    // if (existing) {
    //   throw new Error("Review already submitted for this request.");
    // }
    const [newReview] = await db
      .insert(reviews)
      .values(review)
      .returning();

    // Update vendor rating and review count
    const allReviews = await this.getReviewsByVendor(review.revieweeId);
    const avgRating = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;
    
    await db
      .update(vendorProfiles)
      .set({ 
        rating: avgRating.toString(),
        reviewCount: allReviews.length,
        updatedAt: new Date()
      })
      .where(eq(vendorProfiles.userId, review.revieweeId));

    return newReview;
  }

  async getReviewsByVendor(vendorId: string) {
    const reviewList = await db
      .select({
        id: reviews.id,
        serviceRequestId: reviews.serviceRequestId,
        reviewerId: reviews.reviewerId,
        revieweeId: reviews.revieweeId,
        rating: reviews.rating,
        comment: reviews.comment,
        createdAt: reviews.createdAt,
        contractorName: sql<string>`
        ${users.firstName} || ' ' || ${users.lastName}
      `.as("contractorName"),
        contractorUserType: users.userType, 
        contractorEmail: users.email,    
      })
      .from(reviews)
      .leftJoin(users, eq(users.id, reviews.reviewerId))
      .where(eq(reviews.revieweeId, vendorId))
      .orderBy(desc(reviews.createdAt));
    return reviewList;
  }

  async getReviewsByContractor(contractorId: string) {
    const reviewList = await db
      .select({
        id: reviews.id,
        serviceRequestId: reviews.serviceRequestId,
        reviewerId: reviews.reviewerId,
        revieweeId: reviews.revieweeId,
        rating: reviews.rating,
        comment: reviews.comment,
        createdAt: reviews.createdAt,

        // reviewer info (vendor who gave review)
        vendorName: sql<string>`concat(${users.firstName}, ' ', ${users.lastName})`,
        vendorUserType: users.userType,
        vendorEmail: users.email,
      })
      .from(reviews)
      .leftJoin(users, eq(users.id, reviews.reviewerId))
      .where(eq(reviews.revieweeId, contractorId))
      .orderBy(desc(reviews.createdAt));

    return reviewList;
  }

  async getReviewsByServiceRequest(serviceRequestId: string): Promise<Review[]> {
    const reviewList = await db
      .select()
      .from(reviews)
      .where(eq(reviews.serviceRequestId, serviceRequestId))
      .orderBy(desc(reviews.createdAt));
    return reviewList;
  }

  // Transactions
  async createTransaction(transaction: InsertTransaction): Promise<Transaction> {
    const [newTransaction] = await db
      .insert(transactions)
      .values({
        ...transaction,
        updatedAt: new Date()
      })
      .returning();
    return newTransaction;
  }

  async getTransactionsByServiceRequest(serviceRequestId: string): Promise<Transaction[]> {
    const transactionList = await db
      .select()
      .from(transactions)
      .where(eq(transactions.serviceRequestId, serviceRequestId))
      .orderBy(desc(transactions.createdAt));
    return transactionList;
  }

  async updateTransactionStatus(id: string, status: string): Promise<Transaction> {
    const [transaction] = await db
      .update(transactions)
      .set({ status, updatedAt: new Date() })
      .where(eq(transactions.id, id))
      .returning();
    return transaction;
  }

  // User maturity profiles & assessments
  async getUserMaturityProfile(userId: string): Promise<UserMaturityProfile | undefined> {
    const [profile] = await db
      .select()
      .from(userMaturityProfiles)
      .where(eq(userMaturityProfiles.userId, userId));
    return profile || undefined;
  }

  async upsertUserMaturityProfile(profile: Partial<InsertUserMaturityProfile> & { userId: string }): Promise<UserMaturityProfile> {
    const existing = await this.getUserMaturityProfile(profile.userId);
    
    if (existing) {
      // Build updates object with only defined fields to avoid overwriting with null/undefined
      const updates: any = { updatedAt: new Date() };
      if (profile.maturityStage !== undefined) updates.maturityStage = profile.maturityStage;
      if (profile.readinessScore !== undefined) updates.readinessScore = profile.readinessScore;
      if (profile.assessmentData !== undefined) updates.assessmentData = profile.assessmentData;
      if (profile.currentFocus !== undefined) updates.currentFocus = profile.currentFocus;
      if (profile.businessStructureProgress !== undefined) updates.businessStructureProgress = profile.businessStructureProgress;
      if (profile.businessStrategyProgress !== undefined) updates.businessStrategyProgress = profile.businessStrategyProgress;
      if (profile.executionProgress !== undefined) updates.executionProgress = profile.executionProgress;
      if (profile.subscriptionTier !== undefined) updates.subscriptionTier = profile.subscriptionTier;
      if (profile.stripeCustomerId !== undefined) updates.stripeCustomerId = profile.stripeCustomerId;
      if (profile.stripeSubscriptionId !== undefined) updates.stripeSubscriptionId = profile.stripeSubscriptionId;
      
      const [updated] = await db
        .update(userMaturityProfiles)
        .set(updates)
        .where(eq(userMaturityProfiles.userId, profile.userId))
        .returning();
      return updated;
    } else {
      const [created] = await db
        .insert(userMaturityProfiles)
        .values(profile as InsertUserMaturityProfile)
        .returning();
      return created;
    }
  }

  async createAssessment(assessment: InsertAssessment): Promise<Assessment> {
    const [newAssessment] = await db
      .insert(assessments)
      .values(assessment)
      .returning();
    return newAssessment;
  }

  async getAssessmentsByUser(userId: string): Promise<Assessment[]> {
    const assessmentList = await db
      .select()
      .from(assessments)
      .where(eq(assessments.userId, userId))
      .orderBy(desc(assessments.createdAt));
    return assessmentList;
  }

  // Content library
  async getContentLibrary(filters?: { process?: string; stage?: string; type?: string }): Promise<ContentLibrary[]> {
    let query = db.select().from(contentLibrary);
    
    // Note: For now returning all content. Advanced filtering with arrays can be added later
    const content = await query.orderBy(desc(contentLibrary.createdAt));
    return content;
  }

  async getContentById(id: string): Promise<ContentLibrary | undefined> {
    const [content] = await db
      .select()
      .from(contentLibrary)
      .where(eq(contentLibrary.id, id));
    return content || undefined;
  }

  // User journeys
  async getUserJourneys(userId: string, process?: string): Promise<UserJourney[]> {
    const conditions = [eq(userJourneys.userId, userId)];
    
    if (process) {
      conditions.push(eq(userJourneys.coreProcess, process as any));
    }
    
    const journeys = await db
      .select()
      .from(userJourneys)
      .where(and(...conditions))
      .orderBy(asc(userJourneys.createdAt));
    
    return journeys;
  }

  async createUserJourney(journey: InsertUserJourney): Promise<UserJourney> {
    const [newJourney] = await db
      .insert(userJourneys)
      .values(journey)
      .returning();
    return newJourney;
  }

  async updateUserJourney(id: string, updates: Partial<UserJourney>): Promise<UserJourney> {
    const [journey] = await db
      .update(userJourneys)
      .set(updates)
      .where(eq(userJourneys.id, id))
      .returning();
    return journey;
  }

  // Reset assessment data
  async deleteUserMaturityProfile(userId: string): Promise<void> {
    await db.delete(userMaturityProfiles).where(eq(userMaturityProfiles.userId, userId));
  }

  async deleteUserAssessments(userId: string): Promise<void> {
    await db.delete(assessments).where(eq(assessments.userId, userId));
  }

  async deleteUserJourneys(userId: string): Promise<void> {
    await db.delete(userJourneys).where(eq(userJourneys.userId, userId));
  }

  async updateServiceStatus(serviceId: string, isActive: boolean) {
    const [service] = await db
      .update(services)
      .set({
        isActive,
        updatedAt: new Date(),
      })
      .where(eq(services.id, serviceId))
      .returning();

    return service;
  }
 
  async createMilestone(data: any, userId: string) {
    return await db.transaction(async (tx) => {
      const [milestone] = await tx
        .insert(milestones)
        .values({
          process: data.process,
          stage: data.stage,
          title: data.title,
          key: data.key,
          description: data.description ?? null,
          required: data.required ?? false,
          createdBy: userId,
          createdAt: new Date(), // optional if DB auto-generates
        })
        .returning();

      return milestone;
    });
  }
  async getServiceById(serviceId: string) {
    // Fetch the service
    const service = await db.query.services.findFirst({
      where: eq(services.id, serviceId),
      with: {
        vendorProfile: {
        columns: {
          companyName: true,
          title: true,
          avatar: true,
        },
      },
        categoryData: true, // ✅ load category
      },
    });

    if (!service) return null;

    return service;
  }
  async getCategoryById(categoryId: string) {
    // Fetch the category
    const category = await db.query.categories.findFirst({
      where: eq(categories.id, categoryId),
    });

    if (!category) return null;

    return category;
  }

  async getServicesByVendorId(vendorId: string) {
    return await db
      .select()
      .from(services)
      .where(eq(services.vendorId, vendorId))
      .orderBy(desc(services.createdAt));
  }
  async getService(serviceId: string) {
    const [service] = await db
      .select()
      .from(services)
      .where(eq(services.id, serviceId));

    return service ?? undefined;
  }

  async findServiceRequestByContractorVendorService({contractorId, vendorId, serviceId, }: {
    contractorId: string;
    vendorId: string;
    serviceId: string;
  }) {
    return db.query.serviceRequests.findFirst({
      where: (sr, { and, eq }) =>
        and(
          eq(sr.contractorId, contractorId),
          eq(sr.vendorId, vendorId),
          eq(sr.serviceId, serviceId)
        ),
    });
  }

  async getMarketplaceServicesByStage(stage: "startup" | "growth" | "scale", limit: number, offset: number) {
    return await db
      .select({
        serviceId: services.id,
        title: services.name,
        description: services.description,
        category: services.category,
        vendorId: services.vendorId,
        vendorProfile: {
          companyName: vendorProfiles.companyName,
          title: vendorProfiles.title,
          avatar: vendorProfiles.avatar,
        },
        categoryData: {
          id: categories.id,
          key: categories.key,
          name: categories.name,
        },
      })
      .from(services)
      .leftJoin(
        vendorProfiles,
        eq(vendorProfiles.userId, services.vendorId)
      )
      .leftJoin(
        categories,
        eq(categories.id, services.categoryId)
      )
      .where(eq(services.isActive, true))
      .orderBy(desc(services.createdAt))
      .limit(limit)
      .offset(offset);
}
async countMarketplaceServices() {
  const result = await db.select({ count: sql<number>`count(*)` }).from(services);
  return Number(result[0]?.count ?? 0);
}

  async advanceUserStage(userId: string, nextStage: "startup" | "growth" | "scale") {
    const [updated] = await db
      .update(userMaturityProfiles)
      .set({
        maturityStage: nextStage,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(userMaturityProfiles.userId, userId),
          ne(userMaturityProfiles.maturityStage, nextStage)
        )
      )
      .returning();

    return updated;
  }
  async getServiceRequestWithService(id: string) {
    return db.query.serviceRequests.findFirst({
      where: eq(serviceRequests.id, id),
      with: {
        service: true, // 🔥 THIS IS THE KEY
      },
    });
  }
  async getMessagesByServiceRequestId(serviceRequestId: string) {
    return db
      .select()
      .from(messages)
      .where(eq(messages.serviceRequestId, serviceRequestId))
      .orderBy(asc(messages.createdAt));
  }
  private isValidStatusTransition(
    currentStatus: string,
    newStatus: string
  ): boolean {
    const transitions: Record<string, string[]> = {
      pending: ["matched", "cancelled"],
      matched: ["in_progress", "cancelled"],
      in_progress: ["completed", "cancelled"],
      completed: [],
      cancelled: [],
    };

    return transitions[currentStatus]?.includes(newStatus) ?? false;
  }

  async updateServiceRequestStatus(id: string, status: string) {
    // 1️⃣ Get existing request first
    const existingRequest = await db.query.serviceRequests.findFirst({
      where: eq(serviceRequests.id, id),
    });

    if (!existingRequest) {
      throw new Error("Service request not found");
    }
    if (existingRequest.status === status) {
      return this.getServiceRequest(id);
    }

    // 2️⃣ Update status
    await db
      .update(serviceRequests)
      .set({
        status,
        updatedAt: new Date(),
      })
      .where(eq(serviceRequests.id, id));


    // 4️⃣ Return updated request
    return this.getServiceRequest(id);
  }
  async createNotification(notification: InsertNotification): Promise<Notification> {
    const [newNotification] = await db
      .insert(notifications)
      .values(notification)
      .returning();

    return newNotification;
  }
  async getUserNotifications(userId: string) {
    return await db.query.notifications.findMany({
      where: eq(notifications.userId, userId),
      orderBy: (notifications, { desc }) => [
        desc(notifications.createdAt),
      ],
      with: {
      sender: true,   // 👈 include related user
    },
    });
  }
  async markAllNotificationsAsRead(userId: string) {
    const result = await db
      .update(notifications)
      .set({ isRead: true })
      .where(
        and(
          eq(notifications.userId, userId),
          eq(notifications.isRead, false) // optional optimization
        )
      );

    return true;
  }
  async getUnreadNotificationCount(userId: string) {
    const result = await db
      .select({ count: sql<number>`count(*)` })
      .from(notifications)
      .where(
        and(
          eq(notifications.userId, userId),
          eq(notifications.isRead, false)
        )
      );

    return result[0]?.count ?? 0;
  }

  
  async markAsRead(conversationId: string, userId: string) {
    const result = await db
      .update(messages)
      .set({ isRead: true })
      .where(
        and(
          eq(messages.conversationId, conversationId),
          eq(messages.receiverId, userId),
          eq(messages.isRead, false)
        )
      )
      .returning({ id: messages.id });

    return result.length;
  }

 async getUserServiceRequests(userId: string) {
  const results = await db
    .select({
      id: serviceRequests.id,
      title: serviceRequests.title,
      vendorId: serviceRequests.vendorId,
      contractorId: serviceRequests.contractorId,
    })
    .from(serviceRequests)
    .where(
      or(
        eq(serviceRequests.vendorId, userId),
        eq(serviceRequests.contractorId, userId)
      )
    );

  if (!results.length) {
    return { conversations: [], totalUnread: 0 };
  }

  const conversationIds = results.map(r => r.id);

  // 🔹 Get last messages
  const lastMessages = await db
    .select({
      serviceRequestId: messages.serviceRequestId,
      content: messages.content,
      createdAt: messages.createdAt,
    })
    .from(messages)
    .where(inArray(messages.serviceRequestId, conversationIds))
    .orderBy(desc(messages.createdAt));

  // 🔹 Get unread counts
  const unreadCountsRaw = await db
    .select({
      serviceRequestId: messages.serviceRequestId,
      count: sql<number>`count(*)`,
    })
    .from(messages)
    .where(
      and(
        inArray(messages.serviceRequestId, conversationIds),
        eq(messages.receiverId, userId),
        eq(messages.isRead, false)
      )
    )
    .groupBy(messages.serviceRequestId);

  const unreadMap = Object.fromEntries(
    unreadCountsRaw.map(u => [u.serviceRequestId, Number(u.count)])
  );

  const totalUnread = unreadCountsRaw.reduce(
    (sum, u) => sum + Number(u.count),
    0
  );

  // 🔹 Get users
  const userIds = [
    ...new Set(
      results.flatMap(r => [r.vendorId, r.contractorId])
    ),
  ];

  const usersList = await db
    .select({
      id: users.id,
      firstName: users.firstName,
      lastName: users.lastName,
    })
    .from(users)
    .where(inArray(users.id, userIds));

  const userMap = Object.fromEntries(
    usersList.map(u => [
      u.id,
      `${u.firstName ?? ""} ${u.lastName ?? ""}`.trim(),
    ])
  );

  // 🔹 Map last message per conversation
  const lastMessageMap = new Map();

  for (const msg of lastMessages) {
    if (!lastMessageMap.has(msg.serviceRequestId)) {
      lastMessageMap.set(msg.serviceRequestId, msg);
    }
  }

  const conversations = results.map(r => {
    const otherUserId =
      r.vendorId === userId ? r.contractorId : r.vendorId;

    const lastMsg = lastMessageMap.get(r.id);

    return {
      id: r.id,
      otherUser: {
        name: userMap[otherUserId] ?? "Unknown",
      },
      lastMessage: lastMsg?.content ?? null,
      lastMessageCreatedAt: lastMsg?.createdAt ?? null,
      unreadCount: unreadMap[r.id] ?? 0,
    };
  });
  conversations.sort((a, b) => {
    if (!a.lastMessageCreatedAt) return 1;
    if (!b.lastMessageCreatedAt) return -1;

    return (
      new Date(b.lastMessageCreatedAt).getTime() -
      new Date(a.lastMessageCreatedAt).getTime()
    );
  });

  return {
    conversations,
    totalUnread,
  };
}
async getConversationBetweenUsers(
  userA: string,
  userB: string
) {
  return await db.query.conversations.findFirst({

    where: or(

      and(
        eq(conversations.contractorId, userA),
        eq(conversations.vendorId, userB)
      ),

      and(
        eq(conversations.contractorId, userB),
        eq(conversations.vendorId, userA)
      ),

    ),
  });
}
async updateConversation(id: string, data: any) {
  const [updated] = await db
    .update(conversations)
    .set(data)
    .where(eq(conversations.id, id))
    .returning();

  return updated;
}
async createConversation(data: { contractorId: string; vendorId: string; serviceRequestId?: string | null;}) {
  const [conversation] = await db
    .insert(conversations)
    .values({
      contractorId: data.contractorId,
      vendorId: data.vendorId,
      serviceRequestId: data.serviceRequestId || null,
    })
    .returning();

  return conversation;
}
async getConversationById(id: string) {
  return await db.query.conversations.findFirst({
    where: eq(conversations.id, id),

    with: {
      vendor: true,
      contractor: true,
      messages: {
        orderBy: asc(messages.createdAt),
      },
    },
  });
}
async getConversationMessages(conversationId: string) {
  return await db.query.messages.findMany({
    where: eq(messages.conversationId, conversationId),
    orderBy: asc(messages.createdAt),
  });
}
async getUserConversations(userId: string) {

  const conversationsData =
    await db.query.conversations.findMany({

      where: or(
        eq(conversations.vendorId, userId),
        eq(conversations.contractorId, userId)
      ),

      with: {
        vendor: true,
        contractor: true,
        messages: {
          orderBy: desc(messages.createdAt),
          limit: 1,
        },
      },

      orderBy: desc(conversations.updatedAt),
    });

  const formatted = await Promise.all(
    conversationsData.map(async (conv) => {

      const otherUser =
        conv.vendorId === userId
          ? conv.contractor
          : conv.vendor;

      const unreadCount =
        await db.$count(
          messages,
          and(
            eq(messages.conversationId, conv.id),
            eq(messages.receiverId, userId),
            eq(messages.isRead, false)
          )
        );

      return {
        id: conv.id,

        otherUser: {
          id: otherUser?.id,
          name:
            `${otherUser?.firstName ?? ""} ${otherUser?.lastName ?? ""}`.trim(),
        },

        lastMessage:
          conv.messages?.[0]?.content ?? "",

        unreadCount,

        updatedAt: conv.updatedAt,
      };
    })
  );

  const totalUnread =
    formatted.reduce(
      (sum, c) => sum + c.unreadCount,
      0
    );

  return {
    conversations: formatted,
    totalUnread,
  };
}
async updateVendorResponseTime(vendorId: string, newMinutes: number) {
  const vendorProfile = await db.query.vendorProfiles.findFirst({
    where: eq(vendorProfiles.userId, vendorId),
  });

  if (!vendorProfile) return;

  let existingMinutes = 0;

  if (vendorProfile.responseTime) {
    const match = vendorProfile.responseTime.match(/\d+/);
    if (match) {
      existingMinutes = parseInt(match[0]);
    }
  }

  let finalAverage;

  if (existingMinutes === 0) {
    finalAverage = newMinutes;
  } else {
    finalAverage = Math.floor(
      (existingMinutes + newMinutes) / 2
    );
  }

  function format(minutes: number) {
    if (minutes < 60) return `${minutes} min`;
    if (minutes < 1440) return `${Math.round(minutes / 60)} hr`;
    return `${Math.round(minutes / 1440)} day`;
  }

  await db
    .update(vendorProfiles)
    .set({
      responseTime: format(finalAverage),
    })
    .where(eq(vendorProfiles.userId, vendorId));
}

async createRequestLog(data: {serviceRequestId: string; action: string; performedBy: string; previousStatus?: string; newStatus?: string; metadata?: any;}) {
  return await db.insert(requestLogs).values(data);
}

async createEscrow(data: {
  serviceRequestId: string;
  contractorId: string;
  vendorId: string;
  amount: string;
  platformFee: string;
  vendorEarning: string;
  paymentIntentId:string;
  chargeId:string;
}) {
  return await db.insert(escrows).values({
    serviceRequestId: data.serviceRequestId,
    contractorId: data.contractorId,
    vendorId: data.vendorId,
    amount: data.amount,
    platformFee: data.platformFee,
    vendorEarning: data.vendorEarning,
    paymentIntentId:data.paymentIntentId ?? null,
    chargeId:data.chargeId ?? null,
    heldAt: new Date(),
  }).returning();
}
async releaseEscrowByRequestId(
  serviceRequestId: string,
  winner: "vendor" | "contractor" | "partial",
  vendorPercent?: number
) {
  const escrow = await db.query.escrows.findFirst({
    where: (e, { eq }) => eq(e.serviceRequestId, serviceRequestId),
  });

  if (!escrow) {
    throw new Error("Escrow not found");
  }

  if (escrow.status !== "held" && escrow.status !== "disputed") {
    throw new Error("Escrow already processed");
  }

  const originalVendorEarning = Number(escrow.vendorEarning);
  let updatedVendorEarning = originalVendorEarning;
  let status: "released" | "refunded" = "released";

  if (winner === "vendor") {
    updatedVendorEarning = originalVendorEarning;
  }else if (winner === "contractor") {
    updatedVendorEarning = 0;
    status = 'refunded';
  }else if (winner === "partial") {
    if (vendorPercent === undefined) {
      throw new Error("Vendor percent required for partial win");
    }

    updatedVendorEarning = Number(
      ((originalVendorEarning * vendorPercent) / 100).toFixed(2)
    );
  }

  await db
    .update(escrows)
    .set({
      status: status,
      vendorEarning: updatedVendorEarning.toFixed(2),
      releasedAt: new Date(),
    })
    .where(eq(escrows.id, escrow.id));

  return { success: true };
}
async updateDisputeResolution(
  disputeId: string,
  resolution: string
) {
  const dispute = await db.query.disputes.findFirst({
    where: eq(disputes.id, disputeId),
  });

  if (!dispute) {
    throw new Error("Dispute not found");
  }
  let finalStatus: string;

  if (resolution === "vendor") {
    finalStatus = "vendor_won";
  } else if (resolution === "contractor") {
    finalStatus = "contractor_won";
  } else if (resolution === "partial") {
    finalStatus = "partial_win"; 
  } else {
    finalStatus = "unknown";
  }

  const [updatedDispute] = await db
    .update(disputes)
    .set({
      status: "resolved",
      resolution: finalStatus,
      resolvedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(disputes.id, disputeId))
    .returning();

  return updatedDispute;
}
async autoCompleteIfExpired(request: any) {
  if (!request) return null;

  if (
    request.status !== "delivered" ||
    !request.deliveredAt ||
    request.paymentStatus !== "escrow_held"
  ) {
    return request.status;
  }

  const expiryDate = new Date(request.deliveredAt);
  expiryDate.setDate(expiryDate.getDate() + 1);

  if (new Date() <= expiryDate) {
    return request.status;
  }

  // 1️⃣ Update request
  await db
    .update(serviceRequests)
    .set({
      status: "completed",
      completedAt: new Date(),
      updatedAt: new Date(),
      actualCost: request.finalPrice || request.proposedPrice,
      paymentStatus: "released",
    })
    .where(eq(serviceRequests.id, request.id));

  // 2️⃣ Release escrow ALSO
  await db
    .update(escrows)
    .set({
      status: "released",
      releasedAt: new Date(),
    })
    .where(eq(escrows.serviceRequestId, request.id));

  return "completed";
}

async createDispute({serviceRequestId, openedBy, reason, description, }: {
  serviceRequestId: string;
  openedBy: string;
  reason: string;
  description?: string;
}) {
  const request = await db.query.serviceRequests.findFirst({
    where: eq(serviceRequests.id, serviceRequestId),
  });

  if (!request) {
    throw new Error("Service request not found");
  }

  // ✅ Authorization check
  if (
    request.contractorId !== openedBy &&
    request.vendorId !== openedBy
  ) {
    throw new Error("Not authorized to dispute this request");
  }

  const existing = await db.query.disputes.findFirst({
    where: eq(disputes.serviceRequestId, serviceRequestId),
  });

  if (existing) {
    throw new Error("Dispute already exists");
  }

  await db.insert(disputes).values({
    serviceRequestId,
    openedBy,
    reason,
    description,
  });

  // Update request
  await db
    .update(serviceRequests)
    .set({ status: "disputed" })
    .where(eq(serviceRequests.id, serviceRequestId));

  // Freeze escrow
  await db
    .update(escrows)
    .set({ status: "disputed" })
    .where(eq(escrows.serviceRequestId, serviceRequestId));

  return { success: true };
}

async getEscrowByRequestId(requestId: string) {
  return await db.query.escrows.findFirst({
    where: eq(escrows.serviceRequestId, requestId),
  });
}

async createSubscription(data: InsertSubscription) {
  const [created] = await db
    .insert(subscriptions)
    .values({
      ...data,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .returning();

  return created;
}
async getSubscriptionByStripeId(stripeSubscriptionId: string) {
  const [sub] = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.stripeSubscriptionId, stripeSubscriptionId));

  return sub;
}
async updateSubscriptionStatus(stripeSubscriptionId: string, status: string) {
  await db
    .update(subscriptions)
    .set({ status, updatedAt: new Date() })
    .where(eq(subscriptions.stripeSubscriptionId, stripeSubscriptionId));
}
async getSubscriptionByUserId(userId: string) {
  const [sub] = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.userId, userId))
    .orderBy(desc(subscriptions.createdAt));

  return sub;
}

async getActiveSubscriptionByUserId(userId: string) {
  const [sub] = await db
    .select()
    .from(subscriptions)
    .where(
      and(
        eq(subscriptions.userId, userId),
        eq(subscriptions.status, "active")
      )
    );

  return sub;
}
async updateSubscriptionDetails(
  stripeSubscriptionId: string,
  data: {
    status?: string;
    cancelAtPeriodEnd?: boolean;
    currentPeriodStart?: Date | null;
    currentPeriodEnd?: Date | null;
  }
) {
  await db
    .update(subscriptions)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(eq(subscriptions.stripeSubscriptionId, stripeSubscriptionId));
}

async getRecommendedServices(gaps: Gap[], businessType?: BusinessType) {
  const categoryMap = GAP_CATEGORY_MAP;
  const results: any[] = [];
  const usedCategories = new Set<ServiceCategory>();

  for (const gap of gaps) {
    const category = categoryMap[gap.type];
    if (usedCategories.has(category)) continue;

    usedCategories.add(category);

    const conditions = [eq(services.category, category)];

    if (businessType && businessType !== "both") {
      conditions.push(
        or(
          eq(users.businessType, businessType),
          eq(users.businessType, "both")
        )
      );
    }

    const [row] = await db
      .select()
      .from(services)
      .leftJoin(
        vendorProfiles,
        eq(vendorProfiles.userId, services.vendorId)
      )
      .leftJoin(
        users,
        eq(users.id, services.vendorId)
      )
      .where(and(...conditions))
      .limit(3);

    if (row) {
      results.push({
        ...row.services,
        vendorProfile: row.vendor_profiles
          ? {
              id: row.vendor_profiles.id,
              companyName: row.vendor_profiles.companyName,
              avatar: row.vendor_profiles.avatar,
              rating: row.vendor_profiles.rating,
            }
          : null,
        recommendedFor: gap.type,
      });
    }
  }

  return results;
}
  async getWalletTransactions() {
  return await db.query.walletTransactions.findMany({
    columns: {
      id: true,
      amount: true,
      type: true,
      referenceId: true,
      createdAt: true,
    },

    with: {
      wallet: {
        columns: {
          id: true,
          balance: true,
        },

        // with: {
        //   user: {
        //     columns: {
        //       firstName: true,
        //       lastName: true,
        //     },
        //   },
        // },
      },

      serviceRequests: {
        columns: {
          title: true,
          description: true,
        },
      },
    },

    orderBy: (wt, { desc }) => [desc(wt.createdAt)],
  });
}
async getServiceVendors(categoryId: string) {
  return await db
    .select({
      vendorId: services.vendorId,

      // Vendor Profile
      companyName: vendorProfiles.companyName,
      title: vendorProfiles.title,
      avatar: vendorProfiles.avatar,
      location: vendorProfiles.location,
      description: vendorProfiles.description,
      hourlyRate: vendorProfiles.hourlyRate,
      rating: vendorProfiles.rating,
      phone: vendorProfiles.phone,
      reviewCount: vendorProfiles.reviewCount,
      categories: vendorProfiles.categories,
      subscriptionTier: vendorProfiles.subscriptionTier,

      // User
      email: users.email,
      username: users.username,
      firstName: users.firstName,
      lastName: users.lastName,

      // Maturity
      maturityStage: userMaturityProfiles.maturityStage,


      // ✅ One service (MIN used as trick)
      serviceId: sql<string>`(ARRAY_AGG(${services.id}))[1]`,
      serviceName: sql<string>`(ARRAY_AGG(${services.name}))[1]`,
      serviceDescription: sql<string>`(ARRAY_AGG(${services.description}))[1]`,
      pricingModel: sql<string>`(ARRAY_AGG(${services.pricingModel}))[1]`,
      priceMin: sql<string>`(ARRAY_AGG(${services.priceMin}))[1]`,
      priceMax: sql<string>`(ARRAY_AGG(${services.priceMax}))[1]`,
    })
    .from(services)

    // Vendor Profile
    .leftJoin(
      vendorProfiles,
      eq(vendorProfiles.userId, services.vendorId)
    )

    // User
    .leftJoin(
      users,
      eq(users.id, services.vendorId)
    )

    // Maturity Profile
    .leftJoin(
      userMaturityProfiles,
      eq(userMaturityProfiles.userId, services.vendorId)
    )

    // Filter category
    .where(eq(services.categoryId, categoryId))

    // Group by vendor ONLY
    .groupBy(
      services.vendorId,
      vendorProfiles.companyName,
      vendorProfiles.title,
      vendorProfiles.avatar,
      vendorProfiles.location,
      vendorProfiles.description,
      vendorProfiles.hourlyRate,
      vendorProfiles.categories,
      vendorProfiles.reviewCount,
      vendorProfiles.rating,
      vendorProfiles.phone,
      vendorProfiles.subscriptionTier,
      users.email,
      users.username,
      users.firstName,
      users.lastName,
      userMaturityProfiles.maturityStage
    );
}
async getCategoryVendors(categoryId: string) {
  return await db
    .select({
      vendorId: users.id,

      // Vendor Profile
      companyName: vendorProfiles.companyName,
      title: vendorProfiles.title,
      avatar: vendorProfiles.avatar,
      location: vendorProfiles.location,
      description: vendorProfiles.description,
      hourlyRate: vendorProfiles.hourlyRate,
      rating: vendorProfiles.rating,
      reviewCount: vendorProfiles.reviewCount,
      categoryIds: vendorProfiles.categoryIds,
      subscriptionTier: vendorProfiles.subscriptionTier,
      phone: vendorProfiles.phone,
      skills: vendorProfiles.skills,
      yearsOfExperience: vendorProfiles.yearsOfExperience,
      agenciesServed: vendorProfiles.agenciesServed,

      // User
      email: users.email,
      username: users.username,
      firstName: users.firstName,
      lastName: users.lastName,
      businessType: users.businessType,

      // Real Categories Relation
      categories: sql<any>`
        json_agg(
          distinct jsonb_build_object(
            'id', ${categories.id},
            'name', ${categories.name},
            'key', ${categories.key}
          )
        )
      `,

      // ONE SERVICE
      serviceId: sql<string>`(ARRAY_AGG(${services.id}))[1]`,
      serviceName: sql<string>`(ARRAY_AGG(${services.name}))[1]`,
      serviceDescription: sql<string>`(ARRAY_AGG(${services.description}))[1]`,
      pricingModel: sql<string>`(ARRAY_AGG(${services.pricingModel}))[1]`,
      priceMin: sql<string>`(ARRAY_AGG(${services.priceMin}))[1]`,
      priceMax: sql<string>`(ARRAY_AGG(${services.priceMax}))[1]`,
    })
    .from(vendorProfiles)

    // Services
    .innerJoin(
      services,
      eq(services.vendorId, vendorProfiles.userId)
    )

    // Users
    .leftJoin(
      users,
      eq(users.id, vendorProfiles.userId)
    )

    // Categories
    .innerJoin(
      categories,
      sql`${categories.id} = ANY(${vendorProfiles.categoryIds})`
    )

    // Filters
    .where(
      sql`
        ${vendorProfiles.categoryIds} && ARRAY[${categoryId}]::uuid[]
        AND ${services.categoryId} = ${categoryId}
      `
    )

    // Group By
    .groupBy(
      users.id,
      vendorProfiles.companyName,
      vendorProfiles.title,
      vendorProfiles.avatar,
      vendorProfiles.location,
      vendorProfiles.description,
      vendorProfiles.hourlyRate,
      vendorProfiles.rating,
      vendorProfiles.phone,
      vendorProfiles.reviewCount,
      vendorProfiles.categoryIds,
      vendorProfiles.subscriptionTier,
      vendorProfiles.skills,
      vendorProfiles.agenciesServed,
      vendorProfiles.yearsOfExperience,
      users.businessType,
      users.email,
      users.username,
      users.firstName,
      users.lastName,
    );
}
async setupContractorUser() {
  const email = 'contractor2@gmail.com';

  // 1. check user
  let user = await db.query.users.findFirst({
    where: eq(users.email, email),
  });

  // 2. if NOT exists → create
  if (!user) {
    const hashed = await bcrypt.hash('11223344', 10);
    const newUser = await db.insert(users).values({
      email,
      password: hashed,
      userType: 'contractor',
      isEmailVerified: true,
      hasCompletedOnboarding: true,
    }).returning();

    user = newUser[0];

    return {
      type: 'created',
      user,
    };
  }
  console.log('User already exists, resetting maturity profile...', user.id);

  // 3. if exists → DELETE maturity profile
  await db.delete(userMaturityProfiles)
    .where(eq(userMaturityProfiles.userId, user.id));

  return {
    type: 'reset',
    user,
  };
}
// for testing purposes only - resets user subscription data
async deleteSubscriptionByUserId(userId: string) {
  const result = await db.delete(subscriptions)
    .where(eq(subscriptions.userId, userId))
    .returning();
}
async resetUserSubscription(userId: string) {
  const result =await db
    .update(userMaturityProfiles)
    .set({
      subscriptionTier: 'beta',
      stripeCustomerId: null,
      stripeSubscriptionId: null,
      updatedAt: new Date(),
    })
    .where(eq(userMaturityProfiles.userId, userId));
}
async getUserCount() {
  const result = await db
    .select({ count: sql<number>`count(*)` })
    .from(users);

  return Number(result[0]?.count || 0);
}
async fetchVendorCategoryServices(vendorId: string, categoryId: string) {
  return await db.query.services.findMany({
    where: (services, { eq, and }) =>
      and(
        eq(services.vendorId, vendorId),
        eq(services.categoryId, categoryId)
      ),
  });
}
async getVendorServices(vendorId: string) {

  return await db.query.services.findMany({
    where: eq(
      services.vendorId,
      vendorId
    ),

    with: {
      categoryData: true,
    },
  });

}
async createSupportTicket(data: {userId: string; subject: string; message: string;}) {
  const [ticket] = await db
    .insert(supportTickets)
    .values({
      userId: data.userId,
      subject: data.subject,
      status: "open",
      isReadByAdmin: false,
      isReadByUser: true,
    })
    .returning();

  await db.insert(supportMessages).values({
    ticketId: ticket.id,
    senderId: data.userId,
    message: data.message,
    isRead: false,
  });

  return ticket;
}
async getSupportTicketsByUser(userId: string, page = 1, limit = 10, status?: string) {
  const offset = (page - 1) * limit;

  const conditions = [
    eq(supportTickets.userId, userId),
  ];

  if (status && status !== "all") {
    conditions.push(
      eq(supportTickets.status, status as any)
    );
  }

  const whereClause = and(...conditions);

  const tickets = await db.query.supportTickets.findMany({
    where: whereClause,

    with: {
      user: true,
    },

    orderBy: desc(supportTickets.createdAt),

    limit,
    offset,
  });

  const [{ count: total }] = await db
    .select({
      count: count(),
    })
    .from(supportTickets)
    .where(whereClause);

  return {
    tickets,
    total,
  };
}
async getAllSupportTickets(
  page = 1,
  limit = 10,
  status?: string
) {
  const offset = (page - 1) * limit;

  const whereClause =
    status && status !== "all"
      ? eq(supportTickets.status, status as any)
      : undefined;

  const tickets = await db.query.supportTickets.findMany({
    where: whereClause,

    with: {
      user: true,
    },

    orderBy: desc(supportTickets.createdAt),

    limit,
    offset,
  });

  const total = await db
    .select({ count: count() })
    .from(supportTickets)
    .where(whereClause);

  return {
    tickets,
    total: total[0].count,
  };
}
async getSupportTicket(ticketId: string) {
  return await db.query.supportTickets.findFirst({
    where: eq(supportTickets.id, ticketId),

    with: {
      user: {
        columns: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          userType: true,
        },
      },

      messages: {
        with: {
          sender: {
            columns: {
              id: true,
              firstName: true,
              lastName: true,
              userType: true,
            },
          },
        },

        orderBy: desc(supportMessages.createdAt),
      },
    },
  });
}
async addSupportReply(ticketId: string, senderId: string, message: string) {
  const ticket = await db.query.supportTickets.findFirst({
    where: eq(supportTickets.id, ticketId),
  });

  if (!ticket) {
    throw new Error("Ticket not found");
  }

  if (
    ticket.status === "resolved" ||
    ticket.status === "closed"
  ) {
    throw new Error("Ticket is locked");
  }

  const [reply] = await db
    .insert(supportMessages)
    .values({
      ticketId,
      senderId,
      message,
      isRead: false,
    })
    .returning();

  return reply;
}
async updateSupportTicketStatus(ticketId: string, status: string) {
  const [ticket] = await db
    .update(supportTickets)
    .set({
      status,
      updatedAt: new Date(),
    })
    .where(eq(supportTickets.id, ticketId))
    .returning();

  return ticket;
}
async getSupportTicketStats(userId: string) {
  try {

    const all = await db
      .select({ count: count() })
      .from(supportTickets)
      .where(
        userId
          ? eq(supportTickets.userId, userId)
          : undefined
      );

  const open = await db
    .select({ count: count() })
    .from(supportTickets)
    .where(
      userId
        ? and(eq(supportTickets.userId, userId), eq(supportTickets.status, "open"))
        : eq(supportTickets.status, "open")
    );

  const resolved = await db
    .select({ count: count() })
    .from(supportTickets)
    .where(
      userId
        ? and(eq(supportTickets.userId, userId), eq(supportTickets.status, "resolved"))
        : eq(supportTickets.status, "resolved")
    );

  const closed = await db
    .select({ count: count() })
    .from(supportTickets)
    .where(
      userId
        ? and(eq(supportTickets.userId, userId), eq(supportTickets.status, "closed"))
        : eq(supportTickets.status, "closed")
    );

  return {
    all: all[0].count,
    open: open[0].count,
    resolved: resolved[0].count,
    closed: closed[0].count,
  };


  } catch (error) {
    console.error(error);
    throw error;
  }
}

// end
}
export const storage = new DatabaseStorage();

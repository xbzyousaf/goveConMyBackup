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
  userContentActivity,
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
  type InsertContentLibrary,
  type UserJourney,
  type InsertUserJourney,
  type UserContentActivity,
  type InsertUserContentActivity,
  services,
  serviceTiers
} from "@shared/schema";
import { db } from "./db";
import { sql, eq, and, desc, asc } from "drizzle-orm";

// Enhanced IStorage interface with marketplace functionality
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
  createVendorProfile(profile: InsertVendorProfile, userId: string): Promise<VendorProfile>;
  updateVendorProfile(id: string, updates: Partial<InsertVendorProfile>): Promise<VendorProfile>;
  getVendors(filters?: { category?: string; location?: string; verified?: boolean }): Promise<VendorProfile[]>;
  
  // Service request management
  getServiceRequest(id: string): Promise<ServiceRequest | undefined>;
  createServiceRequest(request: InsertServiceRequest): Promise<ServiceRequest>;
  updateServiceRequest(id: string, updates: Partial<ServiceRequest>): Promise<ServiceRequest>;
  getServiceRequestsByContractor(contractorId: string): Promise<ServiceRequest[]>;
  getServiceRequestsByVendor(vendorId: string): Promise<ServiceRequest[]>;
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

  async updateUser(id: string, updates: Partial<InsertUser>): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  // Vendor management
  async getVendorProfile(userId: string): Promise<VendorProfile | undefined> {
    const [profile] = await db.select().from(vendorProfiles).where(eq(vendorProfiles.userId, userId));
    return profile || undefined;
  }

  async getVendorProfileById(
  id: string
): Promise<(VendorProfile & { rating: number; reviewCount: number }) | undefined> {

  const result = await db
    .select({
      // ✅ vendor profile fields
      id: vendorProfiles.id,
      userId: vendorProfiles.userId,
      title: vendorProfiles.title,
      companyName: vendorProfiles.companyName,
      description: vendorProfiles.description,
      categories: vendorProfiles.categories,
      skills: vendorProfiles.skills,
      location: vendorProfiles.location,
      hourlyRate: vendorProfiles.hourlyRate,
      responseTime: vendorProfiles.responseTime,
      availability: vendorProfiles.availability,
      certifications: vendorProfiles.certifications,
      isApproved: vendorProfiles.isApproved,
      isFeatured: vendorProfiles.isFeatured,
      createdAt: vendorProfiles.createdAt,
      updatedAt: vendorProfiles.updatedAt,

      // ✅ computed values (simple)
      rating: sql<number>`COALESCE(AVG(${reviews.rating}), 0)`.as("rating"),
      reviewCount: sql<number>`COUNT(${reviews.id})`.as("reviewCount"),
    })
    .from(vendorProfiles)
    .leftJoin(
      reviews,
      eq(reviews.revieweeId, vendorProfiles.userId)
    )
    .where(eq(vendorProfiles.userId, id))
    .groupBy(vendorProfiles.id)
    .limit(1);

  if (!result.length) return undefined;

  return {
    ...result[0],
    rating: Number(result[0].rating),
    reviewCount: Number(result[0].reviewCount),
  };
}


  async createVendorProfile(profile: InsertVendorProfile, userId: string): Promise<VendorProfile> {
    const [vendorProfile] = await db
      .insert(vendorProfiles)
      .values({
        ...profile,
        userId: userId,
        updatedAt: new Date()
      })
      .returning();
    return vendorProfile;
  }

  async updateVendorProfile(id: string, updates: Partial<InsertVendorProfile>): Promise<VendorProfile> {
    const [profile] = await db
      .update(vendorProfiles)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(vendorProfiles.id, id))
      .returning();
    return profile;
  }

  async getVendors(
    filters?: { category?: string; location?: string; verified?: boolean }
  ): Promise<(VendorProfile & { reviewCount: number })[]> {

    const whereConditions = [];

    if (filters?.verified !== undefined) {
      whereConditions.push(eq(vendorProfiles.isApproved, filters.verified));
    }

    if (filters?.location) {
      whereConditions.push(eq(vendorProfiles.location, filters.location));
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
        reviewCount: sql<number>`COALESCE(MAX(review_stats.review_count), 0)`,
        rating: sql<number>`COALESCE(MAX(review_stats.avg_rating), 0)`
      })
      .from(vendorProfiles)
      .innerJoin(
        services,
        eq(services.vendorId, vendorProfiles.userId)
      )
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
      rating: Number(row.rating) || 0,
      reviewCount: Number(row.reviewCount) || 0,
    }));
  }

  async getOnlyVendors(): Promise<VendorProfile[]> {
    return await db.select().from(vendorProfiles);
  }

  // Service request management
  async getServiceRequest(id: string): Promise<ServiceRequest | undefined> {
    const [request] = await db.select().from(serviceRequests).where(eq(serviceRequests.id, id));
    return request || undefined;
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
    // Only allow updating specific fields to prevent unauthorized changes
    const allowedUpdates: Partial<ServiceRequest> = {};
    
    if (updates.vendorId !== undefined) allowedUpdates.vendorId = updates.vendorId;
    if (updates.status !== undefined) allowedUpdates.status = updates.status;
    if (updates.aiAnalysis !== undefined) allowedUpdates.aiAnalysis = updates.aiAnalysis;
    if (updates.estimatedCost !== undefined) allowedUpdates.estimatedCost = updates.estimatedCost;
    if (updates.actualCost !== undefined) allowedUpdates.actualCost = updates.actualCost;
    if (updates.estimatedDuration !== undefined) allowedUpdates.estimatedDuration = updates.estimatedDuration;
    
    const [request] = await db
      .update(serviceRequests)
      .set({ ...allowedUpdates, updatedAt: new Date() })
      .where(eq(serviceRequests.id, id))
      .returning();
    return request;
  }

  async getServiceRequestsByContractor(contractorId: string): Promise<ServiceRequest[]> {
    const requests = await db
      .select()
      .from(serviceRequests)
      .where(eq(serviceRequests.contractorId, contractorId))
      .orderBy(desc(serviceRequests.createdAt));
    return requests;
  }

  async getServiceRequestsByVendor(vendorId: string): Promise<ServiceRequest[]> {
    const requests = await db
      .select()
      .from(serviceRequests)
      .where(eq(serviceRequests.vendorId, vendorId))
      .orderBy(desc(serviceRequests.createdAt));
    return requests;
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
    return newMessage;
  }

  async getMessagesByServiceRequest(serviceRequestId: string): Promise<Message[]> {
    const messageList = await db
      .select()
      .from(messages)
      .where(eq(messages.serviceRequestId, serviceRequestId))
      .orderBy(asc(messages.createdAt));
    return messageList;
  }

  async markMessageAsRead(messageId: string): Promise<void> {
    await db
      .update(messages)
      .set({ isRead: true })
      .where(eq(messages.id, messageId));
  }

  // Reviews
  async createReview(review: InsertReview): Promise<Review> {
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
        contractorName: users.firstName, 
        contractorUserType: users.userType, 
        contractorEmail: users.email,    
      })
      .from(reviews)
      .leftJoin(users, eq(users.id, reviews.reviewerId))
      .where(eq(reviews.revieweeId, vendorId))
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
  async createService(data: any, vendorId: string) {
    return await db.transaction(async tx => {
      // 1️⃣ Create parent service
      const [service] = await tx
        .insert(services)
        .values({
          vendorId,
          name: data.name,
          description: data.description,
          category: data.category,
          pricingModel: data.pricingModel ?? null,
          isActive: true,
        })
        .returning();

      // 2️⃣ Create tiers (children)
      const tiersData = Object.entries(data.tiers || {}).map(
        ([tierKey, tier]: [string, any]) => ({
          serviceId: service.id,
          tier: tierKey, // "free" | "standard" | "premium"
          turnaround: tier.turnaround ?? null,
          priceMin: tier.priceMin != null ? String(tier.priceMin) : null,
          priceMax: tier.priceMax != null ? String(tier.priceMax) : null,
          outcomes: Array.isArray(tier.outcomes) ? tier.outcomes : [],
        })
      );

      if (tiersData.length > 0) {
        await tx.insert(serviceTiers).values(tiersData);
      }

      // 3️⃣ Return service with tiers
      return {
        ...service,
        tiers: tiersData,
      };
    });
  }

  async getAllServices() {
    const allServicesWithTiers = await db
      .select()
      .from(services)
      .leftJoin(serviceTiers, serviceTiers.serviceId.equals(services.id))
      .orderBy(services.createdAt, "desc");

    return allServicesWithTiers;
  }

  async getServicesByVendorId(vendorId: string) {
    return await db
      .select()
      .from(services)
      .where(eq(services.vendorId, vendorId))
      .orderBy(desc(services.createdAt));
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
  }
  async getVendorServices(vendorId: string) {
    return await db.query.services.findMany({
      where: eq(services.vendorId, vendorId),
      with: {
        tiers: true, // 🔥 loads all related service_tiers
      },
    });
  }
  async updateVendorApproval(vendorId: string, approve: boolean) {
    await db.update(vendorProfiles)
            .set({ isApproved: approve })
            .where(eq(vendorProfiles.id, vendorId));
  }
}

export const storage = new DatabaseStorage();

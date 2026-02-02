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
  type InsertUserContentActivity
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, asc } from "drizzle-orm";

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

  async getVendorProfileById(id: string): Promise<VendorProfile | undefined> {
    const [profile] = await db.select().from(vendorProfiles).where(eq(vendorProfiles.userId, id));
    return profile || undefined;
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

  async getVendors(filters?: { category?: string; location?: string; verified?: boolean }): Promise<VendorProfile[]> {
    console.log('[getVendors] Starting query with filters:', filters);
    const whereConditions = [];
    
    if (filters?.verified !== undefined) {
      whereConditions.push(eq(vendorProfiles.isApproved, filters.verified));
    }
    
    if (filters?.location) {
      whereConditions.push(eq(vendorProfiles.location, filters.location));
    }
    
    if (filters?.category) {
      // Note: categories is an array, so we'd need array contains logic
      // For now, this would need additional SQL array operations
    }
    
    try {
      console.log('[getVendors] Query created');
      
      if (whereConditions.length > 0) {
        console.log('[getVendors] Where conditions applied:', whereConditions.length);
        const results = await db.select().from(vendorProfiles)
          .where(whereConditions.length === 1 ? whereConditions[0] : and(...whereConditions as [any, ...any[]]))
          .orderBy(desc(vendorProfiles.rating));
        console.log(`[getVendors] Query complete. Got ${results.length} vendors:`, results.map(v => ({ id: v.id, title: v.title })));
        return results;
      }
      
      console.log('[getVendors] Executing query...');
      const results = await db.select().from(vendorProfiles).orderBy(desc(vendorProfiles.rating));
      console.log(`[getVendors] Query complete. Got ${results.length} vendors:`, results.map(v => ({ id: v.id, title: v.title })));
      return results;
    } catch (error) {
      console.error('[getVendors] ERROR:', error);
      throw error;
    }
  }

  // Service request management
  async getServiceRequest(id: string): Promise<ServiceRequest | undefined> {
    const [request] = await db.select().from(serviceRequests).where(eq(serviceRequests.id, id));
    return request || undefined;
  }

  async createServiceRequest(request: InsertServiceRequest): Promise<ServiceRequest> {
    const [serviceRequest] = await db
      .insert(serviceRequests)
      .values({
        ...request,
        updatedAt: new Date()
      })
      .returning();
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
}

export const storage = new DatabaseStorage();

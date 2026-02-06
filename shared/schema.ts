import { sql, relations } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, boolean, decimal, pgEnum, jsonb, index, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { uniqueIndex } from "drizzle-orm/pg-core";
// Session storage table for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// Enums
export const userTypeEnum = pgEnum("user_type", ["contractor", "vendor", 'admin']);
export const serviceRequestStatusEnum = pgEnum("service_request_status", ["pending", "matched", "in_progress", "completed", "cancelled"]);
export const serviceCategoryEnum = pgEnum("service_category", ["legal", "hr", "finance", "cybersecurity", "marketing", "business_tools"]);
export const maturityStageEnum = pgEnum("maturity_stage", ["startup", "growth", "scale"]);
export const coreProcessEnum = pgEnum("core_process", ["business_structure", "business_strategy", "execution"]);
export const contentTypeEnum = pgEnum("content_type", ["playbook", "template", "guide", "webinar", "faq", "checklist"]);
export const subscriptionTierEnum = pgEnum("subscription_tier", ["freemium", "startup", "growth", "scale"]);
export const vendorJourneyStageEnum = pgEnum("vendor_journey_stage", ["awareness", "application", "vetting", "onboarding", "active", "inactive"]);

// Users table - custom email/password authentication
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique().notNull(),
  password: text("password").notNull(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  username: text("username").unique(),
  userType: userTypeEnum("user_type").notNull().default("contractor"),
  hasCompletedOnboarding: boolean("has_completed_onboarding").default(false),
  // Email verification
  isEmailVerified: boolean("is_email_verified").default(false),
  emailVerificationToken: text("email_verification_token"),
  emailVerificationExpiry: timestamp("email_verification_expiry"),
  // Password reset
  passwordResetToken: text("password_reset_token"),
  passwordResetExpiry: timestamp("password_reset_expiry"),
  skipAssessment: boolean("skip_assessment").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Vendor profiles
export const vendorProfiles = pgTable("vendor_profiles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  companyName: text("company_name"),
  title: text("title").notNull(),
  description: text("description"),
  location: text("location"),
  hourlyRate: decimal("hourly_rate", { precision: 10, scale: 2 }),
  responseTime: text("response_time"),
  skills: text("skills").array(),
  categories: serviceCategoryEnum("categories").array(),
  avatar: text("avatar"),
  rating: decimal("rating", { precision: 3, scale: 2 }).default("0"),
  reviewCount: integer("review_count").default(0),
  isApproved: boolean("is_approved").default(false),
  // Enhanced vendor profile fields
  pastPerformance: jsonb("past_performance"),
  certifications: text("certifications").array(),
  availability: text("availability").default("Available"),
  isFeatured: boolean("is_featured").default(false),
  // Vendor journey & monetization
  journeyStage: vendorJourneyStageEnum("journey_stage").default("application"),
  subscriptionTier: subscriptionTierEnum("subscription_tier").default("freemium"),
  leadCreditsBalance: integer("lead_credits_balance").default(0),
  stripeCustomerId: text("stripe_customer_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),
  // Analytics
  profileViews: integer("profile_views").default(0),
  leadsReceived: integer("leads_received").default(0),
  leadsAccepted: integer("leads_accepted").default(0),
  totalEarnings: decimal("total_earnings", { precision: 10, scale: 2 }).default("0"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Services (what vendor offers)
export const services = pgTable("services", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),

  vendorId: varchar("vendor_id")
    .references(() => users.id)
    .notNull(),

  name: text("title").notNull(),
  description: text("description").notNull(),
  category: serviceCategoryEnum("category").notNull(),

  turnaround: text("turnaround"),

  pricingModel: text("pricing_model"),

  priceMin: decimal("price_min", { precision: 10, scale: 2 }),
  priceMax: decimal("price_max", { precision: 10, scale: 2 }),

  outcomes: text("outcomes").array(),

  tier: text("tier").default("free"),

  isActive: boolean("is_active").default(true),

  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

  export const serviceRequests = pgTable("service_requests", {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    contractorId: varchar("contractor_id").references(() => users.id).notNull(),
    vendorId: varchar("vendor_id").references(() => users.id),
    title: text("title").notNull(),
    serviceId: uuid("service_id").notNull(),
    description: text("description").notNull(),
    category: serviceCategoryEnum("category").notNull(),
    priority: text("priority").notNull(),
    budget: text("budget"),
    status: serviceRequestStatusEnum("status").default("pending"),
    aiAnalysis: text("ai_analysis"),
    estimatedCost: decimal("estimated_cost", { precision: 10, scale: 2 }),
    actualCost: decimal("actual_cost", { precision: 10, scale: 2 }),
    estimatedDuration: text("estimated_duration"),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  });

// Messages for contractor-vendor communication
export const messages = pgTable("messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  serviceRequestId: varchar("service_request_id").references(() => serviceRequests.id).notNull(),
  senderId: varchar("sender_id").references(() => users.id).notNull(),
  receiverId: varchar("receiver_id").references(() => users.id).notNull(),
  content: text("content").notNull(),
  attachments: text("attachments").array(),
  isRead: boolean("is_read").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Reviews and ratings
export const reviews = pgTable("reviews", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  serviceRequestId: varchar("service_request_id").references(() => serviceRequests.id).notNull(),
  reviewerId: varchar("reviewer_id").references(() => users.id).notNull(),
  revieweeId: varchar("reviewee_id").references(() => users.id).notNull(),
  rating: integer("rating").notNull(),
  comment: text("comment"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Payment transactions
export const transactions = pgTable("transactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  serviceRequestId: varchar("service_request_id").references(() => serviceRequests.id).notNull(),
  contractorId: varchar("contractor_id").references(() => users.id).notNull(),
  vendorId: varchar("vendor_id").references(() => users.id).notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  platformFee: decimal("platform_fee", { precision: 10, scale: 2 }),
  stripePaymentIntentId: text("stripe_payment_intent_id"),
  status: text("status").notNull().default("pending"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// User maturity profiles - stores assessment results and progress
export const userMaturityProfiles = pgTable("user_maturity_profiles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull().unique(),
  maturityStage: maturityStageEnum("maturity_stage").notNull(),
  readinessScore: integer("readiness_score").notNull(), // 0-100
  assessmentData: jsonb("assessment_data"), // Stores AI assessment Q&A
  currentFocus: coreProcessEnum("current_focus"), // Which process they're working on
  businessStructureProgress: integer("business_structure_progress").default(0), // 0-100%
  businessStrategyProgress: integer("business_strategy_progress").default(0),
  executionProgress: integer("execution_progress").default(0),
  subscriptionTier: subscriptionTierEnum("subscription_tier").default("freemium"),
  stripeCustomerId: text("stripe_customer_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Assessment history - tracks all assessments and retakes
export const assessments = pgTable("assessments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  conversationHistory: jsonb("conversation_history").notNull(), // AI chat messages
  maturityStage: maturityStageEnum("maturity_stage").notNull(),
  readinessScore: integer("readiness_score").notNull(),
  aiAnalysis: text("ai_analysis"), // Summary of strengths/gaps
  recommendations: jsonb("recommendations"), // Suggested next steps
  createdAt: timestamp("created_at").defaultNow(),
});

// Content library - playbooks, templates, guides, webinars
export const contentLibrary = pgTable("content_library", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  description: text("description"),
  contentType: contentTypeEnum("content_type").notNull(),
  coreProcess: coreProcessEnum("core_process"), // Which process it supports
  maturityStages: maturityStageEnum("maturity_stages").array(), // Which stages can access
  subscriptionTiers: subscriptionTierEnum("subscription_tiers").array(), // Which tiers can access
  content: text("content"), // Markdown or HTML content
  fileUrl: text("file_url"), // For downloadable templates/playbooks
  videoUrl: text("video_url"), // For webinars
  tags: text("tags").array(),
  author: text("author"),
  viewCount: integer("view_count").default(0),
  isFeatured: boolean("is_featured").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// User journey tracking - milestones and checklist completion
export const userJourneys = pgTable("user_journeys", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  coreProcess: coreProcessEnum("core_process").notNull(),
  currentStage: text("current_stage").notNull(),
  completedMilestones: text("completed_milestones").array().default(sql`ARRAY[]::text[]`),
  progressPercentage: integer("progress_percentage").default(0),
  milestoneName: text("milestone_name"),
  isCompleted: boolean("is_completed"),
  completedAt: timestamp("completed_at"),
  notes: text("notes"),
  updatedAt: timestamp("updated_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

// User content activity - track what content users engage with
export const userContentActivity = pgTable("user_content_activity", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  contentId: varchar("content_id").references(() => contentLibrary.id).notNull(),
  viewCount: integer("view_count").default(1),
  lastViewedAt: timestamp("last_viewed_at").defaultNow(),
  isBookmarked: boolean("is_bookmarked").default(false),
  completionPercentage: integer("completion_percentage").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ one, many }) => ({
  vendorProfile: one(vendorProfiles),
  contractorRequests: many(serviceRequests, { relationName: "contractorRequests" }),
  vendorRequests: many(serviceRequests, { relationName: "vendorRequests" }),
  sentMessages: many(messages, { relationName: "sentMessages" }),
  receivedMessages: many(messages, { relationName: "receivedMessages" }),
  givenReviews: many(reviews, { relationName: "givenReviews" }),
  receivedReviews: many(reviews, { relationName: "receivedReviews" }),
  contractorTransactions: many(transactions, { relationName: "contractorTransactions" }),
  vendorTransactions: many(transactions, { relationName: "vendorTransactions" }),
}));

export const vendorProfilesRelations = relations(vendorProfiles, ({ one }) => ({
  user: one(users, {
    fields: [vendorProfiles.userId],
    references: [users.id],
  }),
}));

export const serviceRequestsRelations = relations(serviceRequests, ({ one, many }) => ({
  contractor: one(users, {
    fields: [serviceRequests.contractorId],
    references: [users.id],
    relationName: "contractorRequests",
  }),
  vendor: one(users, {
    fields: [serviceRequests.vendorId],
    references: [users.id],
    relationName: "vendorRequests",
  }),
  messages: many(messages),
  reviews: many(reviews),
  transactions: many(transactions),
}));

export const messagesRelations = relations(messages, ({ one }) => ({
  serviceRequest: one(serviceRequests, {
    fields: [messages.serviceRequestId],
    references: [serviceRequests.id],
  }),
  sender: one(users, {
    fields: [messages.senderId],
    references: [users.id],
    relationName: "sentMessages",
  }),
  receiver: one(users, {
    fields: [messages.receiverId],
    references: [users.id],
    relationName: "receivedMessages",
  }),
}));

export const reviewsRelations = relations(reviews, ({ one }) => ({
  serviceRequest: one(serviceRequests, {
    fields: [reviews.serviceRequestId],
    references: [serviceRequests.id],
  }),
  reviewer: one(users, {
    fields: [reviews.reviewerId],
    references: [users.id],
    relationName: "givenReviews",
  }),
  reviewee: one(users, {
    fields: [reviews.revieweeId],
    references: [users.id],
    relationName: "receivedReviews",
  }),
}));

export const transactionsRelations = relations(transactions, ({ one }) => ({
  serviceRequest: one(serviceRequests, {
    fields: [transactions.serviceRequestId],
    references: [serviceRequests.id],
  }),
  contractor: one(users, {
    fields: [transactions.contractorId],
    references: [users.id],
    relationName: "contractorTransactions",
  }),
  vendor: one(users, {
    fields: [transactions.vendorId],
    references: [users.id],
    relationName: "vendorTransactions",
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  isEmailVerified: true,
  emailVerificationToken: true,
  emailVerificationExpiry: true,
  passwordResetToken: true,
  passwordResetExpiry: true,
  // userType: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  email: z.string().email(),
  userType: z.enum(["contractor", "vendor"]),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export const insertVendorProfileSchema = createInsertSchema(vendorProfiles).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  rating: true,
  reviewCount: true,
  isApproved: true,
  profileViews: true,
  leadsReceived: true,
  leadsAccepted: true,
  totalEarnings: true,
  userId: true,
});

export const insertServiceRequestSchema = createInsertSchema(serviceRequests).omit({
  id: true,
  // vendorId: true,
  status: true,
  // aiAnalysis: true,
  // estimatedCost: true,
  // actualCost: true,
  createdAt: true,
  updatedAt: true,
});

export const insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  isRead: true,
  createdAt: true,
});

export const insertReviewSchema = createInsertSchema(reviews).omit({
  id: true,
  createdAt: true,
});

export const insertTransactionSchema = createInsertSchema(transactions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertUserMaturityProfileSchema = createInsertSchema(userMaturityProfiles).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertAssessmentSchema = createInsertSchema(assessments).omit({
  id: true,
  createdAt: true,
});

export const insertContentLibrarySchema = createInsertSchema(contentLibrary).omit({
  id: true,
  viewCount: true,
  createdAt: true,
  updatedAt: true,
});

export const insertUserJourneySchema = createInsertSchema(userJourneys).omit({
  id: true,
  completedMilestones: true,
  progressPercentage: true,
  updatedAt: true,
  createdAt: true,
});

export const insertUserContentActivitySchema = createInsertSchema(userContentActivity).omit({
  id: true,
  viewCount: true,
  createdAt: true,
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type UpsertUser = typeof users.$inferInsert; // For Replit Auth
export type InsertVendorProfile = z.infer<typeof insertVendorProfileSchema>;
export type VendorProfile = typeof vendorProfiles.$inferSelect;
export type InsertServiceRequest = z.infer<typeof insertServiceRequestSchema>;
export type ServiceRequest = typeof serviceRequests.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type Message = typeof messages.$inferSelect;
export type InsertReview = z.infer<typeof insertReviewSchema>;
export type Review = typeof reviews.$inferSelect;
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
export type Transaction = typeof transactions.$inferSelect;
export type InsertUserMaturityProfile = z.infer<typeof insertUserMaturityProfileSchema>;
export type UserMaturityProfile = typeof userMaturityProfiles.$inferSelect;
export type InsertAssessment = z.infer<typeof insertAssessmentSchema>;
export type Assessment = typeof assessments.$inferSelect;
export type InsertContentLibrary = z.infer<typeof insertContentLibrarySchema>;
export type ContentLibrary = typeof contentLibrary.$inferSelect;
export type InsertUserJourney = z.infer<typeof insertUserJourneySchema>;
export type UserJourney = typeof userJourneys.$inferSelect;
export type InsertUserContentActivity = z.infer<typeof insertUserContentActivitySchema>;
export type UserContentActivity = typeof userContentActivity.$inferSelect;

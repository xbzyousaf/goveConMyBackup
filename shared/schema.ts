import { sql, relations, Many } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, boolean, decimal, pgEnum, jsonb, index, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { uniqueIndex } from "drizzle-orm/pg-core";
import { float } from "drizzle-orm/mysql-core";
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
export const serviceRequestStatusEnum = pgEnum("service_request_status", ["pending", "accepted", "in_progress", "delivered", "completed", "cancelled", 'disputed']);
export const maturityStageEnum = pgEnum("maturity_stage", ["startup", "growth", "scale"]);
export const coreProcessEnum = pgEnum("core_process", ["business_structure", "business_strategy", "execution"]);
export const contentTypeEnum = pgEnum("content_type", ["playbook", "template", "guide", "webinar", "faq", "checklist"]);
export const subscriptionTierEnum = pgEnum("subscription_tier", ["beta", "pilot"]);
export const vendorJourneyStageEnum = pgEnum("vendor_journey_stage", ["awareness", "application", "vetting", "onboarding", "active", "inactive"]);
export const serviceTierEnum = pgEnum("service_tier", ["free","standard","premium"]);
export const messageTypeEnum = pgEnum("message_type", ["text", "system", "file", ]);
export const extentionStatusEnum = pgEnum("status", ["pending", "accepted", "rejected", ]);
export const escrowStatusEnum = pgEnum("escrow_status", ["held", "released", "refunded", "disputed"]);
export const paymentStatus = pgEnum("payment_status", ["payment_pending", "payment_received", "escrow_held", "released", "refunded", "failed"]);
export const businessTypeEnum = pgEnum("business_type", ["commercial", "government", "both",]);
export const platformFeeTypeEnum = pgEnum("platform_fee_type", ["percentage", "fixed"]);
export const supportStatusEnum = pgEnum("support_status", ["active", "resolved"]);


export type BusinessType = (typeof businessTypeEnum.enumValues)[number];

// Users table - custom email/password authentication
export const users = pgTable("users", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
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
  businessType: businessTypeEnum("business_type").default("commercial"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Vendor profiles
export const vendorProfiles = pgTable("vendor_profiles", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid("user_id")
  .references(() => users.id, { onDelete: "cascade" })
  .notNull(),
  companyName: text("company_name"),
  title: text("title"),
  description: text("description"),
  location: text("location"),
  addressLine1: text("address_line_1"),
  addressLine2: text("address_line_2"),
  city: text("city"),
  state: text("state"),
  postalCode: text("postal_code"),
  hourlyRate: decimal("hourly_rate", { precision: 10, scale: 2 }),
  phone: text("phone"),
  responseTime: text("response_time"),
  yearsOfExperience: text("years_of_experience"),
  agenciesServed: text("agencies_served").array(),
  skills: text("skills").array(),
  categoryIds: uuid("category_ids").array(),
  avatar: text("avatar"),
  rating: decimal("rating", { precision: 3, scale: 2 }).default("0"),
  reviewCount: integer("review_count").default(0),
  isApproved: boolean("is_approved").default(false),
  // Enhanced vendor profile fields
  pastPerformance: jsonb("past_performance"),
  certifications: text("certifications").array(),
  availability: integer("availability").default(1),
  isFeatured: boolean("is_featured").default(false),
  // Vendor journey & monetization
  journeyStage: vendorJourneyStageEnum("journey_stage").default("application"),
  subscriptionTier: subscriptionTierEnum("subscription_tier").default("beta"),
  leadCreditsBalance: integer("lead_credits_balance").default(0),
  stripeCustomerId: text("stripe_customer_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),
  stripeAccountId: text("stripe_account_id"),
  stripeChargesEnabled: boolean("stripe_charges_enabled").default(false),
  stripePayoutsEnabled: boolean("stripe_payouts_enabled").default(false),
  stripeDetailsSubmitted: boolean("stripe_details_submitted").default(false),
  // Analytics
  profileViews: integer("profile_views").default(0),
  leadsReceived: integer("leads_received").default(0),
  leadsAccepted: integer("leads_accepted").default(0),
  totalEarnings: decimal("total_earnings", { precision: 10, scale: 2 }).default("0"),
  // --- PERFORMANCE METRICS ---
  totalRequests: integer("total_requests").default(0),
  completedRequests: integer("completed_requests").default(0),
  onTimeDeliveries: integer("on_time_deliveries").default(0),
  autoCompletedRequests: integer("auto_completed_requests").default(0),
  disputesLost: integer("disputes_lost").default(0),
  vendorScore: decimal("vendor_score", { precision: 5, scale: 2 }).default("0"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Services (what vendor offers)
export const services = pgTable("services", {
  id: uuid("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),

  vendorId: uuid("vendor_id")
  .references(() => users.id, { onDelete: "cascade" }),
  
  categoryId: uuid("category_id").references(() => categories.id, { onDelete: "cascade" }),

  name: text("title").notNull(),
  description: text("description").notNull(),

  pricingModel: text("pricing_model"),

  // ✅ Moved from service_tiers
  priceMin: decimal("price_min", { precision: 10, scale: 2 }),
  priceMax: decimal("price_max", { precision: 10, scale: 2 }),

  isActive: boolean("is_active").default(false),

  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const portfolios = pgTable("portfolios", {
  id: uuid("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),

  vendorId: uuid("vendor_id")
    .references(() => users.id)
    .notNull(),

  projectName: text("project_name").notNull(),
  industry: text("industry").notNull(),
  duration: text("duration").notNull(),
  description: text("description").notNull(),

  // Cost of project
  cost: decimal("cost", { precision: 10, scale: 2 }).notNull(),

  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),

  attachmentUrl: text("attachment_url"), // store uploaded file path or S3 URL

  isActive: boolean("is_active").default(false),

  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});
export const certificates = pgTable("certificates", {
  id: uuid("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),

  vendorId: uuid("vendor_id")
    .references(() => users.id) // assuming you have a users table
    .notNull(),

  certificateName: text("certificate_name").notNull(),
  receivedFrom: text("received_from").notNull(),
  yearReceived: integer("year_received").notNull(),

  // Optional: store uploaded image path
  imageUrl: text("image_url"),

  createdAt: timestamp("created_at").default(sql`now()`).notNull(),
});
export const serviceTiers = pgTable("service_tiers", {
  id: uuid("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),

  serviceId: uuid("service_id")
    .references(() => services.id, { onDelete: "cascade" })
    .notNull(),

  tier: serviceTierEnum("tier").notNull().default("free"),

  turnaround: text("turnaround"),

  priceMin: decimal("price_min", { precision: 10, scale: 2 }),
  priceMax: decimal("price_max", { precision: 10, scale: 2 }),

  outcomes: text("outcomes").array(),

  createdAt: timestamp("created_at").defaultNow(),
});

// service_requests
  export const serviceRequests = pgTable("service_requests", {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    contractorId: uuid("contractor_id").references(() => users.id).notNull(),
    vendorId: uuid("vendor_id").references(() => users.id, { onDelete: "set null" }),
    title: text("title"),
    serviceId: uuid("service_id").references(() => services.id, { onDelete: "cascade" }).notNull(),
    description: text("description").notNull(),
    categoryId: uuid("category_id").references(() => categories.id).notNull(),
    budget: text("budget"),
    // --------------------------
    // PRICING
    // --------------------------
    proposedPrice: decimal("proposed_price", { precision: 10, scale: 2 }).notNull(),
    finalPrice: decimal("final_price", { precision: 10, scale: 2 }),
    // --------------------------
    // STATUS
    // --------------------------
    status: serviceRequestStatusEnum("status").default("pending"),
    paymentStatus: paymentStatus("payment_status").default("payment_pending"),
    // --------------------------
    // DELIVERY / SLA
    // --------------------------
    deliveryDeadline: timestamp("delivery_deadline"),
    deliveredAt: timestamp("delivered_at"),
    completedAt: timestamp("completed_at"),
    // Fee fields
    platformFeeId: uuid("platform_fee_id").references(() => platformFee.id),
    platformFeeType: platformFeeTypeEnum("platform_fee_type"),
    platformFeeValue: integer("platform_fee_value"),
    platformFeeAmount: decimal("platform_fee_amount", {
      precision: 10,
      scale: 2,
    }),
    vendorEarning: decimal("vendor_earning", {
      precision: 10,
      scale: 2,
    }),
    
    aiAnalysis: text("ai_analysis"),
    estimatedCost: decimal("estimated_cost", { precision: 10, scale: 2 }),
    actualCost: decimal("actual_cost", { precision: 10, scale: 2 }),
    estimatedDuration: text("estimated_duration"),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  });
  export const escrows = pgTable("escrows", {
  id: uuid("id").defaultRandom().primaryKey(),

  serviceRequestId: uuid("service_request_id")
    .references(() => serviceRequests.id, { onDelete: "cascade" })
    .notNull(),
  contractorId: uuid("contractor_id").notNull(),
  vendorId: uuid("vendor_id").notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  platformFee: decimal("platform_fee", { precision: 10, scale: 2 }).notNull(),
  vendorEarning: decimal("vendor_earning", { precision: 10, scale: 2 }).notNull(),
  status: escrowStatusEnum("status").default("held").notNull(),
  heldAt: timestamp("held_at").defaultNow(),
  paymentIntentId: text("payment_intent_id"),
  chargeId: text("charge_id"),
  releasedAt: timestamp("released_at"),
  refundedAt: timestamp("refunded_at"),
});
  // deliveries
  export const deliveries = pgTable("deliveries", {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    serviceRequestId: uuid("service_request_id")
      .references(() => serviceRequests.id, { onDelete: "cascade" })
      .notNull(),
    deliveredBy: uuid("delivered_by")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    message: text("message").notNull(),
    version: integer("version").notNull().default(1),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  });
  // deliveryAttachments
  export const deliveryAttachments = pgTable("delivery_attachments", {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    deliveryId: uuid("delivery_id")
      .references(() => deliveries.id, { onDelete: "cascade" })
      .notNull(),
    filePath: text("file_path").notNull(),
    fileName: text("file_name").notNull(),
    fileSize: integer("file_size"),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  });

// Messages for contractor-vendor communication
export const messages = pgTable("messages", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  conversationId: uuid("conversation_id").references(() => conversations.id).notNull(),
  serviceRequestId: uuid("service_request_id").references(() => serviceRequests.id),
  senderId: uuid("sender_id").references(() => users.id).notNull(),
  receiverId: uuid("receiver_id").references(() => users.id).notNull(),
  content: text("content").notNull(),
  attachments: text("attachments").array(),
  isRead: boolean("is_read").default(false),
  messageType: messageTypeEnum("message_type").default("text").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const conversations = pgTable("conversations", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  contractorId: uuid("contractor_id") .references(() => users.id) .notNull(),
  vendorId: uuid("vendor_id").references(() => users.id).notNull(),
  serviceRequestId: uuid("service_request_id").references(() => serviceRequests.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Reviews and ratings
export const reviews = pgTable("reviews", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  serviceRequestId: uuid("service_request_id").references(() => serviceRequests.id).notNull(),
  reviewerId: uuid("reviewer_id").references(() => users.id).notNull(),
  revieweeId: uuid("reviewee_id").references(() => users.id).notNull(),
  rating: integer("rating").notNull(),
  comment: text("comment"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Payment transactions
export const transactions = pgTable("transactions", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  serviceRequestId: uuid("service_request_id").references(() => serviceRequests.id).notNull(),
  contractorId: uuid("contractor_id").references(() => users.id).notNull(),
  vendorId: uuid("vendor_id").references(() => users.id).notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  platformFee: decimal("platform_fee", { precision: 10, scale: 2 }),
  stripePaymentIntentId: text("stripe_payment_intent_id"),
  status: text("status").notNull().default("pending"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});
export const wallets = pgTable("wallets", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),

  userId: uuid("user_id")
    .references(() => users.id)
    .notNull(),

  balance: decimal("balance", { precision: 12, scale: 2 })
    .notNull()
    .default("0.00"),

  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});
export const walletTransactions = pgTable("wallet_transactions", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),

  walletId: uuid("wallet_id")
    .references(() => wallets.id)
    .notNull(),

  amount: decimal("amount", { precision: 12, scale: 2 })
    .notNull(),

  type: text("type").notNull(), 
  // credit | debit | commission | refund

  referenceId: uuid("reference_id"), // service_request_id

  createdAt: timestamp("created_at").defaultNow(),
});
export const processes = pgTable("processes", {
  id: uuid("id").primaryKey().defaultRandom(),
  key: text("key").notNull().unique(), // business_structure, business_strategy, execution
  title: text("title").notNull(),      // e.g., "Business Structure"
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
});

// 2️⃣ Stages table
export const stages = pgTable("stages", {
  id: uuid("id").primaryKey().defaultRandom(),
  processId: uuid("process_id").notNull(),  // FK to processes.id
  key: text("key").notNull(),               // startup, growth, scale
  title: text("title").notNull(),           // e.g., "Startup Foundation"
  createdAt: timestamp("created_at").defaultNow(),
});

// 3️⃣ Milestones table
export const milestones = pgTable("milestones", {
  id: uuid("id").primaryKey().defaultRandom(),
  stageId: uuid("stage_id").notNull(),
  key: text("key").notNull().unique(),
  title: text("title").notNull(),
  description: text("description"),
  required: boolean("required").default(false),
  resources: jsonb("resources").default(sql`'[]'::jsonb`),
  categoryId: uuid("category_id").references(() => categories.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow(),
});
// User maturity profiles - stores assessment results and progress
export const userMaturityProfiles = pgTable("user_maturity_profiles", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid("user_id").references(() => users.id).notNull().unique(),
  maturityStage: maturityStageEnum("maturity_stage").notNull(),
  readinessScore: integer("readiness_score").notNull(), // 0-100
  assessmentData: jsonb("assessment_data"), // Stores AI assessment Q&A
  currentFocus: coreProcessEnum("current_focus"), // Which process they're working on
  businessStructureProgress: integer("business_structure_progress").default(0), // 0-100%
  businessStrategyProgress: integer("business_strategy_progress").default(0),
  executionProgress: integer("execution_progress").default(0),
  subscriptionTier: subscriptionTierEnum("subscription_tier"),
  stripeCustomerId: text("stripe_customer_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),
  // --- CONTRACTOR PERFORMANCE ---
  contractorScore: decimal("contractor_score", { precision: 5, scale: 2 }).default("0"),
  disputesLost: integer("disputes_lost").default(0),
  autoCompletionPenalty: integer("auto_completion_penalty").default(0),
  gaps: jsonb("gaps"), // Identified gaps
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});
export const subscriptions = pgTable("subscriptions", {
  id: uuid("id").defaultRandom().primaryKey(),

  userId: uuid("user_id")
    .references(() => users.id, { onDelete: "cascade" }),

  stripeCustomerId: text("stripe_customer_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),

  status: text("status"),

  priceId: text("price_id"),
  planName: text("plan_name"),

  interval: text("interval"),
  amount: text("amount"),
  currency: text("currency"),

  currentPeriodStart: timestamp("current_period_start"),
  currentPeriodEnd: timestamp("current_period_end"),

  cancelAtPeriodEnd: boolean("cancel_at_period_end"),

  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Assessment history - tracks all assessments and retakes
export const assessments = pgTable("assessments", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid("user_id").references(() => users.id).notNull(),
  conversationHistory: jsonb("conversation_history").notNull(), // AI chat messages
  maturityStage: maturityStageEnum("maturity_stage").notNull(),
  readinessScore: integer("readiness_score").notNull(),
  aiAnalysis: text("ai_analysis"), // Summary of strengths/gaps
  recommendations: jsonb("recommendations"), // Suggested next steps
  gaps: jsonb("gaps"), // Identified gaps
  createdAt: timestamp("created_at").defaultNow(),
});

// Content library - playbooks, templates, guides, webinars
export const contentLibrary = pgTable("content_library", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
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
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid("user_id").references(() => users.id).notNull(),
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
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid("user_id").references(() => users.id).notNull(),
  contentId: uuid("content_id").references(() => contentLibrary.id).notNull(),
  viewCount: integer("view_count").default(1),
  lastViewedAt: timestamp("last_viewed_at").defaultNow(),
  isBookmarked: boolean("is_bookmarked").default(false),
  completionPercentage: integer("completion_percentage").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});
export const notificationTypeEnum = pgEnum("notification_type", [
  "request_submitted",
  "request_matched",
  "request_in_progress",
  "request_completed",
  "request_cancelled",
  "request_accepted",
  "new_message",
  "delivery",
  "new_review",
  "payment_update",
  "payment_created",
  "escrow_released",
  "dispute_opened",
  "dispute_resolved",
]);

export const notifications = pgTable("notifications", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),

  userId: uuid("user_id")
    .references(() => users.id)
    .notNull(),

  triggeredBy: uuid("triggered_by")
    .references(() => users.id),

  type: notificationTypeEnum("type").notNull(),

  title: text("title").notNull(),
  message: text("message").notNull(),

  relatedRequestId: uuid("related_request_id")
  .references(() => serviceRequests.id, { onDelete: "cascade" }),

  relatedMessageId: uuid("related_message_id")
    .references(() => messages.id, { onDelete: "cascade" }),

  isRead: boolean("is_read").default(false),

  createdAt: timestamp("created_at").defaultNow(),
});
export const disputes = pgTable("disputes", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),

  serviceRequestId: uuid("service_request_id")
    .references(() => serviceRequests.id)
    .notNull(),

  openedBy: uuid("opened_by")
    .references(() => users.id)
    .notNull(),

  reason: varchar("reason", { length: 255 }).notNull(),

  description: text("description"),

  status: varchar("status", { length: 20 })
    .notNull()
    .default("open"), // open | resolved

  resolution: varchar("resolution", { length: 30 }), 
  // vendor_won | contractor_won

  createdAt: timestamp("created_at").defaultNow(),

  resolvedAt: timestamp("resolved_at"),
});
export const insertNotificationSchema =
  createInsertSchema(notifications).omit({
    id: true,
    isRead: true,
    createdAt: true,
  });

export type InsertNotification =
  z.infer<typeof insertNotificationSchema>;

export const requestLogs = pgTable("request_logs", {
  id: uuid("id").defaultRandom().primaryKey(),
  serviceRequestId: uuid("service_request_id")
  .references(() => serviceRequests.id, { onDelete: "set null" }),
  action: varchar("action", { length: 100 }).notNull(), 
  // e.g. "STATUS_UPDATED", "DELIVERED", "COMPLETED"
  performedBy: uuid("performed_by")
    .references(() => users.id)
    .notNull(),
  previousStatus: varchar("previous_status", { length: 50 }),
  newStatus: varchar("new_status", { length: 50 }),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
export const vendorImports = pgTable("vendor_imports", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),

  fileName: text("file_name"),
  totalRecords: integer("total_records").default(0),
  processedRecords: integer("processed_records").default(0),
  successRecords: integer("success_records").default(0),
  failedRecords: integer("failed_records").default(0),

  status: text("status").default("pending"), // pending | processing | completed | failed
  progress: integer("progress").default(0),

  errors: jsonb("errors"), // [{ row, message }]

  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});
export const categories = pgTable("categories", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  key: text("key").unique(),
  description: text("description"),
  keyDeliverables: text("key_deliverables").array(),
  createdAt: timestamp("created_at").defaultNow(),
});
export const platformFee = pgTable("platform_fee", {
    id: uuid("id").defaultRandom().primaryKey(),
    type: platformFeeTypeEnum("type").notNull(),
    value: integer("value").default(0).notNull(), // e.g. 10 for 10% or 5 for $5
    isActive: boolean("is_active").default(true),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  }
);
export const supportTickets = pgTable("support_tickets", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id),
  subject: text("subject").notNull(),
  status: text("status").$type<"open" | "in_progress" | "resolved" | "closed">().default("open"),
  isReadByAdmin: boolean("is_read_by_admin").default(false),
  isReadByUser: boolean("is_read_by_user").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});
export const supportMessages = pgTable("support_messages", {
  id: uuid("id").primaryKey().defaultRandom(),
  ticketId: uuid("ticket_id").notNull().references(() => supportTickets.id),
  senderId: uuid("sender_id").notNull().references(() => users.id),
  message: text("message").notNull(),
  isRead: boolean("is_read").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});
export const insertPlatformFeeSchema =
  createInsertSchema(platformFee).omit({
    id: true,
    createdAt: true,
    updatedAt: true,
  });

export type InsertPlatformFee =
  z.infer<typeof insertPlatformFeeSchema>;

export type PlatformFee =
  typeof platformFee.$inferSelect;

// Relations

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
  }),
  sender: one(users, {
    fields: [notifications.triggeredBy],
    references: [users.id],
  }),
  request: one(serviceRequests, {
    fields: [notifications.relatedRequestId],
    references: [serviceRequests.id],
  }),
}));

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
  supportTickets: many(supportTickets),
  supportMessages: many(supportMessages),
}));

export const vendorProfilesRelations = relations(vendorProfiles, ({ one }) => ({
  user: one(users, {
    fields: [vendorProfiles.userId],
    references: [users.id],
  }),
}));
export const supportTicketsRelations = relations(
  supportTickets,
  ({ one, many }) => ({
    user: one(users, {
      fields: [supportTickets.userId],
      references: [users.id],
    }),

    messages: many(supportMessages),
  })
);
export const supportMessagesRelations = relations(
  supportMessages,
  ({ one }) => ({
    ticket: one(supportTickets, {
      fields: [supportMessages.ticketId],
      references: [supportTickets.id],
    }),

    sender: one(users, {
      fields: [supportMessages.senderId],
      references: [users.id],
    }),
  })
);
export const walletsRelations = relations(wallets, ({ one, many }) => ({
  user: one(users, {
    fields: [wallets.userId],
    references: [users.id],
  }),

  transactions: many(walletTransactions),
}));
export const walletTransactionsRelations = relations(
  walletTransactions,
  ({ one }) => ({
    wallet: one(wallets, {
      fields: [walletTransactions.walletId],
      references: [wallets.id],
    }),

    serviceRequests: one(serviceRequests, {
      fields: [walletTransactions.referenceId],
      references: [serviceRequests.id],
    }),
  })
);
export const serviceRelations = relations(services, ({ one }) => ({
  vendorProfile: one(vendorProfiles, {
    fields: [services.vendorId],
    references: [vendorProfiles.userId],
  }),
  categoryData: one(categories, {
    fields: [services.categoryId],
    references: [categories.id],
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
  vendorProfile: one(vendorProfiles, {
    fields: [serviceRequests.vendorId],
    references: [vendorProfiles.userId],
    relationName: "vendorProfileRequests",
  }),
  service: one(services, {
    fields: [serviceRequests.serviceId],
    references: [services.id],
  }),
  disputes: one(disputes, {
    fields: [serviceRequests.id],
    references: [disputes.serviceRequestId],
  }),
  escrow: one(escrows, {
    fields: [serviceRequests.id],
    references: [escrows.serviceRequestId],
  }),
  messages: many(messages),
  reviews: many(reviews),
  deliveries: many(deliveries),
  transactions: many(transactions),
}));
// Deliveries Relations
export const deliveriesRelations = relations(deliveries, ({ one, many }) => ({
  serviceRequest: one(serviceRequests, {
    fields: [deliveries.serviceRequestId],
    references: [serviceRequests.id],
  }),
  deliveredBy: one(users, {
    fields: [deliveries.deliveredBy],
    references: [users.id],
  }),
  attachments: many(deliveryAttachments, {
    relationName: "attachments",
  }),

}));

// Delivery Attachments Relations
export const deliveryAttachmentsRelations = relations(deliveryAttachments, ({ one }) => ({
  delivery: one(deliveries, {
    fields: [deliveryAttachments.deliveryId],
    references: [deliveries.id],
    relationName: "attachments",  // must match
  }),
}));
export const processesRelations = relations(processes, ({ one, many }) => ({
  // Each process can have multiple stages
  stages: many(stages),
}));

export const stagesRelations = relations(stages, ({ one, many }) => ({
  // Each stage belongs to one process
  process: one(processes, {
    fields: [stages.processId],
    references: [processes.id],
  }),

  // Each stage can have multiple milestones
  milestones: many(milestones),
}));

export const milestonesRelations = relations(milestones, ({ one }) => ({
  // Each milestone belongs to one stage
  stage: one(stages, {
    fields: [milestones.stageId],
    references: [stages.id],
  }),
}));
export const messagesRelations = relations(messages, ({ one }) => ({
   conversation: one(conversations, {
    fields: [messages.conversationId],
    references: [conversations.id],
    relationName: "conversationMessages",
  }),
  serviceRequest: one(serviceRequests, {
    fields: [messages.serviceRequestId],
    references: [serviceRequests.id],
  }),
  sender: one(users, {
    fields: [messages.senderId],
    references: [users.id],
  }),
  receiver: one(users, {
    fields: [messages.receiverId],
    references: [users.id],
  }),
}));
export const conversationsRelations = relations(
  conversations,
  ({ one, many }) => ({
    vendor: one(users, {
      fields: [conversations.vendorId],
      references: [users.id],
    }),

    contractor: one(users, {
      fields: [conversations.contractorId],
      references: [users.id],
    }),

    messages: many(messages),
  })
);

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
  businessType: z.enum(["commercial", "government", "both"]).optional(),
});
export const insertSubscriptionSchema = createInsertSchema(subscriptions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  userId: z.string().uuid(),

  stripeCustomerId: z.string().nullable().optional(),
  stripeSubscriptionId: z.string().nullable().optional(),

  status: z.string(),

  priceId: z.string().nullable().optional(),
  productId: z.string().nullable().optional(),

  planName: z.string().nullable().optional(),

  amount: z.string().nullable().optional(),
  currency: z.string().nullable().optional(),

  interval: z.string().nullable().optional(),

  currentPeriodStart: z.date().nullable().optional(),
  currentPeriodEnd: z.date().nullable().optional(),

  cancelAtPeriodEnd: z.boolean().optional(),
});
export const insertVendorProfileSchema = createInsertSchema(vendorProfiles).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  rating: true,
  phone: true,
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
export const servicesRelations = relations(services, ({ many }) => ({
  tiers: many(serviceTiers),
}));
export const serviceTiersRelations = relations(serviceTiers, ({ one }) => ({
  service: one(services, {
    fields: [serviceTiers.serviceId],
    references: [services.id],
  }),
}));
export const milestoneRelations = relations(milestones, ({ one }) => ({
  category: one(categories, {
    fields: [milestones.categoryId],
    references: [categories.id],
  }),
}));
// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertSubscription = z.infer<typeof insertSubscriptionSchema>;
export type User = typeof users.$inferSelect;
export type Service = typeof services.$inferSelect;
export type Milestone = typeof milestones.$inferSelect;
export type UpsertUser = typeof users.$inferInsert; // For Replit Auth
export type InsertVendorProfile = z.infer<typeof insertVendorProfileSchema>;
export type VendorProfile = typeof vendorProfiles.$inferSelect;
export type Portfolio = typeof portfolios.$inferSelect;
export type Certificate = typeof certificates.$inferSelect;
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

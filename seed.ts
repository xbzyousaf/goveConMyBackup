import "dotenv/config";
import { db } from "./server/db";
import { users, wallets, processes, stages, milestones } from "./shared/schema";
import { AuthService } from "./server/auth";
import { and, eq } from "drizzle-orm";
import type { InferInsertModel } from "drizzle-orm";

type UserInsert = InferInsertModel<typeof users>;
type ProcessInsert = InferInsertModel<typeof processes>;
type StageInsert = InferInsertModel<typeof stages>;
type MilestoneInsert = InferInsertModel<typeof milestones>;

const PROCESS_CONFIG = {
  business_structure: {
    label: "Business Structure",
    description: "Establish your foundation, compliance, and certifications",
    color: "bg-blue-500",
    stages: {
      startup: {
        label: "Startup Foundation",
        milestones: [
          {
            id: "ein",
            title: "Obtain Employer Identification Number (EIN)",
            description: "Get your EIN from the IRS for tax purposes and business identity",
            required: true,
            resources: [
              { title: "IRS EIN Application", url: "https://www.irs.gov/businesses/small-businesses-self-employed/apply-for-an-employer-identification-number-ein-online", type: 'external' as const },
            ],
          },
          {
            id: "business_bank",
            title: "Open Business Bank Account",
            description: "Separate business and personal finances with a dedicated account",
            required: true,
            resources: [],
          },
          {
            id: "sam_gov",
            title: "Register in SAM.gov",
            description: "Required for all federal government contractors to receive awards",
            required: true,
            resources: [
              { title: "SAM.gov Registration Guide", url: "https://sam.gov", type: 'external' as const },
            ],
          },
          {
            id: "cage_code",
            title: "Obtain CAGE Code",
            description: "Commercial and Government Entity code for identification",
            required: true,
            resources: [],
          },
          {
            id: "business_structure",
            title: "Formalize Legal Business Structure",
            description: "LLC, S-Corp, or C-Corp - choose the right entity type",
            required: true,
            resources: [],
          },
          {
            id: "insurance",
            title: "Get General Liability Insurance",
            description: "Protect your business with appropriate coverage",
            required: false,
            resources: [],
          },
          {
            id: "accounting",
            title: "Set Up Accounting System",
            description: "QuickBooks or similar for tracking revenue and expenses",
            required: true,
            resources: [],
          },
        ],
      },
      growth: {
        label: "Growth Compliance",
        milestones: [
          {
            id: "small_business_cert",
            title: "Small Business Certification",
            description: "Get certified as a small business through SBA",
            required: true,
            resources: [],
          },
          {
            id: "set_aside_certs",
            title: "Explore Set-Aside Certifications",
            description: "8(a), HUBZone, WOSB, VOSB, SDVOSB certifications",
            required: false,
            resources: [],
          },
          {
            id: "accounting_system",
            title: "Implement Job Cost Accounting",
            description: "Track costs by project for accurate pricing and compliance",
            required: true,
            resources: [],
          },
          {
            id: "quality_system",
            title: "Develop Quality Management System",
            description: "Document processes and quality controls",
            required: false,
            resources: [],
          },
          {
            id: "cybersecurity",
            title: "Implement Basic Cybersecurity Controls",
            description: "NIST 800-171 basics for handling CUI",
            required: true,
            resources: [],
          },
        ],
      },
      scale: {
        label: "Scale Optimization",
        milestones: [
          {
            id: "iso_cert",
            title: "Pursue ISO Certifications",
            description: "ISO 9001, 27001, or industry-specific certifications",
            required: false,
            resources: [],
          },
          {
            id: "cmmc",
            title: "Achieve CMMC Certification",
            description: "Cybersecurity Maturity Model Certification for DoD work",
            required: false,
            resources: [],
          },
          {
            id: "erp_system",
            title: "Implement Enterprise Resource Planning (ERP)",
            description: "Integrated system for finance, HR, and operations",
            required: false,
            resources: [],
          },
          {
            id: "compliance_team",
            title: "Build Compliance Team",
            description: "Dedicated staff for regulatory and contract compliance",
            required: true,
            resources: [],
          },
        ],
      },
    },
  },
  business_strategy: {
    label: "Business Strategy",
    description: "Define your market position and growth strategy",
    color: "bg-purple-500",
    stages: {
      startup: {
        label: "Strategy Foundation",
        milestones: [
          {
            id: "solution_definition",
            title: "Define Your Solution/Service",
            description: "Clearly articulate what you offer and its value proposition",
            required: true,
            resources: [],
          },
          {
            id: "target_market",
            title: "Identify Target Agencies",
            description: "Research which agencies need your solution",
            required: true,
            resources: [],
          },
          {
            id: "capability_statement",
            title: "Create Capability Statement",
            description: "One-page overview of your business capabilities",
            required: true,
            resources: [],
          },
          {
            id: "pricing_strategy",
            title: "Develop Pricing Strategy",
            description: "Research rates and establish competitive pricing",
            required: true,
            resources: [],
          },
        ],
      },
      growth: {
        label: "Strategic Positioning",
        milestones: [
          {
            id: "naics_analysis",
            title: "Analyze NAICS Code Opportunities",
            description: "Understand spending patterns in your codes",
            required: true,
            resources: [],
          },
          {
            id: "partnership_strategy",
            title: "Develop Teaming Strategy",
            description: "Build relationships with complementary firms",
            required: true,
            resources: [],
          },
          {
            id: "past_performance",
            title: "Document Past Performance",
            description: "Compile case studies and references",
            required: true,
            resources: [],
          },
          {
            id: "marketing_plan",
            title: "Create GovCon Marketing Plan",
            description: "Outreach strategy for agencies and primes",
            required: true,
            resources: [],
          },
        ],
      },
      scale: {
        label: "Strategic Excellence",
        milestones: [
          {
            id: "competitive_intel",
            title: "Build Competitive Intelligence System",
            description: "Track competitors and market dynamics",
            required: true,
            resources: [],
          },
          {
            id: "advisory_board",
            title: "Establish Advisory Board",
            description: "Industry experts to guide strategic decisions",
            required: false,
            resources: [],
          },
          {
            id: "multi_year_strategy",
            title: "Develop 3-5 Year Strategic Plan",
            description: "Long-term vision with measurable goals",
            required: true,
            resources: [],
          },
        ],
      },
    },
  },
  execution: {
    label: "Execution",
    description: "Win contracts and deliver excellence",
    color: "bg-green-500",
    stages: {
      startup: {
        label: "First Wins",
        milestones: [
          {
            id: "sam_search",
            title: "Learn to Search SAM.gov",
            description: "Master finding opportunities on SAM.gov",
            required: true,
            resources: [],
          },
          {
            id: "rfi_response",
            title: "Respond to First RFI",
            description: "Request for Information - low-risk practice",
            required: true,
            resources: [],
          },
          {
            id: "quote_submission",
            title: "Submit Micro-Purchase Quote",
            description: "Sub-$10k opportunities for practice",
            required: true,
            resources: [],
          },
          {
            id: "proposal_basics",
            title: "Learn Proposal Basics",
            description: "Understanding RFP structure and compliance matrix",
            required: true,
            resources: [],
          },
        ],
      },
      growth: {
        label: "Winning Consistently",
        milestones: [
          {
            id: "proposal_process",
            title: "Establish Proposal Process",
            description: "Repeatable system for responding to RFPs",
            required: true,
            resources: [],
          },
          {
            id: "price_to_win",
            title: "Master Price-to-Win Analysis",
            description: "Competitive pricing strategies",
            required: true,
            resources: [],
          },
          {
            id: "subcontractor_mgmt",
            title: "Build Subcontractor Network",
            description: "Reliable partners for teaming and fulfillment",
            required: true,
            resources: [],
          },
          {
            id: "contract_delivery",
            title: "Deliver First Major Contract",
            description: "Successfully execute >$100k contract",
            required: true,
            resources: [],
          },
        ],
      },
      scale: {
        label: "Strategic Capture",
        milestones: [
          {
            id: "capture_process",
            title: "Implement Capture Management",
            description: "Strategic pursuit of large opportunities",
            required: true,
            resources: [],
          },
          {
            id: "color_teams",
            title: "Run Color Team Reviews",
            description: "Pink, Red, Gold team proposal reviews",
            required: true,
            resources: [],
          },
          {
            id: "idiq_contract",
            title: "Win IDIQ Contract",
            description: "Indefinite Delivery, Indefinite Quantity vehicle",
            required: false,
            resources: [],
          },
          {
            id: "program_management",
            title: "Establish PMO",
            description: "Project Management Office for delivery excellence",
            required: true,
            resources: [],
          },
        ],
      },
    },
  },
};

async function seed() {
  const passwordHash = await AuthService.hashPassword("11223344");

  // --- 1️⃣ Seed Users & Wallets ---
  const seedUsers: UserInsert[] = [
    { email: "admin@gmail.com", firstName: "Super", lastName: "Admin", password: passwordHash, userType: "admin", isEmailVerified: true },
    { email: "vendor@gmail.com", firstName: "Vendor", lastName: "1", password: passwordHash, userType: "vendor", isEmailVerified: true },
    { email: "contractor@gmail.com", firstName: "Contractor", lastName: "1", password: passwordHash, userType: "contractor", isEmailVerified: true },
  ];

  for (const user of seedUsers) {
    const existing = await db.select().from(users).where(eq(users.email, user.email!));
    let userId: string;

    if (existing.length) {
      console.log(`⚠️ Skipping ${user.email}`);
      userId = existing[0].id;
    } else {
      const inserted = await db.insert(users).values(user).returning();
      userId = inserted[0].id;
      console.log(`✅ Created ${user.userType}: ${user.email}`);
    }

    const existingWallet = await db.select().from(wallets).where(eq(wallets.userId, userId));
    if (!existingWallet.length) {
      await db.insert(wallets).values({ userId, balance: "100000.00" });
      console.log(`💰 Wallet created for ${user.email}`);
    }
  }

  // --- 2️⃣ Seed Processes, Stages, and Milestones ---
  for (const [processKey, processConfig] of Object.entries(PROCESS_CONFIG)) {
    // 2a️⃣ Insert Process
    let processId: string;
    const existingProcess = await db.select().from(processes).where(eq(processes.key, processKey));
    if (existingProcess.length) {
      processId = existingProcess[0].id;
      console.log(`⚠️ Skipping existing process: ${processConfig.label}`);
    } else {
      const insertedProcess = await db.insert(processes).values({
        key: processKey,
        title: processConfig.label,
        description: processConfig.description,
      }).returning();
      processId = insertedProcess[0].id;
      console.log(`📂 Process created: ${processConfig.label}`);
    }

    // 2b️⃣ Insert Stages
    for (const [stageKey, stageConfig] of Object.entries(processConfig.stages)) {
      let stageId: string;
      const existingStage = await db
  .select()
  .from(stages)
  .where(
    and(
      eq(stages.key, stageKey),
      eq(stages.processId, processId)
    )
  );
      if (existingStage.length) {
        stageId = existingStage[0].id;
        console.log(`⚠️ Skipping existing stage: ${stageConfig.label}`);
      } else {
        const insertedStage = await db.insert(stages).values({
          processId,
          key: stageKey,
          title: stageConfig.label,
        }).returning();
        stageId = insertedStage[0].id;
        console.log(`🗂 Stage created: ${stageConfig.label}`);
      }

      // 2c️⃣ Insert Milestones
      for (const milestone of stageConfig.milestones) {
        const existingMilestone = await db.select().from(milestones).where(eq(milestones.key, milestone.id));
        if (!existingMilestone.length) {
          await db.insert(milestones).values({
            stageId,
            key: milestone.id,
            title: milestone.title,
            description: milestone.description,
            required: milestone.required,
            resources: milestone.resources || []
          });
          console.log(`📌 Milestone created: ${milestone.title}`);
        } else {
          console.log(`⚠️ Skipping existing milestone: ${milestone.title}`);
        }
      }
    }
  }
}

seed()
  .catch(console.error)
  .finally(() => process.exit(0));
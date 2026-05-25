import "dotenv/config";
import { db } from "./server/db";
import { users, wallets, processes, stages, milestones, categories, platformFee } from "./shared/schema";
import { AuthService } from "./server/auth";
import { and, eq } from "drizzle-orm";
import type { InferInsertModel } from "drizzle-orm";

type UserInsert = InferInsertModel<typeof users>;
type feesInsert = InferInsertModel<typeof platformFee>;
type ProcessInsert = InferInsertModel<typeof processes>;
type StageInsert = InferInsertModel<typeof stages>;
type MilestoneInsert = InferInsertModel<typeof milestones>;

const PROCESS_CONFIG = {
  business_structure: {
    label: "Structure",
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
            categoryKey: "legal",
            resources: [
              { title: "IRS EIN Application", url: "https://www.irs.gov/businesses/small-businesses-self-employed/apply-for-an-employer-identification-number-ein-online", type: 'external' as const },
            ],
          },
          {
            id: "business_bank",
            title: "Open Business Bank Account",
            description: "Separate business and personal finances with a dedicated account",
            required: true,
            categoryKey: "finance",
            resources: [],
          },
          {
            id: "sam_gov",
            title: "Register in SAM.gov",
            description: "Required for all federal government contractors to receive awards",
            required: true,
            categoryKey: "legal",
            resources: [
              { title: "SAM.gov Registration Guide", url: "https://sam.gov", type: 'external' as const },
            ],
          },
          {
            id: "cage_code",
            title: "Obtain CAGE Code",
            description: "Commercial and Government Entity code for identification",
            required: true,
            categoryKey: "legal",
            resources: [],
          },
          {
            id: "business_structure",
            title: "Formalize Legal Business Structure",
            description: "LLC, S-Corp, or C-Corp - choose the right entity type",
            required: true,
            categoryKey: "legal",
            resources: [],
          },
          {
            id: "insurance",
            title: "Get General Liability Insurance",
            description: "Protect your business with appropriate coverage",
            required: false,
            categoryKey: "insurance",
            resources: [],
          },
          {
            id: "accounting",
            title: "Set Up Accounting System",
            description: "QuickBooks or similar for tracking revenue and expenses",
            required: true,
            categoryKey: "finance",
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
            categoryKey: "legal",
            resources: [],
          },
          {
            id: "set_aside_certs",
            title: "Explore Set-Aside Certifications",
            description: "8(a), HUBZone, WOSB, VOSB, SDVOSB certifications",
            required: false,
            categoryKey: "legal",
            resources: [],
          },
          {
            id: "accounting_system",
            title: "Implement Job Cost Accounting",
            description: "Track costs by project for accurate pricing and compliance",
            required: true,
            categoryKey: "finance",
            resources: [],
          },
          {
            id: "quality_system",
            title: "Develop Quality Management System",
            description: "Document processes and quality controls",
            required: false,
            categoryKey: "legal",
            resources: [],
          },
          {
            id: "cybersecurity",
            title: "Implement Basic Cybersecurity Controls",
            description: "NIST 800-171 basics for handling CUI",
            required: true,
            categoryKey: "cybersecurity",
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
            categoryKey: "legal",
            resources: [],
          },
          {
            id: "cmmc",
            title: "Achieve CMMC Certification",
            description: "Cybersecurity Maturity Model Certification for DoD work",
            required: false,
            categoryKey: "legal",
            resources: [],
          },
          {
            id: "erp_system",
            title: "Implement Enterprise Resource Planning (ERP)",
            description: "Integrated system for finance, HR, and operations",
            required: false,
            categoryKey: "legal",
            resources: [],
          },
          {
            id: "compliance_team",
            title: "Build Compliance Team",
            description: "Dedicated staff for regulatory and contract compliance",
            required: true,
            categoryKey: "legal",
            resources: [],
          },
        ],
      },
    },
  },
  business_strategy: {
    label: "Strategy",
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
            categoryKey: "marketing",
            resources: [],
          },
          {
            id: "target_market",
            title: "Identify Target Agencies",
            description: "Research which agencies need your solution",
            required: true,
            categoryKey: "business_tools",
            resources: [],
          },
          {
            id: "capability_statement",
            title: "Create Capability Statement",
            description: "One-page overview of your business capabilities",
            required: true,
            categoryKey: "marketing",
            resources: [],
          },
          {
            id: "pricing_strategy",
            title: "Develop Pricing Strategy",
            description: "Research rates and establish competitive pricing",
            required: true,
            categoryKey: "finance",
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
            categoryKey: "business_tools",
            resources: [],
          },
          {
            id: "partnership_strategy",
            title: "Develop Teaming Strategy",
            description: "Build relationships with complementary firms",
            required: true,
            categoryKey: "business_tools",
            resources: [],
          },
          {
            id: "past_performance",
            title: "Document Past Performance",
            description: "Compile case studies and references",
            required: true,
            categoryKey: "marketing",
            resources: [],
          },
          {
            id: "marketing_plan",
            title: "Create PROOF Marketing Plan",
            description: "Outreach strategy for agencies and primes",
            required: true,
            categoryKey: "marketing",
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
            categoryKey: "business_tools",
            resources: [],
          },
          {
            id: "advisory_board",
            title: "Establish Advisory Board",
            description: "Industry experts to guide strategic decisions",
            required: false,
            categoryKey: "business_tools",
            resources: [],
          },
          {
            id: "multi_year_strategy",
            title: "Develop 3-5 Year Strategic Plan",
            description: "Long-term vision with measurable goals",
            required: true,
            categoryKey: "legal",
            resources: [],
          },
        ],
      },
    },
  },
  execution: {
    label: "Scale",
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
            categoryKey: "business_tools",
            resources: [],
          },
          {
            id: "rfi_response",
            title: "Respond to First RFI",
            description: "Request for Information - low-risk practice",
            required: true,
            categoryKey: "marketing",
            resources: [],
          },
          {
            id: "quote_submission",
            title: "Submit Micro-Purchase Quote",
            description: "Sub-$10k opportunities for practice",
            required: true,
            categoryKey: "business_tools",
            resources: [],
          },
          {
            id: "proposal_basics",
            title: "Learn Proposal Basics",
            description: "Understanding RFP structure and compliance matrix",
            required: true,
            categoryKey: "marketing",
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
            categoryKey: "marketing",
            resources: [],
          },
          {
            id: "price_to_win",
            title: "Master Price-to-Win Analysis",
            description: "Competitive pricing strategies",
            required: true,
            categoryKey: "finance",
            resources: [],
          },
          {
            id: "subcontractor_mgmt",
            title: "Build Subcontractor Network",
            description: "Reliable partners for teaming and fulfillment",
            required: true,
            categoryKey: "business_tools",
            resources: [],
          },
          {
            id: "contract_delivery",
            title: "Deliver First Major Contract",
            description: "Successfully execute >$100k contract",
            required: true,
            categoryKey: "business_tools",
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
            categoryKey: "business_tools",
            resources: [],
          },
          {
            id: "color_teams",
            title: "Run Color Team Reviews",
            description: "Pink, Red, Gold team proposal reviews",
            required: true,
            categoryKey: "marketing",
            resources: [],
          },
          {
            id: "idiq_contract",
            title: "Win IDIQ Contract",
            description: "Indefinite Delivery, Indefinite Quantity vehicle",
            required: false,
            categoryKey: "business_tools",
            resources: [],
          },
          {
            id: "program_management",
            title: "Establish PMO",
            description: "Project Management Office for delivery excellence",
            required: true,
            categoryKey: "business_tools",
            resources: [],
          },
        ],
      },
    },
  },
};
const CATEGORY_SEED = [
  {
    key: "legal",
    name: "Legal & Compliance",
    description:
      'Establish a "bulletproof" corporate foundation. This service guides you through legal entity formation, operating agreements, and the mandatory federal registrations (SAM, CAGE, UEI) required to receive government payments.',
    keyDeliverables: [
      "Entity Structuring",
      "Operating Agreements",
      "SAM/CAGE Registration",
      "8(a)/HUBZone Certification Eligibility",
    ],
  },
  {
    key: "finance",
    name: "Finance & Accounting",
    description:
      'Transition from basic bookkeeping to "audit-ready" PROOF accounting. These specialists help you implement DCAA-compliant systems and cost-allocation strategies necessary for winning lucrative Cost-Plus and T&M contracts.',
    keyDeliverables: [
      "DCAA Compliance Setup",
      "Chart of Accounts Design",
      "Indirect Rate Calculation",
      "Monthly Financial Oversight",
    ],
  },
  {
    key: "insurance",
    name: "Insurance",
    description:
      "Protect your business from the unique risks of federal contracting. Most government solicitations require proof of specific coverages like Professional Liability (E&O) or Cyber Insurance before an award can be finalized.",
    keyDeliverables: [
      "General Liability",
      "Errors & Omissions (E&O)",
      "Workers’ Comp",
      "Cyber Liability",
    ],
  },
  {
    key: "marketing",
    name: "Marketing & Branding",
    description:
      'Your "digital storefront" for Contracting Officers. These experts help you craft a powerful Capability Statement and a professional online presence that clearly articulates your Past Performance and "Value Add" to the government.',
    keyDeliverables: [
      "Capability Statement Design",
      "PROOF-Focused Website",
      "Brand Messaging",
      "Social Proof & Portfolio Development",
    ],
  },
  {
    key: "cybersecurity",
    name: "IT and Security (CMMC/NIST)",
    description:
      "Secure your data to secure your contracts. With mandatory NIST 800-171 and CMMC requirements, these providers ensure your technology infrastructure meets the strict security standards required to handle government information.",
    keyDeliverables: [
      "CMMC Readiness Assessment",
      "NIST 800-171 Compliance",
      "Managed Security Services",
      "Secure Cloud Hosting",
    ],
  },
  {
    key: "hr",
    name: "HR & Talent",
    description:
      "Scale your team with compliance and speed. From Service Contract Act (SCA) wage determinations to finding specialized cleared personnel, these services ensure your workforce management meets federal labor laws.",
    keyDeliverables: [
      "Compliant Employee Handbooks",
      "SCA/Davis-Bacon Guidance",
      "Recruiting for Cleared Talent",
      "Compensation Benchmarking",
    ],
  },
  {
    key: "business_tools",
    name: "Business Tools",
    description:
      "Automate your growth with specialized PROOF software. These tools streamline capture management, GSA Schedule maintenance, and pipeline tracking so you can spend less time on admin and more time winning.",
    keyDeliverables: [
      "PROOF-specific CRM",
      "GSA Schedule Management Tools",
      "Opportunity Tracking Software",
      "Contract Management Systems",
    ],
  },
];

async function seed() {
  const passwordHash = await AuthService.hashPassword("11223344");

  // --- 1️⃣ Seed Users & Wallets ---
  const seedUsers: UserInsert[] = [
    { email: "admin@gmail.com", firstName: "Super", lastName: "Admin", password: passwordHash, userType: "admin", isEmailVerified: true },
    { email: "vendor@gmail.com", firstName: "Vendor", lastName: "1", password: passwordHash, userType: "vendor", isEmailVerified: true },
    { email: "contractor@gmail.com", firstName: "Contractor", lastName: "1", password: passwordHash, userType: "contractor", isEmailVerified: true },
  ];
   const seedFees: feesInsert[] = [
    { type: "percentage", value: 20, isActive: true},
  ];
  // --- Seed Platform Fees ---
for (const fee of seedFees) {
  const existingFee = await db
    .select()
    .from(platformFee)
    .where(
      and(
        eq(platformFee.type, fee.type),
        eq(platformFee.value, fee.value)
      )
    );

  if (existingFee.length) {
    console.log(
      `⚠️ Skipping fee: ${fee.type} ${fee.value}`
    );
  } else {
    await db.insert(platformFee).values({
      type: fee.type,
      value: fee.value,
      isActive: fee.isActive,
    });

    console.log(
      `💵 Platform fee created: ${fee.type} ${fee.value}`
    );
  }
}
  // --- 3️⃣ Seed Categories ---
for (const cat of CATEGORY_SEED) {
  const existing = await db
    .select()
    .from(categories)
    .where(eq(categories.key, cat.key));

  if (existing.length) {
    console.log(`⚠️ Skipping category: ${cat.name}`);
    continue;
  }

  await db.insert(categories).values({
    key: cat.key,
    name: cat.name,
    description: cat.description,
    keyDeliverables: cat.keyDeliverables,
  });

  console.log(`📁 Category created: ${cat.name}`);
}

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
  const allCategories = await db.select().from(categories);

      const categoryMap = Object.fromEntries(
        allCategories.map(c => [c.key, c.id])
      );
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
          const categoryId = categoryMap[milestone.categoryKey]; // 👈 ADD THIS LINE

          if (!categoryId) {
            console.error(`❌ Category not found for key: ${milestone.categoryKey}`);
            continue; // skip this milestone
          }
          await db.insert(milestones).values({
            stageId,
            key: milestone.id,
            title: milestone.title,
            description: milestone.description,
            required: milestone.required,
            resources: milestone.resources || [],
            categoryId: categoryId,
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
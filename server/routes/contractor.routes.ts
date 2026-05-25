import { Router } from "express";
import { isAuthenticated } from "../middleware/auth.middleware";
import { getUserId } from "../utills/auth.util";
import { storage } from "../storage";
import { upload } from "../utills/upload.util";
import OpenAI from "openai";
import { stripe } from "../lib/stripe";
import { Gap, GapType } from '../../shared/types/gaps';
import { z } from "zod";
import { isContractor } from "../middleware/contractor.middleware";
import { SERVICE_CATEGORIES } from "../../shared/types/service";
import { calculatePlatformFee } from "server/services/platformFeeService";

const router = Router();
if (!process.env.OPENAI_API_KEY) {
  throw new Error("OPENAI_API_KEY is missing");
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});
// Helper function to get milestone count for a process/stage combination
function getMilestoneCountForProcess(process: string, stage: string): number {
  // Milestone counts per process and stage
  const counts: Record<string, Record<string, number>> = {
    business_structure: {
      startup: 7,
      growth: 5,
      scale: 4,
    },
    business_strategy: {
      startup: 4,
      growth: 4,
      scale: 3,
    },
    execution: {
      startup: 4,
      growth: 4,
      scale: 4,
    },
  };
  
  return counts[process]?.[stage] || 0;
}

 router.get("/marketplace/services", isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      let profile = await storage.getUserMaturityProfile(userId);
      
      const stage = profile?.maturityStage ?? '';

      if (!stage) {
        return res.status(400).json({ message: "Stage is required" });
      }
      const page = Number(req.query.page) || 1;
      const limit = Number(req.query.limit) || 10;
      const offset = (page - 1) * limit;
      const services = await storage.getMarketplaceServicesByStage(stage, limit, offset);
      const total = await storage.countMarketplaceServices();
      res.json({
        data: services || [],
        page,
        limit,
        total
      });
    } catch (error) {
      if (error instanceof Error) {
        return res.status(400).json({
          message: error.message
        });
      }

      res.status(500).json({
        message: "Internal server error"
      });
    }
  });
router.post('/service-requests', isAuthenticated, isContractor, async (req: any, res) => {
    try {
    const contractorId = getUserId(req);
    if (!contractorId) {
        return res.status(401).json({ message: "Not authenticated" });
    }
    const { vendorId, serviceId, categoryId} = req.body;
    const service = await storage.getService(serviceId);
    if (!service) {
        return res.status(404).json({ message: "Service not found" });
    }
    const proposedPrice = "0.00";
    // const existing =
    //   await storage.findServiceRequestByContractorVendorService({
    //     contractorId,
    //     vendorId,
    //     serviceId,
    //   });

    // if (existing) {
    //   return res.status(409).json({
    //     message: "You have already requested this service from this vendor",
    //     requestId: existing.id,
    //   });
    // }
    const serviceRequest = await storage.createServiceRequest({
        ...req.body,
        contractorId,
        vendorId,
        serviceId,
        proposedPrice,
        categoryId: service.categoryId ?? categoryId,
        status: "pending",
        paymentStatus: "payment_pending",
    });

    const existingRequest = await storage.getServiceRequest(serviceRequest?.id);
    await storage.createRequestLog({
        serviceRequestId: serviceRequest.id,
        action: "SERVICE REQUEST CREATED",
        performedBy: contractorId,
        previousStatus: serviceRequest.status ?? 'pending',
        newStatus: "pending",
        metadata: {
        vendorName: existingRequest?.vendor
        ? `${existingRequest.vendor.firstName} ${existingRequest.vendor.lastName ?? ""} (${existingRequest.vendor.id})`.trim()
        : "Vendor",
        contractorName: existingRequest?.contractor
        ? `${existingRequest.contractor.firstName} ${existingRequest.contractor.lastName ?? ""} (${existingRequest.contractor.id})`.trim()
        : "contractor",
        serviceTitle: existingRequest?.service?.name ?? 'Service Title',
        // requestTitle: existingRequest?.title ?? 'Request Title'
        }
    })
    await storage.createNotification({
        userId: vendorId, // receiver (vendor)
        triggeredBy: contractorId, // sender (contractor)
        title: "New Service Request",
        message: "You have received a new service request",
        type: "request_submitted", // use correct type
        relatedRequestId: serviceRequest.id,
    });
    res.json(serviceRequest);
    }catch (error) {
    console.error("CREATE SERVICE REQUEST FAILED");

    if (error instanceof Error) {
        console.error(error.message);
        return res.status(400).json({
        message: error.message
        });
    }

    res.status(500).json({
        message: "Internal server error"
    });
    }

});
router.post("/service-requests/:id/pay", isAuthenticated,isContractor, async (req, res) => {
  try {
    const contractorId = getUserId(req);
    const { id } = req.params;
    const { paymentIntentId } = req.body;

    // 🔒 Validate input
    if (!paymentIntentId) {
      return res.status(400).json({
        message: "Missing paymentIntentId",
      });
    }

    // 🔒 Prevent duplicate escrow
    const existingEscrow = await storage.getEscrowByRequestId(id);
    if (existingEscrow) {
      return res.status(400).json({
        message: "Escrow already exists",
      });
    }

    // 🔄 Retrieve PaymentIntent with retry (for charge availability)
    let finalPI: any = null;
    let chargeId: string | null = null;

    for (let i = 0; i < 5; i++) {
      const pi = await stripe.paymentIntents.retrieve(paymentIntentId, {
        expand: ["latest_charge", "charges"],
      });

      // ✅ Extract chargeId safely
      chargeId =
        typeof pi.latest_charge === "string"
          ? pi.latest_charge
          : pi.latest_charge?.id ?? null;

      if (!chargeId && pi.charges?.data?.length > 0) {
        chargeId = pi.charges.data[0].id;
      }

      // ✅ Check success + charge ready
      if (pi.status === "succeeded" && chargeId) {
        finalPI = pi;
        break;
      }

      await new Promise((r) => setTimeout(r, 1500));
    }

    if (!finalPI || !chargeId) {
      throw new Error("Payment not fully processed yet. Try again.");
    }

    // 🔍 Fetch request
    const request = await storage.getServiceRequest(id);

    if (!request) {
      return res.status(404).json({ message: "Request not found" });
    }

    if (request.status !== "accepted") {
      return res.status(400).json({
        message: "Invalid state for payment",
      });
    }

    if (request.contractorId !== contractorId) {
      return res.status(403).json({
        message: "Unauthorized",
      });
    }

    if (request.paymentStatus === "escrow_held") {
      return res.status(400).json({
        message: "Escrow already funded",
      });
    }

    // 💰 Validate amount
    const finalPrice = Number(request.proposedPrice) ?? 0;

    if (finalPI.amount !== Math.round(finalPrice * 100)) {
      return res.status(400).json({
        message: "Payment amount mismatch",
      });
    }

    if (finalPI.currency !== "usd") {
      throw new Error("Invalid currency");
    }

    // 💰 Calculate split
    const feeData = await calculatePlatformFee(finalPrice);

    // 🧾 Create escrow
    await storage.createEscrow({
      serviceRequestId: id,
      contractorId,
      vendorId: request.vendorId,
      amount: finalPrice.toString(),
      platformFee: feeData.platformFeeAmount.toString(),
      vendorEarning: feeData.vendorEarning.toString(),
      paymentIntentId: finalPI.id,
      chargeId,
    });

    // 🔄 Update request
    await storage.updateServiceRequest(id, {
      paymentStatus: "escrow_held",
      finalPrice: finalPrice.toString(),
      status: "in_progress",
    });

    // 📝 Logs
    await storage.createRequestLog({
      serviceRequestId: id,
      action: "ESCROW_CREATED",
      performedBy: contractorId,
      previousStatus: request.status,
      newStatus: "escrow_held",
    });

    // 🔔 Notify vendor
    await storage.createNotification({
      userId: request.vendorId,
      triggeredBy: contractorId,
      type: "payment_created",
      title: "Payment Created",
      message: "A payment has been created for your service request.",
      relatedRequestId: id,
    });

    return res.json({ success: true });

  } catch (error) {
    console.error("PAYMENT ERROR:", error);
    return res.status(400).json({
      message: error instanceof Error ? error.message : "Payment failed",
    });
  }
});
router.post("/subscription", isAuthenticated, isContractor, async (req, res) => {
try{
    const userId = getUserId(req); // make sure user exists
    if (!userId) {
    return res.status(401).json({ message: "Not authenticated" });
    }
    const user = await storage.getUser(userId);
    const profile = await storage.getUserMaturityProfile(userId);

    let customerId = profile?.stripeCustomerId;
    if (!user) {
    return res.status(401).json({ message: "Not authenticated" });
    }

    if (!customerId) {
    const customer = await stripe.customers.create({
        email: user.email,
    });

    customerId = customer.id;

    await storage.upsertUserMaturityProfile({
        userId: user.id,
        stripeCustomerId: customerId,
    });
    }
    const { plan } = req.body;
    
    let priceId: string | undefined;

    if (plan === "pilot") {
      priceId = process.env.STRIPE_PILOT_PRICE_ID;
    }

    if (plan === "beta") {
      const MAX_BETA_SLOTS = parseInt(
        process.env.MAX_BETA_SLOTS_LIMIT || "1000"
      );

      const SIMULATED_FILL = parseInt(
        process.env.SIMULATED_FILL_LIMIT || "642"
      );

      const realUserCount = await storage.getUserCount();

      const usedSlots = realUserCount + SIMULATED_FILL;

      if (usedSlots >= MAX_BETA_SLOTS) {
        return res.status(403).json({
          message: "Beta program is full",
        });
      }

      priceId = process.env.STRIPE_BETA_PRICE_ID;
    }

    if (!priceId) {
      return res.status(400).json({
        message: "Invalid plan selected",
      });
    }

    const session = await stripe.checkout.sessions.create({
    customer: customerId,
    payment_method_types: ["card"],
    mode: "subscription",

    line_items: [
        {
        price: priceId,
        quantity: 1,
        },
    ],

    client_reference_id: user.id, // 🔥 IMPORTANT
    subscription_data: {
        metadata: {
        userId: user.id,
        },
    },

    success_url: `${process.env.APP_URL}/billing`,
    cancel_url: `${process.env.APP_URL}/marketplace`,
    });

    res.json({ url: session.url });
} catch (error) {
    if (error instanceof Error) {
    return res.status(400).json({
        message: error.message
    });
    }
    res.status(500).json({
    message: "Internal server error"
    });
}
});
router.get("/subscription/current", isAuthenticated, isContractor, async (req, res) => {
  try {
    const userId = getUserId(req);

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const sub = await storage.getSubscriptionByUserId(userId);

    res.json(sub || null);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});
router.post("/subscription/cancel", isAuthenticated, isContractor, async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const sub = await storage.getSubscriptionByUserId(userId);
    console.log('new', sub, userId)
    if (!sub) {
      return res.status(404).json({ message: "No active subscription" });
    }

    const updated = await stripe.subscriptions.update(
      sub.stripeSubscriptionId!,
      {
        cancel_at_period_end: true,
      }
    );

    // 🔥 ADD THIS LINE
    await storage.updateSubscriptionDetails(sub.stripeSubscriptionId!, {
      cancelAtPeriodEnd: true,
    });

    res.json({ message: "Subscription will cancel at period end" });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});
router.post("/subscription/resume", isAuthenticated, isContractor, async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const user = await storage.getUser(userId);
    const sub = await storage.getSubscriptionByUserId(userId);

    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    // ✅ CASE 1: Active but cancel scheduled → RESUME
    if (sub && sub.status === "active" && sub.cancelAtPeriodEnd) {
      await stripe.subscriptions.update(sub.stripeSubscriptionId!, {
        cancel_at_period_end: false,
      });

      await storage.updateSubscriptionDetails(sub.stripeSubscriptionId!, {
        cancelAtPeriodEnd: false,
      });

      return res.json({ type: "resumed" });
    }

    // ✅ CASE 2: Expired / canceled → CREATE NEW CHECKOUT
    const profile = await storage.getUserMaturityProfile(userId);

    let customerId = profile?.stripeCustomerId;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
      });

      customerId = customer.id;

      await storage.upsertUserMaturityProfile({
        userId,
        stripeCustomerId: customerId,
      });
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ["card"],
      mode: "subscription",

      line_items: [
        {
          price: process.env.STRIPE_PILOT_PRICE_ID!,
          quantity: 1,
        },
      ],

      client_reference_id: userId,
      subscription_data: {
        metadata: {
          userId,
        },
      },

      success_url: `${process.env.APP_URL}/billing`,
      cancel_url: `${process.env.APP_URL}/marketplace`,
    });

    return res.json({
      type: "checkout",
      url: session.url,
    });

  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});
router.get('/vendors/:id/reviews', isAuthenticated, async (req, res) => {
try {
    const vendorId = req.params.id;
    if (!vendorId) {
    return res.status(404).json({ message: "Vendor id not found" });
    }
    const reviews = await storage.getReviewsByVendor(vendorId);
    res.json(reviews);
} catch (error) {
      if (error instanceof Error) {
        return res.status(400).json({
          message: error.message
        });
      }

      res.status(500).json({
        message: "Internal server error"
      });
    }
});
router.get("/vendors/:vendorId/services", isAuthenticated, async (req, res) => {
    try {
      const { vendorId } = req.params;

      const vendorServices = await storage.getServicesByVendorId(vendorId);

      res.json(vendorServices);
    } catch (error) {
      console.error("Error fetching vendor services:", error);
      res.status(500).json({ message: "Failed to fetch vendor services" });
    }
});
router.post("/payments/create-intent", isAuthenticated,isContractor, async (req, res) => {
  try {
    const { requestId } = req.body;
    const contractorId = getUserId(req);
    if (!contractorId) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const request = await storage.getServiceRequest(requestId);

    if (!request || !request.proposedPrice) {
      return res.status(400).json({
        message: "Final price not set for this request"
      });
    }

    const amount = Math.round(Number(request.proposedPrice) * 100);

    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: "usd",
      metadata: {
        requestId
      },
    });

    res.json({
      clientSecret: paymentIntent.client_secret,
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "PaymentIntent creation failed" });
  }
});
router.get("/recommended-services", isAuthenticated,isContractor, async (req, res) => {
  const userId = getUserId(req);

  if (!userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  const user = await storage.getUser(userId);
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }
  const userBusinessType = user?.businessType;

  const profile = await storage.getUserMaturityProfile(userId);

  const gaps: Gap[] = profile?.assessmentData?.gaps || [];

  if (!gaps.length) {
    return res.json([]);
  }

  const services = await storage.getRecommendedServices( gaps, userBusinessType);

  return res.json(services);
});
// Assessment routes
router.post('/assessment/chat', isAuthenticated, isContractor, async (req: any, res) => {
try {
    const userId = getUserId(req);
    if (!userId) {
    return res.status(401).json({ message: "Not authenticated" });
    }
    await storage.updateUser(userId, { skipAssessment: false });
    
    // Validate request body
    const chatMessageSchema = z.object({
    messages: z.array(z.object({
        role: z.enum(['assistant', 'user']),
        content: z.string(),
    })),
    });
    
    const validation = chatMessageSchema.safeParse(req.body);
    if (!validation.success) {
    return res.status(400).json({ message: "Invalid request format" });
    }
    
    const { messages } = validation.data;
    console.log('[ASSESSMENT CHAT] Processing message for user:', userId);
    console.log('[ASSESSMENT CHAT] Conversation length:', messages.length);

    // System prompt for assessment AI
    const systemPrompt = `You are an expert AI guide helping government contractors assess their business maturity level. Your goal is to determine their stage (Startup, Growth, or Scale) through a conversational assessment.

    Ask questions about:
    1. Company background and experience level
    2. Current government contracting experience (if any)
    3. Business registration status (SAM.gov, DUNS, CAGE code)
    4. Revenue and team size
    5. Current capabilities and service offerings
    6. Main challenges and goals

    Be conversational, encouraging, and professional. Ask 1-2 questions at a time. After 5-7 exchanges, you should have enough information to provide an assessment.

    When ready to complete the assessment, respond ONLY with a JSON object in this exact format:

    {
    "isComplete": true,
    "maturityStage": "startup" | "growth" | "scale",
    "readinessScore": 0-100,
    "aiAnalysis": "2-3 sentence summary",
    "recommendations": ["..."],
    "gaps": [
        {
        "type": "legal" | "cybersecurity" | "finance" | "hr" | "marketing" | "business_tools" | "certifications",
        "problem": "clear problem"
        }
    ]
    }

    Maturity Stage Criteria:
    - Startup (0-40 score): New to PROOF, limited/no contracts, basic registrations incomplete, small team, learning phase
    - Growth (41-70 score): Some PROOF experience, 1-3 contracts, registrations complete, building capabilities, seeking more opportunities
    - Scale (71-100 score): Established PROOF player, multiple contracts, strong past performance, specialized capabilities, scaling operations

    Otherwise, continue the conversation by asking relevant follow-up questions.
    Also identify business gaps based on missing capabilities.

    You MUST return a "gaps" array using ONLY these types:
    - legal
    - cybersecurity
    - finance
    - hr
    - marketing
    - business_tools
    - certifications

    Each gap must follow this format:
    {
    "type": "<one of the allowed types>",
    "problem": "<clear problem statement>"
    }

    Rules:
    - Include gaps based on user's answers AND common government contracting requirements
    - You may infer standard PROOF gaps even if not explicitly stated
    - Do NOT invent random gaps
    - Maximum 5 gaps
    - If user is in startup, prioritize:
    legal, certifications, finance

    Important:
    - For Startup stage, ALWAYS include at least 3 gaps
    - Focus on real PROOF gaps such as:
    - Missing SAM.gov registration
    - Missing DUNS or CAGE code
    - No capability statement
    - No government contracting experience
    - No compliance frameworks

    Include gaps in final JSON like:
    "gaps": [...]`;

    const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
        { role: "system", content: systemPrompt },
        ...messages.map((m: any) => ({ role: m.role, content: m.content })),
    ],
    temperature: 0.7,
    });

    const response = completion.choices[0].message.content || "";
    console.log('[ASSESSMENT CHAT] Response received, checking for completion...');
    const updatedConversation = [
    ...messages,
    { role: "assistant", content: response },
    ];
    await storage.upsertUserMaturityProfile({
    userId,
    assessmentData: {
        status: 'in_progress',
        conversationHistory: updatedConversation,
        lastUpdatedAt: new Date(),
    },
    });

    // Check if AI is completing the assessment
    if (response.includes('"isComplete": true') || response.includes('"isComplete":true')) {
    try {
        // Strip markdown code fences and extract JSON
        let jsonStr = response;
        
        // Remove markdown code fences if present
        jsonStr = jsonStr.replace(/```json\n?/g, '').replace(/```\n?/g, '');
        
        // Extract JSON object (handles cases with leading/trailing text)
        const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
        throw new Error('No JSON object found in response');
        }
        
        const assessmentResult = JSON.parse(jsonMatch[0]);
        const gapSchema = z.object({
        type: z.enum([
            ...SERVICE_CATEGORIES,
            "certifications",
        ]),
        problem: z.string().min(5),
        });

        const gapsSchema = z.array(gapSchema).max(5);

        let gaps: Gap[] = gapsSchema.safeParse(assessmentResult.gaps).success
        ? assessmentResult.gaps
        : [];

        if (assessmentResult.maturityStage === "startup" && gaps.length < 3) {
        const fallbackGaps: Gap[] = [
            {
            type: "certifications",
            problem: "Missing SAM.gov registration and DUNS/CAGE codes",
            },
            {
            type: "legal",
            problem: "No formal business structure or operating agreement",
            },
            {
            type: "cybersecurity",
            problem: "No compliance with CMMC or security frameworks",
            },
            {
            type: "marketing",
            problem: "No capability statement for government contracting",
            },
        ];

        // Fill missing gaps up to 3
        gaps = [...gaps];

        for (const fg of fallbackGaps) {
            if (gaps.length >= 3) break;

            const alreadyExists = gaps.some((g: Gap) => g.type === fg.type);
            if (!alreadyExists) {
            gaps.push(fg);
            }
        }
        }
        
        // Validate required fields
        if (!assessmentResult.maturityStage || !assessmentResult.readinessScore) {
        throw new Error('Missing required assessment fields');
        }
        
        // Save assessment to database
        await storage.createAssessment({
        userId,
        conversationHistory: updatedConversation,
        maturityStage: assessmentResult.maturityStage,
        readinessScore: assessmentResult.readinessScore,
        aiAnalysis: assessmentResult.aiAnalysis,
        recommendations: assessmentResult.recommendations,
        gaps: gaps
        });

        // Create or update user maturity profile (only defined fields)
        const existingProfile = await storage.getUserMaturityProfile(userId);
        const GAP_PRIORITY: GapType[] = [
        "legal",
        "certifications",
        "finance",
        "cybersecurity",
        "marketing",
        "business_tools",
        "hr",
        ];

        const primaryGap = GAP_PRIORITY.find(type =>
        gaps.some(g => g.type === type)
        );

        const GAP_ACTIONS: Record<GapType, string> = {
          legal: "business_structure",
          certifications: "business_structure",
          cybersecurity: "compliance",
          finance: "financial_setup",
          marketing: "capability_statement",
          hr: "team_building",
          business_tools: "tools_setup",
          insurance: "financial_setup",
        };

        const currentFocus = primaryGap
        ? GAP_ACTIONS[primaryGap]
        : existingProfile?.currentFocus || "business_structure";

        await storage.upsertUserMaturityProfile({
        userId,
        maturityStage: assessmentResult.maturityStage,
        readinessScore: assessmentResult.readinessScore,
        assessmentData: {
            status: 'completed',
            conversationHistory: updatedConversation,
            completedAt: new Date(),
            aiAnalysis: assessmentResult.aiAnalysis,
            recommendations: assessmentResult.recommendations,
            gaps: gaps
        },
        currentFocus: currentFocus,
        subscriptionTier: existingProfile?.subscriptionTier || null,
        });

        console.log('[ASSESSMENT CHAT] Assessment complete:', assessmentResult.maturityStage, assessmentResult.readinessScore);

        return res.json({
        isComplete: true,
            result: {
            ...assessmentResult,
            gaps: gaps, // ✅ always return validated gaps
        },
        });
    } catch (parseError) {
        console.error('[ASSESSMENT CHAT] Failed to parse completion JSON:', parseError);
        console.error('[ASSESSMENT CHAT] Raw response:', response);
        return res.status(500).json({ 
        message: "Failed to complete assessment. Please try again.",
        error: parseError instanceof Error ? parseError.message : "Unknown error"
        });
    }
    }

    // Continue conversation
    res.json({
    isComplete: false,
    nextQuestion: response,
    });
} catch (error) {

    if (error instanceof Error) {
      return res.status(400).json({ message: error.message });
    }

    return res.status(500).json({ message: 'Internal server error' });
  }
});
  // Toggle milestone completion
  router.post('/journeys/milestone', isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      const { coreProcess, milestoneId, completed } = req.body;
      
      if (!coreProcess || !milestoneId || typeof completed !== 'boolean') {
        return res.status(400).json({ message: "Invalid request" });
      }
      
      // Get or create journey
      const journeys = await storage.getUserJourneys(userId, coreProcess);
      let journey = journeys.length > 0 ? journeys[0] : null;
      
      // Get user's maturity profile for stage validation
      const profile = await storage.getUserMaturityProfile(userId);
      const userStage = profile?.maturityStage || 'startup';
      
      if (!journey) {
        journey = await storage.createUserJourney({
          userId,
          coreProcess: coreProcess as any,
          currentStage: userStage,
          completedMilestones: [],
          progressPercentage: 0,
        });
      }
      
      // Fix legacy journeys with invalid stages
      const validStages = ['startup', 'growth', 'scale'];
      if (!validStages.includes(journey.currentStage)) {
        console.log(`[JOURNEYS] Fixing invalid stage "${journey.currentStage}" to "${userStage}" in milestone toggle`);
        journey = await storage.updateUserJourney(journey.id, {
          currentStage: userStage,
        });
      }
      
      // Update completed milestones
      let completedMilestones = journey.completedMilestones || [];
      if (completed && !completedMilestones.includes(milestoneId)) {
        completedMilestones.push(milestoneId);
      } else if (!completed) {
        completedMilestones = completedMilestones.filter(id => id !== milestoneId);
      }
      
      // Calculate progress percentage based on milestone count
      // This is a simplified calculation - in production you might want to weight milestones
      const totalMilestones = getMilestoneCountForProcess(coreProcess, journey.currentStage);
      const progressPercentage = totalMilestones > 0 
        ? Math.round((completedMilestones.length / totalMilestones) * 100) 
        : 0;
      
      // Update journey
      const updatedJourney = await storage.updateUserJourney(journey.id, {
        completedMilestones,
        progressPercentage,
      });
      
      // Update user maturity profile with new progress
      const progressField = coreProcess === 'business_structure' 
        ? 'businessStructureProgress'
        : coreProcess === 'business_strategy'
        ? 'businessStrategyProgress'
        : 'executionProgress';
      
      await storage.upsertUserMaturityProfile({
        userId,
        [progressField]: progressPercentage,
      });
      
      res.json(updatedJourney);
    } catch (error) {
      console.error('[JOURNEYS] Error updating milestone:', error);
      res.status(500).json({ message: "Failed to update milestone" });
    }
  });
// Get user journey for a specific process
router.get('/journeys/:processId', isAuthenticated, async (req: any, res) => {
      try {
        const userId = getUserId(req);
        if (!userId) {
          return res.status(401).json({ message: "Not authenticated" });
        }
        const { processId } = req.params;
        
        const journeys = await storage.getUserJourneys(userId, processId);
        let journey = journeys.length > 0 ? journeys[0] : null;
        
        // Get user's maturity profile for stage validation
        const profile = await storage.getUserMaturityProfile(userId);
        const userStage = profile?.maturityStage || 'startup';
        
        if (!journey) {
          // Create initial journey if it doesn't exist
          const newJourney = await storage.createUserJourney({
            userId,
            coreProcess: processId as any,
            currentStage: userStage,
            completedMilestones: [],
            progressPercentage: 0,
          });
          return res.json(newJourney);
        }
        
        // Fix legacy journeys with invalid stages (e.g., "foundation")
        const validStages = ['startup', 'growth', 'scale'];
        if (!validStages.includes(journey.currentStage)) {
          console.log(`[JOURNEYS] Fixing invalid stage "${journey.currentStage}" to "${userStage}"`);
          journey = await storage.updateUserJourney(journey.id, {
            currentStage: userStage,
          });
        }
        
        res.json(journey);
      } catch (error) {
        console.error('[JOURNEYS] Error fetching journey:', error);
        res.status(500).json({ message: "Failed to fetch journey" });
      }
    });

// Reset assessment data (delete maturity profile, assessments, and journeys)
  router.delete('/reset-assessment', isAuthenticated, isContractor, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      // Delete all assessment-related data
      await storage.upsertUserMaturityProfile({
        userId,
        maturityStage: 'startup',
        readinessScore: 0,
        currentFocus: 'business_structure',
        businessStructureProgress: 0,
        businessStrategyProgress: 0,
        executionProgress: 0,
        assessmentData: null,
      });
      await storage.deleteUserAssessments(userId);
      await storage.deleteUserJourneys(userId);
      
      res.json({ message: "Assessment data reset successfully" });
    } catch (error) {
      console.error('[RESET] Error resetting assessment:', error);
      res.status(500).json({ message: "Failed to reset assessment" });
    }
  });
  
  // Skip assessment (explicit user intent)
router.post('/skip-assessment', isAuthenticated, isContractor, async (req: any, res) => {
  try {
    const userId = getUserId(req);

    if (!userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    const existingProfile = await storage.getUserMaturityProfile(userId);
    if (existingProfile?.assessmentData?.status === 'completed') {
      return res.status(409).json({
        message: "Assessment already completed",
      });
    }
    await storage.upsertUserMaturityProfile({
      userId,
      maturityStage: 'startup',
      readinessScore: 0,
      currentFocus: 'business_structure',
      businessStructureProgress: 0,
      businessStrategyProgress: 0,
      executionProgress: 0,
      assessmentData: {
        ...(existingProfile?.assessmentData ?? {}),
        status: 'skipped',
        skippedAt: new Date(),
      },

    });
    await storage.updateUser(userId, {
      skipAssessment: true,
    });

    res.json({ success: true });
    } catch (error: any) {
    console.error('[ASSESSMENT] Error skipping assessment:', {
      message: error?.message,
      stack: error?.stack,
      error,
    });

    res.status(500).json({ message: "Failed to skip assessment" });
  }

});
 router.get('/services/:serviceId/vendors', isAuthenticated, async (req: any, res) => {
  try {
    const { serviceId } = req.params;
// res.json(serviceId);
    // ✅ Step 1: Get service
    const service = await storage.getServiceById(serviceId);

    if (!service) {
      return res.status(404).json({ message: "Service not found" });
    }

    if (!service.categoryId) {
      return res.status(400).json({ message: "Service category not found" });
    }

    // ✅ Step 2: Get vendors by category
    const vendors = await storage.getServiceVendors(service.categoryId);

    res.json(vendors);

  } catch (error) {
    if (error instanceof Error) {
      return res.status(400).json({ message: error.message });
    }

    res.status(500).json({ message: "Internal server error" });
  }
});
router.get('/categories/:categoryId/vendors', isAuthenticated, async (req: any, res) => {
  try {
    const { categoryId } = req.params;
    // Step 1: Get category
    const category = await storage.getCategoryById(categoryId);

    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }

    if (!category.id) {
      return res.status(400).json({ message: "Service category not found" });
    }

    // Step 2: Get vendors by category
    const vendors = await storage.getCategoryVendors(categoryId);

    res.json(vendors);

  } catch (error) {
    if (error instanceof Error) {
      return res.status(400).json({ message: error.message });
    }

    res.status(500).json({ message: "Internal server error" });
  }
});
// /api/test/setup-contractor
router.post('/setup-contractor', async (req: any, res) => {
  try {
    console.log('🔥 ROUTE HIT');

    const result = await storage.setupContractorUser();

    if (result.type === 'created') {
      return res.json({
        message: 'User created',
        user: result.user,
      });
    }

    if (result.type === 'reset') {
      return res.json({
        message: 'User exists, profile reset',
        user: result.user,
      });
    }

    return res.status(400).json({ message: 'Unexpected state' });

  } catch (error) {

    if (error instanceof Error) {
      return res.status(400).json({ message: error.message });
    }

    return res.status(500).json({ message: 'Internal server error' });
  }
});
router.post('/maturity/reset-stage', isAuthenticated, async (req: any, res) => {
  try {
    const userId = getUserId(req);

    if (!userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const { currentStage } = req.body;

    const validStages = ['startup', 'growth', 'scale'];
    if (!currentStage || !validStages.includes(currentStage)) {
      return res.status(400).json({ message: "Invalid stage" });
    }

    // ======================
    // GET USER PROFILE
    // ======================
    const profile = await storage.getUserMaturityProfile(userId);

    if (!profile) {
      return res.status(404).json({ message: "Profile not found" });
    }

    // ======================
    // GET ALL JOURNEYS
    // ======================
    const processes = ['business_structure', 'business_strategy', 'execution'];

    const updatedJourneys: any[] = [];

    for (const process of processes) {

      const journeys = await storage.getUserJourneys(userId, process);
      let journey = journeys.length > 0 ? journeys[0] : null;

      // create if missing (edge case safety)
      if (!journey) {
        journey = await storage.createUserJourney({
          userId,
          coreProcess: process as any,
          currentStage,
          completedMilestones: [],
          progressPercentage: 0,
        });
      }

      // ======================
      // RESET JOURNEY
      // ======================
      const updated = await storage.updateUserJourney(journey.id, {
        currentStage, // stay same
        completedMilestones: [],
        progressPercentage: 0,
      });

      updatedJourneys.push(updated);
    }

    // ======================
    // RESET PROFILE PROGRESS
    // ======================
    await storage.upsertUserMaturityProfile({
      userId,
      maturityStage: currentStage, // explicitly keep same
      businessStructureProgress: 0,
      businessStrategyProgress: 0,
      executionProgress: 0,
    });

    return res.json({
      success: true,
      message: "Stage reset successfully",
      stage: currentStage,
      journeys: updatedJourneys,
    });

  } catch (error) {
    console.error('[MATURITY] Error resetting stage:', error);

    return res.status(500).json({
      message: "Failed to reset stage",
      error: process.env.NODE_ENV === 'development' ? error : undefined,
    });
  }
});
router.post('/test/reset-subscription', async (req, res) => {
  try{
  const email = 'contractor@gmail.com';

  const user = await storage.getUserByEmail(email);

  if (!user) return res.sendStatus(404);

  await storage.deleteSubscriptionByUserId(user.id);

  await storage.resetUserSubscription(user.id);

  res.json({ success: true });
  } catch (error) {
    console.error('[MATURITY] Error resetting stage:', error);

    return res.status(500).json({
      message: "Failed to reset stage",
      error: process.env.NODE_ENV === 'development' ? error : undefined,
    });
  }
});
router.get("/urgency-slots", async (req, res) => {
  const MAX_BETA_SLOTS = parseInt(
    process.env.MAX_BETA_SLOTS_LIMIT || "1000"
  );

  const SIMULATED_FILL = parseInt(
    process.env.SIMULATED_FILL_LIMIT || "642"
  );

  const realUserCount = await storage.getUserCount();

  const usedSlots = realUserCount + SIMULATED_FILL;

  let remainingSlots = MAX_BETA_SLOTS - usedSlots;

  if (remainingSlots < 0) {
    remainingSlots = 0;
  }

  const betaClosed = remainingSlots <= 0;

  res.json({
    betaClosed,
    remainingSlots,
    usedSlots,
    maxSlots: MAX_BETA_SLOTS,
  });
});

router.get('/vendors/:vendorId/categories/:categoryId/services', isAuthenticated, async (req: any, res) => {
  try {
    const { categoryId, vendorId } = req.params;

    if (!categoryId) {
      return res.status(404).json({ message: "Category not found" });
    }

    if (!vendorId) {
      return res.status(404).json({ message: "Vendor not found" });
    }

    const services = await storage.fetchVendorCategoryServices(vendorId, categoryId);

    res.json(services);

  } catch (error:any) 
  {
      return res.status(400).json({ message: error.message });
      console.error('Error fetching vendor category services:', error);
  }
});

export default router;
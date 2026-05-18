import { Router } from "express";
import { isAuthenticated } from "../middleware/auth.middleware";
import { getUserId } from "../utills/auth.util";
import { storage } from "../storage";
import { upload } from "../utills/upload.util";
import { isVendor } from "../middleware/vendor.middleware";
import { stripe } from "../lib/stripe";
import { vendorStorage } from "../storage/vendorStorage";
import OpenAI from "openai";

const router = Router();

// get vendor services
router.get("/services", isAuthenticated, isVendor, async (req: any, res) => {
  try {
    const vendorId = getUserId(req);

    if (!vendorId) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const services = await vendorStorage.getVendorServices(vendorId);

    res.json(services);
  } catch (error) {
    console.error("Error fetching services:", error);
    res.status(500).json({ message: "Failed to fetch services" });
  }
});
// create service
router.post("/services", isAuthenticated, isVendor, async (req: any, res) => {
  try {
    const userId = getUserId(req);

    if (!userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const service = await vendorStorage.createService(req.body, userId);

    res.json(service);
  } catch (error:any) {
    console.error("Error creating service:", error);
    res.status(500).json({ message: error.message || "Failed to create service" });
  }
});
// update service
router.put("/services/:id", isAuthenticated, isVendor, async (req: any, res) => 
{
    try {
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      const service = await vendorStorage.updateService(
        req.params.id,
        req.body,
        userId,
      );
      res.json(service);
    } catch (error) {
      console.error("Error updating service:", error);
      res.status(500).json({
        message: "Failed to update service",
      });
    }
  },
);
/* PORTFOLIO */
router.post( "/portfolio", isAuthenticated, isVendor, upload.single("attachment"), async (req: any, res) => 
{
    try {
      const userId = getUserId(req);
      if (!userId)
        return res.status(401).json({ message: "Not authenticated" });

      const fileUrl = `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`;

      const portfolio = await vendorStorage.createPortfolio(
        { ...req.body, attachmentUrl: fileUrl },
        userId,
      );

      res.json(portfolio);
    } catch (error) {
      console.error("Error creating portfolio:", error);
      res.status(500).json({ message: "Failed to create portfolio" });
    }
  },
);
router.get("/portfolio", isAuthenticated, isVendor, async (req: any, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ message: "Not authenticated" });

    const portfolios = await vendorStorage.getVendorPortfolios(userId);

    res.json(portfolios);
  } catch (error) {
    console.error("Error fetching vendor portfolios:", error);
    res.status(500).json({ message: "Failed to fetch portfolios" });
  }
});
/* CERTIFICATES*/
router.post( "/certificate", isAuthenticated, isVendor, upload.single("image"), async (req: any, res) => 
{
    try {
      const userId = getUserId(req);
      if (!userId)
        return res.status(401).json({ message: "Not authenticated" });

      const imageUrl = `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`;

      const certificate = await vendorStorage.createCertificate(
        { ...req.body, imageUrl: imageUrl },
        userId,
      );

      res.json(certificate);
    } catch (error) {
      console.error("Error creating certificate:", error);
      res.status(500).json({ message: "Failed to create certificate" });
    }
  },
);
// GET /certificate
router.get("/certificate", isAuthenticated, isVendor, async (req: any, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ message: "Not authenticated" });

    const certificates = await vendorStorage.getVendorCertificates(userId);

    res.json(certificates);
  } catch (error) {
    console.error("Error fetching vendor certificates:", error);
    res.status(500).json({ message: "Failed to fetch certificates" });
  }
});
/* VENDOR PAYMENTS */
router.get("/payments", isAuthenticated, isVendor, async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const payments = await vendorStorage.getVendorPayments(userId);

    res.json(payments);
  } catch (error) {
    console.error("FETCH VENDOR PAYMENTS FAILED", error);
    res.status(500).json({ message: "Internal server error" });
  }
});
/*  DELIVERY (ONLY VENDOR) */
router.post("/service-requests/:id/deliver", isAuthenticated, isVendor, async (req, res) => 
{
    try {
      const serviceRequestId = req.params.id;
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const { message, attachments } = req.body;

      if (!message) {
        return res.status(400).json({ message: "Message is required" });
      }

      const existingRequest = await storage.getServiceRequest(serviceRequestId);
      const previousStatus = existingRequest?.status ?? "pending";
      if (!existingRequest) {
        return res.status(404).json({ message: "Service request not found" });
      }
      if (existingRequest.paymentStatus !== "escrow_held") {
        return res.status(400).json({
          message: "Cannot deliver before payment is secured",
        });
      }
      // Optional: ensure only vendor can deliver
      if (existingRequest.vendorId !== userId) {
        return res
          .status(403)
          .json({ message: "Only assigned vendor can deliver" });
      }

      const delivery = await vendorStorage.createDelivery({
        serviceRequestId,
        deliveredBy: userId,
        message,
        attachments, // array of file metadata
      });
      const receiverId =
        existingRequest.vendorId === userId
          ? existingRequest.contractorId
          : existingRequest.vendorId;
      await storage.createNotification({
        userId: receiverId, // service owner
        triggeredBy: userId,
        type: "delivery",
        title: "New Delivery Received",
        message: `Your service request has been delivered.`,
        relatedRequestId: serviceRequestId,
      });
      await storage.createRequestLog({
        serviceRequestId: serviceRequestId,
        action: "DELIVERED",
        performedBy: userId,
        previousStatus: previousStatus,
        newStatus: "delivered",
      });

      res.status(201).json(delivery);
    } catch (err: any) {
      console.error("DELIVERY ERROR:", err);
      res.status(500).json({
        message: "Failed to create delivery",
        error: err.message,
        stack: err.stack,
      });
    }
  },
);
// get contractore and reviews
router.get("/contractors/:id", isAuthenticated, async (req, res) => {
  try {
    const vendor = await storage.getContractorById(req.params.id);
    if (!vendor) {
      return res.status(404).json({ message: "contractor not found" });
    }
    res.json(vendor);
  } catch (error) {
    console.error("Error fetching vendor:", error);
    res.status(500).json({ message: "Failed to fetch contractor" });
  }
});
router.get("/contractor/:id/reviews", isAuthenticated, async (req, res) => {
  try {
    const contractorId = req.params.id;
    const contractor = await storage.getContractorById(contractorId);
    if (!contractor) {
      return res.status(404).json({ message: "Contractor not found" });
    }
    const reviews = await storage.getReviewsByContractor(contractorId);
    res.json(reviews);
  } catch (error) {
    console.error("Error fetching contractor reviews:", error);
    res.status(500).json({ message: "Failed to fetch contractor reviews" });
  }
});
// prfile routes
router.get("/vendor-profile", isAuthenticated, async (req: any, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    const profile = await storage.getVendorProfile(userId);
    res.json(profile);
  } catch (error) {
    console.error("Error fetching vendor profile:", error);
    res.status(500).json({ message: "Failed to fetch vendor profile" });
  }
});
router.post("/vendor-profile", isAuthenticated, isVendor, upload.single("avatar"), async (req: any, res) => 
{
    try {
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const { companyName, title } = req.body;

      if (!companyName || !title) {
        return res
          .status(400)
          .json({ message: "Missing required fields: companyName or title" });
      }

      const fileUrl = `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`;
      if (fileUrl) {
        req.body.avatar = fileUrl;
      }

      const profile = await vendorStorage.createVendorProfile(req.body, userId);

      res.status(200).json(profile);
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
  },
);
    router.put("/vendor-profile/:id", isAuthenticated, isVendor, upload.single("avatar"), async (req: any, res) => 
    {
        try {
        const userId = getUserId(req);
        if (!userId) {
            return res.status(401).json({ message: "Not authenticated" });
        }
        const profileId = req.params.id;

        // Ensure user owns this profile
        const existingProfile = await storage.getVendorProfile(userId);
        if (!existingProfile || existingProfile.id !== profileId) {
            return res
            .status(403)
            .json({ message: "Unauthorized to edit this profile" });
        }
        const fileUrl = req.file
            ? `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`
            : null;
        if (fileUrl) {
            req.body.avatar = fileUrl;
        }
        const profile = await vendorStorage.updateVendorProfile(
            profileId,
            req.body,
        );
        res.json(profile);
        } catch (error) {
        console.error("Error updating vendor profile:", error);
        res.status(500).json({ message: "Failed to update vendor profile" });
        }
    },
    );
    router.post( "/vendor-profile/vet", isAuthenticated, isVendor, async (req: any, res) => 
    {
        try {
        const { vendorId, applicationData } = req.body;

        console.log("[AI VETTING] Starting vendor application review...");

        // Prepare comprehensive application summary for AI review
        const applicationSummary = `
        Vendor Application Review Request:

        Company Name: ${applicationData.companyName}
        Professional Title: ${applicationData.title}
        Years of Experience: ${applicationData.yearsOfExperience || "Not provided"}

        Business Description:
        ${applicationData.description}

        Service Categories: ${applicationData.categories.join(", ")}
        Skills: ${applicationData.skills.join(", ")}
        Location: ${applicationData.location}
        Hourly Rate: $${applicationData.hourlyRate}/hour

        Certifications: ${applicationData.certifications?.length > 0 ? applicationData.certifications.join(", ") : "None provided"}
        Business License: ${applicationData.businessLicense || "Not provided"}
        Insurance: ${applicationData.insuranceInfo || "Not provided"}

        Past Performance:
        ${
        applicationData.pastPerformance?.length > 0
            ? applicationData.pastPerformance
                .map((p: any) => `- ${p.projectName} for ${p.client}`)
                .join("\n")
            : "No past performance data provided"
        }
        `;
            const openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY
            });
        // Call OpenAI for application vetting
        const completion = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
            {
                role: "system",
                content: `You are an AI vetting system for PROOF, an AI-powered platform helping government contractors scale their businesses. 

            Your job is to review vendor applications and determine if they should be approved based on:
            1. Professionalism and completeness of application
            2. Relevant experience for government contracting work
            3. Clear articulation of services and expertise
            4. Reasonable pricing and credentials
            5. Red flags (e.g., vague descriptions, suspicious claims, lack of specifics)

            APPROVAL CRITERIA:
            - Approve if: Professional presentation, relevant experience (2+ years preferred), clear service description, appropriate credentials
            - Require manual review if: Borderline cases, lacking some info but otherwise acceptable, new to gov contracting but strong credentials
            - Reject if: Spam, completely irrelevant services, no substantive information, clear red flags

            Respond in JSON format:
            {
            "approved": true/false,
            "confidence": "high"/"medium"/"low",
            "reasoning": "Brief explanation of your decision",
            "feedback": "Constructive feedback for applicant (shown to them)",
            "recommendManualReview": true/false
            }`,
            },
            {
                role: "user",
                content: applicationSummary,
            },
            ],
            response_format: { type: "json_object" },
            temperature: 0.3,
        });

        const vettingResult = JSON.parse(
            completion.choices[0].message.content || "{}",
        );
        console.log("[AI VETTING] Result:", vettingResult);

        // Update vendor profile approval status
        if (vettingResult.approved && vettingResult.confidence === "high") {
            await vendorStorage.updateVendorProfile(vendorId, { isApproved: true });
            console.log("[AI VETTING] Vendor approved automatically");
        } else if (vettingResult.recommendManualReview) {
            console.log("[AI VETTING] Flagged for manual review");
            vettingResult.feedback =
            vettingResult.feedback +
            " Your application has been flagged for manual review by our team.";
        } else {
            console.log("[AI VETTING] Vendor not approved automatically");
        }

        res.json({
            approved: vettingResult.approved && vettingResult.confidence === "high",
            confidence: vettingResult.confidence,
            reasoning: vettingResult.reasoning,
            feedback: vettingResult.feedback,
            requiresManualReview: vettingResult.recommendManualReview,
        });
        } catch (error) {
        console.error("Error vetting vendor application:", error);
        res.status(500).json({
            message: "Failed to vet vendor application",
            approved: false,
            feedback:
            "Technical error during vetting. Our team will review your application manually.",
        });
        }
    },
    );
    router.get( "/vendors/:vendorId/performance", isAuthenticated, isVendor, async (req, res) => {
        try {
        const { vendorId } = req.params;

        const profile = await storage.getVendorProfile(vendorId);
        if (!profile) {
            return res.status(404).json({ message: "Vendor not found" });
        }

        const {
            totalRequests = 0,
            completedRequests = 0,
            onTimeDeliveries = 0,
            autoCompletedRequests = 0,
            disputesLost = 0,
            rating = 0,
            vendorScore = 0,
        } = profile;

        const completionRate =
            totalRequests === 0 ? 0 : (completedRequests / totalRequests) * 100;

        const onTimeRate =
            completedRequests === 0
            ? 0
            : (onTimeDeliveries / completedRequests) * 100;

        res.json({
            vendorScore,
            rating,
            totalRequests,
            completedRequests,
            autoCompletedRequests,
            disputesLost,
            responseTime: profile.responseTime || 0,
            completionRate: Number(completionRate.toFixed(1)),
            onTimeRate: Number(onTimeRate.toFixed(1)),
        });
        } catch (error) {
        res.status(500).json({ message: "Failed to load performance" });
        }
    },
    );
    router.get( "/connect-status", isAuthenticated, isVendor, async (req: any, res) => 
    {
        try {
        const userId = getUserId(req);
        if (!userId) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        const vendor = await storage.getVendorProfile(userId);

        if (!vendor?.stripeAccountId) {
            return res.json({ connected: false });
        }

        const account = await stripe.accounts.retrieve(vendor.stripeAccountId);

        return res.json({
            connected: true,
            accountId: account.id,
            type: account.type,

            chargesEnabled: account.charges_enabled,
            payoutsEnabled: account.payouts_enabled,
            detailsSubmitted: account.details_submitted,

            email: account.email,

            requirements: {
            currentlyDue: account.requirements?.currently_due || [],
            pendingVerification: account.requirements?.pending_verification || [],
            disabledReason: account.requirements?.disabled_reason || null,
            },
        });
        } catch (err: any) {
        res.status(400).json({ message: err.message });
        }
    },
    );
    router.post("/connect-account", isAuthenticated, async (req, res) => {
    try {
        const userId = getUserId(req);
        if (!userId) return res.status(401).json({ message: "Unauthorized" });
        const user = await storage.getUser(userId);
        if (!user) return res.status(401).json({ message: "User not found" });
        let vendor = await storage.getVendorProfile(userId);
        if (!vendor) return res.status(401).json({ message: "No vendor profile" });

        let accountId = vendor.stripeAccountId;

        // ✅ ONLY create if not exists
        if (!accountId) {
        const account = await stripe.accounts.create({
            type: "express",
            country: "US",
            email: user.email ?? "user@user.com",
            capabilities: {
            transfers: { requested: true },
            },
        });

        accountId = account.id;

        await vendorStorage.updateVendorStripeAccount(userId, {
            stripeAccountId: accountId,
            stripeDetailsSubmitted: account.details_submitted,
            stripeChargesEnabled: account.charges_enabled,
            stripePayoutsEnabled: account.payouts_enabled,
        });
        }

        // ✅ ALWAYS use SAME account
        const baseUrl = process.env.APP_URL || "http://localhost:5000";

        const accountLink = await stripe.accountLinks.create({
        account: accountId, // ✅ FIXED
        refresh_url: `${baseUrl}/vendor-dashboard`,
        return_url: `${baseUrl}/vendor-dashboard`,
        type: "account_onboarding",
        });

        res.json({ url: accountLink.url });
    } catch (err: any) {
        console.error("❌ CONNECT ERROR:", err);
        res.status(400).json({ message: err.message });
    }
    });
    router.get("/vendor/earnings", isAuthenticated, isVendor, async (req, res) => {
    try {
        const userId = getUserId(req);
        if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
        }

        const page = Number(req.query.page || 1);
        const limit = Number(req.query.limit || 5);

        const result = await vendorStorage.getVendorEarnings(userId, page, limit);

        return res.json({
        data: result.data,
        total: result.total,
        totalPages: result.totalPages,
        currentPage: result.currentPage,
        });
    } catch (err: any) {
        console.error("ERROR:", err);
        return res.status(400).json({ message: err.message });
    }
    });

export default router;

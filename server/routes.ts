import { messages } from './../shared/schema';
import { adminStorage } from './storage/adminStorage';
import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { getSession } from "./session";
import { AuthService } from "./auth";
import { EmailService } from "./email";
import { BusinessType, insertUserSchema } from "@shared/schema";
import multer from "multer";
import type { Request } from "express";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { scoringService } from "./services/scoring.service";
import { releaseEscrow } from './services/escrowService';
import { canTransition } from './services/statusEngine';
import { isAuthenticated } from "./middleware/auth.middleware";
import { calculatePlatformFee } from './services/platformFeeService';

// recreate __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// uploads folder
const uploadDir = path.join(__dirname, "uploads");

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storageConfig = multer.diskStorage({
  destination: (req, file, callback) => {
    callback(null, uploadDir);
  },

  filename: (req, file, callback) => {
    const uniqueName = Date.now() + "-" + file.originalname;
    callback(null, uniqueName);
  },
});

const upload = multer({ storage: storageConfig });


// Helper to get userId from custom auth session
const getUserId = (req: any): string | null => {
  return (req.session as any)?.userId || null;
};

function getNotificationContent(status) {
  const statusText = status.replace("_", " ");

  return {
    title: statusText.replace(/\b\w/g, l => l.toUpperCase()),
    message: `Your service request is now ${statusText}`,
    type: `request_${status}`,
  };
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup session middleware (without Replit Auth)
  app.set("trust proxy", 1);
  app.use(getSession());

  // Custom Email/Password Authentication Routes
  
  // Signup with email/password
  app.post('/api/auth/signup', async (req, res) => {
    try {
      const intent = req.query.intent === 'vendor' ? 'vendor' : 'contractor';
      const validatedData = insertUserSchema.parse({
        ...req.body,
        userType: intent,
      });
      
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(validatedData.email);
      if (existingUser) {
        return res.status(400).json({ message: "Email already registered" });
      }
      
      // Hash password
      const hashedPassword = await AuthService.hashPassword(validatedData.password);
      // Generate verification token
      const verificationToken = AuthService.generateVerificationToken();
      const verificationExpiry = AuthService.generateTokenExpiry();
      if (!verificationToken || !verificationExpiry) {
        return res.status(400).json({ message: "Failed to generate verification token" });
      }
      const emailPrefix = validatedData.email.split("@")[0].trim();
      // ensure unique username
      let finalUsername = emailPrefix;
      let counter = 1;

      while (await storage.getUserByUsername(finalUsername)) {
        finalUsername = `${emailPrefix}${counter}`;
        counter++;
      }
      
      // Create user (using upsertUser which accepts all fields)
      const user = await storage.createUser({
        email: validatedData.email,
        password: hashedPassword,
        firstName: validatedData.firstName,
        lastName: validatedData.lastName,
        username: finalUsername,
        profileImageUrl: validatedData.profileImageUrl,
        emailVerificationToken: verificationToken,
        emailVerificationExpiry: verificationExpiry,
        userType: intent,
        businessType: validatedData.businessType || "commercial",
        isEmailVerified: false,
      });
      // await storage.createWallet(user.id);
      
      // Send verification email
      await EmailService.sendVerificationEmail(
        user.email,
        verificationToken,
        user.firstName
      );
      
      console.log(`[AUTH] New user registered: ${user.email}`);
      
      res.status(201).json({
        message: "Account created successfully! Please check your email to verify your account.",
        email: user.email,
      });
    } catch (error: any) {
      console.error('[AUTH] Signup DB error:', error);
      res.status(500).json({
        message: "Failed to create account",
        error: error.message,
      });
    }
  });
  
  // Login with email/password
  app.post('/api/auth/login', async (req, res) => {
    try {
      const { email, password } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required" });
      }
      
      // Find user by email
      const user = await storage.getUserByEmail(email);
      if (!user || !user.password) {
        return res.status(401).json({ message: "Invalid email or password" });
      }
      
      // Verify password
      const isValid = await AuthService.comparePassword(password, user.password);
      if (!isValid) {
        return res.status(401).json({ message: "Invalid email or password" });
      }
      
      // Check if email is verified
      if (!user.isEmailVerified) {
        return res.status(403).json({ 
          message: "Please verify your email address before logging in",
          needsVerification: true,
        });
      }
      
      // Create session
      (req.session as any).userId = user.id;
      (req.session as any).email = user.email;
      
      console.log(`[AUTH] User logged in: ${user.email}`);
      
      res.json({
        message: "Login successful",
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          userType: user.userType,
        },
      });
    } catch (error) {
      console.error('[AUTH] Login error:', error);
      res.status(500).json({ message: "Login failed" });
    }
  });
  app.put("/api/change-password", isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);

      if (!userId) {
        return res.status(401).json({
          message: "Not authenticated",
        });
      }
      const {currentPassword, newPassword, confirmNewPassword} = req.body;
      if (!currentPassword || !newPassword || !confirmNewPassword ) {
        return res.status(400).json({
          message: "All fields are required",
        });
      }

      if (newPassword !== confirmNewPassword) {
        return res.status(400).json({
          message: "New password and confirm password do not match",
        });
      }
      if (newPassword.length < 8) {
        return res.status(400).json({
          message: "Password must be at least 8 characters long",
        });
      }

      const user = await storage.getUser(userId);

      if (!user) {
        return res.status(404).json({
          message: "User not found",
        });
      }

      const isValidPassword =
        await AuthService.comparePassword(
          currentPassword,
          user.password
        );

      if (!isValidPassword) {
        return res.status(400).json({
          message: "Current password is incorrect",
        });
      }

      const hashedPassword =
        await AuthService.hashPassword(
          newPassword
        );

      await storage.updateUser(userId, {
        password: hashedPassword,
      });

      return res.json({
        message: "Password updated successfully",
      });

    } catch (error: any) {
      console.error( "Change Password Error:", error );

      return res.status(500).json({
        message: error.message || "Failed to update password",
      });
    }
  }
);
  
  // Verify email
  app.get('/api/auth/verify-email', async (req, res) => {
    try {
      const { token } = req.query;
      
      if (!token || typeof token !== 'string') {
        return res.status(400).json({ message: "Invalid verification token" });
      }
      
      // Find user with this token
      const user = await storage.getUserByVerificationToken(token);
      if (!user) {
        return res.status(404).json({ message: "Invalid or expired verification token" });
      }
      
      // Check if token is expired
      if (AuthService.isTokenExpired(user.emailVerificationExpiry)) {
        return res.status(400).json({ message: "Verification token has expired" });
      }
      
      // Update user as verified (using upsertUser for complete type support)
      await storage.upsertUser({
        ...user,
        isEmailVerified: true,
        emailVerificationToken: null,
        emailVerificationExpiry: null,
      });
      
      // Send welcome email
      await EmailService.sendWelcomeEmail(user.email, user.firstName);
      
      console.log(`[AUTH] Email verified: ${user.email}`);
      
      res.json({ 
        message: "Email verified successfully! You can now log in.",
        verified: true,
      });
    } catch (error) {
      console.error('[AUTH] Email verification error:', error);
      res.status(500).json({ message: "Email verification failed" });
    }
  });
  app.post("/api/auth/forgot-password", async (req, res) => {
    try {
      const { email } = req.body;
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.json({
          message:
            "If an account exists with that email, a reset link has been sent."
        });
      }

      const token = AuthService.generateVerificationToken();

      const expiry = new Date();
      expiry.setHours(expiry.getHours() + 1);

      await storage.updateUser(user.id, {
        passwordResetToken: token,
        passwordResetExpiry: expiry,
      });

      await EmailService.sendPasswordResetEmail(
        user.email,
        token,
        user.firstName
      );

      res.json({
        message:
          "If an account exists with that email, a reset link has been sent."
      });

    } catch (error) {
      console.error(error);
      res.status(500).json({
        message: "Failed to process request",
      });
    }
  });
  app.get("/api/auth/validate-reset-token", async (req, res) => {
    try {
      const { token } = req.query;

      if (!token || typeof token !== "string") {
        return res.status(400).json({
          message: "Invalid token",
        });
      }

      const user =
        await storage.getUserByPasswordResetToken(token);

      if (!user) {
        return res.status(404).json({
          message: "Invalid reset token",
        });
      }

      if (
        AuthService.isTokenExpired(
          user.passwordResetExpiry
        )
      ) {
        return res.status(400).json({
          message: "Reset token expired",
        });
      }

      return res.json({
        valid: true,
      });
    } catch (error) {
      res.status(500).json({
        message: "Failed to validate token",
      });
    }
  });
  app.post("/api/auth/reset-password", async (req, res) => {
    try {

      const { token, password } = req.body;

      const user =
        await storage.getUserByPasswordResetToken(token);

      if (!user) {
        return res.status(400).json({
          message: "Invalid reset token",
        });
      }

      if (
        AuthService.isTokenExpired(
          user.passwordResetExpiry
        )
      ) {
        return res.status(400).json({
          message: "Reset token expired",
        });
      }

      const hashedPassword =
        await AuthService.hashPassword(password);

      await storage.updateUser(user.id, {
        password: hashedPassword,
        passwordResetToken: null,
        passwordResetExpiry: null,
      });

      res.json({
        message: "Password reset successful",
      });

    } catch (error) {
      console.error(error);

      res.status(500).json({
        message: "Failed to reset password",
      });
    }
  });
    
  // Logout
  app.post('/api/auth/logout', async (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        console.error('[AUTH] Logout error:', err);
        return res.status(500).json({ message: "Logout failed" });
      }
      res.json({ message: "Logged out successfully" });
    });
  });
  
  // Get current user (custom auth only)
  app.get('/api/auth/current-user', async (req: any, res) => {
    try {
      const userId = getUserId(req);
      
      if (!userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.json({
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        userType: user.userType,
        businessType: user.businessType,
        isEmailVerified: user.isEmailVerified,
        hasCompletedOnboarding: user.hasCompletedOnboarding,
      });
    } catch (error) {
      console.error('[AUTH] Error fetching current user:', error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });
  // Onboarding completion
  app.post('/api/onboarding/complete', isAuthenticated, async (req: any, res) => {
  try {
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      await storage.updateUser(userId, {
        hasCompletedOnboarding: true,
      });

      res.json({ success: true });
    } catch (error) {
      console.error('[ONBOARDING] Error completing onboarding:', error);
      res.status(500).json({ message: "Failed to complete onboarding" });
    }
  });

  // Get user maturity profile
  app.get('/api/maturity-profile', isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      let profile = await storage.getUserMaturityProfile(userId);
      
      if (!profile) {
        profile = await storage.upsertUserMaturityProfile({
      userId,
      maturityStage: 'startup',
      readinessScore: 0,
      currentFocus: 'business_structure',
      businessStructureProgress: 0,
      businessStrategyProgress: 0,
      executionProgress: 0,
      subscriptionTier: 'beta',
      assessmentData: {
        status: 'not_started',
      },
    });
      }
      
      res.json(profile);
    } catch (error) {
      console.error('[MATURITY PROFILE] Error fetching profile:', error);
      res.status(500).json({ message: "Failed to fetch profile" });
    }
  });

app.get("/api/vendors", async (req: any, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      const user = await storage.getUser(userId);
      if (user?.userType == "vendor") {
        return res.status(403).json({
          success: false,
          data: [],
          message: "Access denied"
        });
      }
      const userBusinessType = user?.businessType as BusinessType || "commercial";

      const { categories, location, search } = req.query;
      const filters: any = {
        businessType: userBusinessType,
      };

      if (req.query.verified === "true") {
        filters.verified = true;
      }
      if (search) filters.search = search as string;

      let categoryArray: string[] = [];

    // ✅ NEW: convert "legal,finance" → ["legal","finance"]
    if (categories) {
      categoryArray = (categories as string).split(",");
    }
    
      if (location) filters.location = location as string;
    // ✅ CHANGED: pass array instead of single category
    if (categoryArray.length > 0) {
      filters.categories = categoryArray;
    }
      const vendors = await storage.getVendors(filters);
      res.json(vendors);
    } catch (error: any) {
      console.error("❌ FULL ERROR:", error);
        res.status(500).json({ 
        message: error.message || "Failed to fetch vendors",
        error: error instanceof Error ? error.message : error
      });
    }
  });
  app.get('/api/vendors/:id', async (req, res) => {
    try {
      const vendor = await storage.getVendorProfileById(req.params.id);
      if (!vendor) {
        return res.status(404).json({ message: "Vendor not found" });
      }
      res.json(vendor);
    } catch (error: any) {
      console.error("Error fetching vendor:", error);
      res.status(500).json({ message:  error.message || "Failed to fetch vendor1" });
    }
  });
 
  app.post("/api/reviews", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      const { serviceRequestId, rating, comment } = req.body;

      const serviceRequest =
        await storage.getServiceRequest(serviceRequestId);

      if (!serviceRequest)
        return res.status(404).json({ message: "Not found" });

      const revieweeId =
        serviceRequest.vendorId === userId
          ? serviceRequest.contractorId
          : serviceRequest.vendorId;

          const reviewer = await storage.getUser(userId);

      const review = await storage.createReview({
        serviceRequestId,
        reviewerId: userId,
        revieweeId,
        rating,
        comment,
      });
      if (serviceRequest.vendorId) {
        await scoringService.recalculateVendorScore(serviceRequest?.vendorId);
      }
      await storage.createNotification({
        userId: revieweeId,
        triggeredBy: userId, 
        title: "New Review Received",
        message: reviewer? `${reviewer.firstName} left you a ${rating}-star review` : '',
        type: "new_review",
        relatedRequestId: serviceRequestId,
        isRead: false,
      });

      res.json(review);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });
  // Service request routes
  app.get('/api/service-requests', isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      const user = await storage.getUser(userId);
      // pagination params
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 5;
      const offset = (page - 1) * limit;
      const status = req.query.status;
      const search = req.query.search;
      let total = 0;
      let requests: any[] = [];
      if (user?.userType === 'contractor') {
        requests = await storage.getServiceRequestsByContractor(userId, limit, offset, status, search);
        total = await storage.countServiceRequestsByContractor(userId, status, search );
      } else if (user?.userType === 'vendor') {
        requests = await storage.getServiceRequestsByVendor(userId, limit, offset, status, search);
        total = await storage.countServiceRequestsByVendor(userId, status, search);
      }

      res.json({
        page,
        limit,
        total,
        data: requests
      });
    } catch (error: any) {
        console.error("Error fetching service requests:", error);
        res.status(500).json({ 
          message: error.message,
          stack: error.stack 
        });
      }
  });

  // app.post('/api/ai-match', isAuthenticated, async (req: any, res) => {
  //   try {
  //     const { description, priority, budget, vendorId } = req.body;
  //     if (vendorId) {
  //       const vendors = await storage.getVendors();
  //       const vendor = vendors.find(v => v.id === vendorId);

  //       if (!vendor) {
  //         return res.json({ matches: [] });
  //       }

  //       // Return single vendor as "matched"
  //       return res.json({
  //         matches: [vendor]
  //       });
  //     }
  //     // Get all approved vendors
  //     const vendors = await storage.getVendors();
  //     const approvedVendors = vendors.filter(v => v.isApproved);
      
  //     if (approvedVendors.length === 0) {
  //       return res.json({ matches: [] });
  //     }

  //     // Create vendor context for AI
  //     const vendorContext = approvedVendors.map(v => ({
  //       id: v.id,
  //       title: v.title,
  //       company: v.companyName,
  //       categories: v.categories,
  //       skills: v.skills,
  //       hourlyRate: v.hourlyRate,
  //       rating: v.rating,
  //       description: v.description
  //     }));

  //     // Call OpenAI for matching
  //     const completion = await openai.chat.completions.create({
  //       model: "gpt-4o-mini",
  //       messages: [
  //         {
  //           role: "system",
  //           content: `You are an AI assistant that matches government contractors with service providers. 
  //           Analyze the service request and recommend the top 3 most suitable vendors from the provided list.
  //           Consider: skills match, category alignment, budget fit, and expertise level.
  //           Return ONLY a valid JSON array of vendor IDs in order of best match. Example: ["id1", "id2", "id3"]`
  //         },
  //         {
  //           role: "user",
  //           content: `Service Request: ${description}
  //           Priority: ${priority}
  //           Budget: ${budget}
            
  //           Available Vendors:
  //           ${JSON.stringify(vendorContext, null, 2)}
            
  //           Return only the top 3 vendor IDs as a JSON array.`
  //         }
  //       ],
  //       temperature: 0.7,
  //       max_tokens: 200
  //     });

  //     const aiResponse = completion.choices[0]?.message?.content || "[]";
  //     let matchedVendorIds: string[] = [];
      
  //     try {
  //       matchedVendorIds = JSON.parse(aiResponse);
  //     } catch (e) {
  //       console.error("Failed to parse AI response:", aiResponse);
  //       // Fallback to top rated vendors
  //       matchedVendorIds = approvedVendors
  //         .sort((a, b) => Number(b.rating || 0) - Number(a.rating || 0))
  //         .slice(0, 3)
  //         .map(v => v.id);
  //     }

  //     // Get full vendor details for matched vendors
  //     const matches = matchedVendorIds
  //       .map(id => approvedVendors.find(v => v.id === id))
  //       .filter(Boolean);

  //     res.json({ matches });
  //   } catch (error) {
  //     console.error("Error in AI matching:", error);
  //     res.status(500).json({ message: "Failed to process AI matching" });
  //   }
  // });

  app.get("/api/services/:serviceId", async (req: any, res) => {
    const { serviceId } = req.params;

    try {
      // Fetch the service from storage
      const service = await storage.getServiceById(serviceId);

      if (!service) {
        return res.status(404).json({ message: "Service not found" });
      }

      res.json(service);
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
  
  app.post('/api/maturity/advance', isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const { currentStage, nextStage } = req.body;
      const allowedTransitions = {
        startup: "growth",
        growth: "scale",
        scale: null,
      };
      if (allowedTransitions[currentStage] !== nextStage) {
        return res.status(400).json({ message: "Invalid stage transition" });
      }

      if (!["startup", "growth", "scale"].includes(nextStage)) {
        return res.status(400).json({ message: "Invalid stage" });
      }

      const profile = await storage.advanceUserStage(
        userId,
        nextStage
      );

      res.json(profile);
    } catch (error) {
      console.error("Error advancing stage:", error);
      res.status(500).json({ message: "Failed to advance stage" });
    }
  });
  app.post("/api/messages", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const { conversationId, content } = req.body;

      const conversation = await storage.getConversationById(conversationId);
      if (!conversation) {
        return res.status(404).json({ message: "Conversation not found" });
      }

      if (
        conversation.vendorId !== userId &&
        conversation.contractorId !== userId
      ) {
        return res.status(403).json({ message: "Not authorized" });
      }

      const receiverId =
        conversation.vendorId === userId
          ? conversation.contractorId
          : conversation.vendorId;

      const message = await storage.createMessage({
        conversationId,
        senderId: userId,
        receiverId,
        content,
        messageType: "text",
      });
      await storage.updateConversation(conversationId, {
        updatedAt: new Date(),
      });
      await storage.createNotification({
        userId: receiverId,
        triggeredBy: message.senderId,
        title: "New Message",
        message: content.length > 100 
          ? content.substring(0, 100) + "..." 
          : content,
        type: "new_message",
        isRead: false,
      });

      res.json(message);
    } catch (error:any) {
      console.error("Send message error:", error);
      res.status(500).json({ message: error.message || "Failed to send message" });
    }
  });
  app.get("/api/conversations/:id/messages", isAuthenticated, async (req, res) => {
  try {
    const userId = getUserId(req);

    if (!userId) {
      return res.status(401).json({
        message: "Not authenticated",
      });
    }

    const conversationId = req.params.id;

    const conversation =
      await storage.getConversationById(conversationId);

    if (!conversation) {
      return res.status(404).json({
        message: "Conversation not found",
      });
    }

    if (
      conversation.vendorId !== userId &&
      conversation.contractorId !== userId
    ) {
      return res.status(403).json({
        message: "Not authorized",
      });
    }

    return res.json({
      conversation,
    });

  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Failed to fetch messages",
    });
  }
});
  app.patch("/api/service-requests/:id/status", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      const user = await storage.getUser(userId);

      const { id } = req.params;
      const { status, proposedPrice, winner, vendorPercent, contractorPercent, disputeId } = req.body;

      const serviceRequest = await storage.getServiceRequest(id);

      if (!serviceRequest) {
        return res.status(404).json({ message: "Service request not found" });
      }

      const currentStatus = serviceRequest.status ?? "pending";

      // Transition validation
      if (!canTransition(currentStatus, status)) {
        return res.status(400).json({
          message: `Invalid transition from ${currentStatus} to ${status}`
        });
      }

      const isVendor = serviceRequest.vendorId === userId;
      const isContractor = serviceRequest.contractorId === userId;
      const isAdmin = user?.userType === "admin";

      if (!isVendor && !isContractor && !isAdmin) {
        return res.status(403).json({ message: "Not authorized" });
      }

      // Accept request
      if (status === "accepted") {

      const finalProposedPrice = Number(
        proposedPrice ?? serviceRequest.proposedPrice
      );

      if (!finalProposedPrice || finalProposedPrice <= 0) {
        return res.status(400).json({
          message: "Valid proposed price required",
        });
      }

      const feeData = await calculatePlatformFee(finalProposedPrice);

      if (
        !feeData.platformFeeType ||
        feeData.platformFeeValue === undefined ||
        feeData.platformFeeAmount === undefined ||
        feeData.vendorEarning === undefined
      ) {
        return res.status(400).json({
          message: "Fee data required",
        });
      }

      if (feeData.vendorEarning <= 0) {
        return res.status(400).json({
          message:
            "Vendor earning must be greater than zero",
        });
      }

      await storage.updateServiceRequest(id, {
        proposedPrice: finalProposedPrice.toString(),

        finalPrice: finalProposedPrice.toString(),

        platformFeeId: feeData.platformFeeId,
        platformFeeType: feeData.platformFeeType,
        platformFeeValue: feeData.platformFeeValue,

        platformFeeAmount:
          feeData.platformFeeAmount.toString(),

        vendorEarning:
          feeData.vendorEarning.toString(),
      });
    }

      // Prevent work without escrow
      if (status === "in_progress" && serviceRequest.paymentStatus !== "escrow_held") {
        return res.status(400).json({
          message: "Escrow must be funded before work starts"
        });
      }

      // Escrow release on completion
      if (status === "completed") {
        await releaseEscrow(
          serviceRequest,
          winner ?? "vendor",
          vendorPercent
        );
        await storage.updateServiceRequest(id, {
          paymentStatus: winner === "contractor" ? "refunded" : "released",
          actualCost: serviceRequest.finalPrice ?? serviceRequest.proposedPrice,
          completedAt: new Date()
        });

      }

      const updated = await storage.updateServiceRequestStatus(id, status);

      // Admin dispute resolution
      if (isAdmin && disputeId) {

        await storage.updateDisputeResolution(disputeId, winner);

        await storage.createNotification({
          userId: serviceRequest.vendorId,
          triggeredBy: userId,
          type: "dispute_resolved",
          title: "Dispute Resolved",
          message: "Admin has resolved the dispute.",
          relatedRequestId: id,
        });

        await storage.createNotification({
          userId: serviceRequest.contractorId,
          triggeredBy: userId,
          type: "dispute_resolved",
          title: "Dispute Resolved",
          message: "Admin has resolved the dispute.",
          relatedRequestId: id,
        });

      }

      // Log
      await storage.createRequestLog({
        serviceRequestId: id,
        action: "STATUS_UPDATED",
        performedBy: userId,
        previousStatus: currentStatus,
        newStatus: status
      });

      // Notifications
      const receiverId =
        serviceRequest.vendorId === userId
          ? serviceRequest.contractorId
          : serviceRequest.vendorId;

      const notification = getNotificationContent(status);

      if (user?.userType !== "admin") {

        await storage.createNotification({
          userId: receiverId,
          triggeredBy: userId,
          title: notification.title,
          message: notification.message,
          type: notification.type,
          relatedRequestId: serviceRequest.id,
          isRead: false
        });

      }

      // scoring
      if (status === "completed") {
        await scoringService.handleRequestCompletion(serviceRequest);
      }

      res.json(updated);

    } catch (error) {

      console.error("STATUS UPDATE FAILED");

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
  app.post( "/api/conversations/start", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);

      if (!userId) {
        return res.status(401).json({
          message: "Not authenticated",
        });
      }

      const {
        userId: targetUserId,
      } = req.body;

      if (!targetUserId) {
        return res.status(400).json({
          message: "userId is required",
        });
      }

      const currentUser =
        await storage.getUser(userId);

      const targetUser =
        await storage.getUser(targetUserId);

      if (!currentUser || !targetUser) {
        return res.status(404).json({
          message: "User not found",
        });
      }

      let contractorId: string;
      let vendorId: string;

      if (currentUser.userType === "vendor") {
        vendorId = currentUser.id;
        contractorId = targetUser.id;
      } else {
        contractorId = currentUser.id;
        vendorId = targetUser.id;
      }

      const existingConversation =
        await storage.getConversationBetweenUsers(
          contractorId,
          vendorId
        );

      if (existingConversation) {
        return res.json({
          success: true,
          data: existingConversation,
        });
      }

      const conversation =
        await storage.createConversation({
          contractorId,
          vendorId,
        });

      return res.json({
        success: true,
        data: conversation,
      });

    } catch (error: any) {

      console.error(error);

      return res.status(500).json({
        message:
          error.message ||
          "Failed to start conversation",
      });
    }
  }
);
  app.get("/api/conversations", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const data = await storage.getUserConversations(userId);
      return res.json(data);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "Failed to load conversations" });
    }
  });
  app.post("/api/conversations/:id/mark-read", isAuthenticated, async (req, res) => {
    try {
        const userId = getUserId(req);
        const conversationId = req.params.id;

        if (!userId) {
          return res.status(401).json({ message: "Not authenticated" });
        }

        const updatedCount  = await storage.markAsRead(conversationId, userId);

        return res.json({
          success: true,
          updated: updatedCount,
        });

      } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Failed to mark as read" });
      }
    }
  );
  app.get("/api/notifications", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const notifications = await storage.getUserNotifications(userId);
      res.json(notifications);
    } catch (error) {
      console.error("Fetch notifications error:", error);
      res.status(500).json({ message: "Failed to fetch notifications" });
    }
  });
  app.patch("/api/notifications/:id/read", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      const updated = await storage.markAllNotificationsAsRead(userId);
      if (!updated) {
        return res.status(404).json({ message: "Notification not found" });
      }

      res.json({ success: true });
    } catch (error) {
      console.error("Mark read error:", error);
      res.status(500).json({ message: "Failed to update notification" });
    }
  });
  app.get("/api/notifications/unread-count", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      const count = await storage.getUnreadNotificationCount(userId);

      res.json({ count });
    } catch (error) {
      console.error("Unread count error:", error);
      res.status(500).json({ message: "Failed to fetch count" });
    }
  });
  app.get("/api/service-requests/:id", async (req, res) => {
  try {
    const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      const id = req.params.id;
      const request = await storage.getServiceRequest(req.params.id);

      if (!request) {
        return res.status(404).json({ message: "Not found" });
      }
      if ( request.status === "delivered" ) 
      {
        const updatedStatus = await storage.autoCompleteIfExpired(request);
        if (updatedStatus === "completed") {
          await storage.createRequestLog({
            serviceRequestId: id,
            action: "AUTO_COMPLETED",
            performedBy: userId,
            previousStatus: "delivered",
            newStatus: updatedStatus,
          });
          const notification = getNotificationContent("completed");
          await storage.createNotification({
            userId: request.vendorId,
            triggeredBy: request.contractorId,
            title: "AUTO_COMPLETED",
            message: "Your service request has been automatically marked as completed as the delivery deadline has passed.",
            type: notification.type,
            relatedRequestId: request.id,
            isRead: false,
          });
          await storage.createNotification({
            userId: request.contractorId,
            triggeredBy: request.vendorId,
            title: "AUTO_COMPLETED",
            message: "Your service request has been automatically marked as completed as the delivery deadline has passed.",
            type: notification.type,
            relatedRequestId: request.id,
            isRead: false,
          });
          request.status = "completed";
        }
      }

      const alreadyReviewed = request.reviews?.some(
        (review) => review.reviewerId === userId
      );

      if (request.vendorId !== userId && request.contractorId !== userId) {
        return res.status(403).json({ message: "Unauthorized" });
      }

      res.json({
        ...request,
        alreadyReviewed,
      });
    } catch (err) {
      res.status(500).json({ message: "Failed to fetch request" });
    }
  });
  app.post("/api/upload", upload.single("file"),
    (req: Request & { file?: Express.Multer.File }, res) => {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }
      const fileUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;

      res.json({
        filePath: fileUrl,
        fileName: req.file.originalname,
        fileSize: req.file.size,
      });
    }
  );
  app.post("/api/disputes", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      
      if (!userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      const user = await storage.getUser(userId);

      const { serviceRequestId, reason, description } = req.body;

      if (!serviceRequestId || !reason) {
        return res.status(400).json({
          message: "Service request ID and reason are required",
        });
      }

      const result = await storage.createDispute({
        serviceRequestId,
        openedBy: userId,
        reason,
        description,
      });

      const serviceRequest = await storage.getServiceRequest(serviceRequestId);
      const otherParty =
        serviceRequest?.vendorId === userId
          ? serviceRequest.contractorId
          : serviceRequest?.vendorId;

      await storage.createNotification({
        userId: otherParty,
        triggeredBy: userId,
        type: "dispute_opened",
        title: "Dispute Opened",
        message: "A dispute has been opened for this service request.",
        relatedRequestId: serviceRequestId,
        isRead: false,
      });

      // Notify admin (optional but recommended)
      const admins = await adminStorage.getAdmins();
      for (const admin of admins) {
        await storage.createNotification({
          userId: admin.id,
          triggeredBy: userId,
          type: "dispute_opened",
          title: "New Dispute",
          message: "A new dispute requires review.",
          relatedRequestId: serviceRequestId,
        });
      }
      await storage.createRequestLog({
        serviceRequestId: serviceRequestId,
        action: "DISPUTE_OPENED",
        performedBy: userId,
        previousStatus: serviceRequest?.status ?? "unknown",
        newStatus: "disputed" +  " (" + user?.userType + ")",
      });
      res.json(result);
    } catch (error: any) {
      console.error("CREATE DISPUTE FAILED", error);

      res.status(400).json({
        message: error.message || "Failed to create dispute",
      });
    }
  });
  app.post("/api/support", isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      const loginUser = await storage.getUser(userId);

      const { subject, message } = req.body;

      const ticket = await storage.createSupportTicket({
        userId,
        subject,
        message,
      });
      const adminUser = await storage.getAdminUser();
      if(adminUser?.id) {
        await storage.createNotification({
          userId: adminUser?.id,
          triggeredBy: userId, 
          title: "New Support Ticket Received",
          message: loginUser? `${loginUser.firstName}  created a support ticket` : '',
          type: "support_ticket_created" ,
          relatedSupportTicketId: ticket.id,
        });
        if (adminUser?.email) {
          await EmailService.sendSupportTicketCreatedEmail({
            to: adminUser.email,
            ticketId: ticket.id,
            subject: ticket.subject,
            userName: `${loginUser?.firstName} ${loginUser?.lastName}`,
          });
        }
      }

      res.status(201).json(ticket);

    } catch (error: any) {
      res.status(500).json({
        message: error.message,
      });
    }
  });
app.get("/api/support", isAuthenticated, async (req: any, res) => {
  try {
    const userId = getUserId(req);

    if (!userId) {
      return res.status(401).json({
        message: "Not authenticated",
      });
    }

    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const status = req.query.status as string;
    const search = req.query.search as string;

    const tickets =
      await storage.getSupportTicketsByUser(
        userId,
        page,
        limit,
        status,
        search
      );

    res.json(tickets);

  } catch (error: any) {
    res.status(500).json({
      message: error.message,
    });
  }
});
    app.get("/api/support/stats", isAuthenticated, async (req, res) => {
    try {
        const userId = getUserId(req);
          if (!userId) {
            return res.status(401).json({ message: "Not authenticated" });
          }
          const user = await storage.getUser(userId);
          const userType = req.query.userType as string;
          const search = req.query.search as string;
        const stats =
          await storage.getSupportTicketStats(
            user.userType === "admin"
              ? undefined
              : userId,
              userType,
              search
          );

        res.json(stats);

      } catch (error: any) {
        res.status(500).json({
          message: error.message,
        });
      }
    }
  );
  app.get("/api/support/:id", isAuthenticated, async (req, res) => {
    try {
      
      const ticket = await storage.getSupportTicket(
        req.params.id
      );

      if (!ticket) {
        return res.status(404).json({
          message: "Ticket not found",
        });
      }

      res.json(ticket);

    } catch (error: any) {
      res.status(500).json({
        message: error.message,
      });
    }
  });
  app.post("/api/support/:id/reply", isAuthenticated, async (req: any, res) => {
    try {
      const id = req.params.id;
      if (!id) {
            return res.status(401).json({ message: "Please create ticket first" });
          }
      const userId = getUserId(req);
          if (!userId) {
            return res.status(401).json({ message: "Not authenticated" });
          }
      const reply = await storage.addSupportReply(
        id,
        userId,
        req.body.message
      );
      const ticket = await storage.getSupportTicket(reply.ticketId);
      const adminUser = await storage.getAdminUser();
      const sender = await storage.getUser(reply.senderId);
        await storage.createNotification({
          userId: adminUser?.id === reply.senderId ? ticket?.userId || "" : adminUser?.id || "",
          triggeredBy: reply.senderId,
          title: "Support Reply Received",
          message: "You received a new reply on your support ticket",
          type: "support_reply",
          relatedSupportTicketId: reply.ticketId,
        });
        if (sender?.userType === "admin") {
          if (ticket?.user?.email) {
            await EmailService.sendSupportReplyEmail({
              to: ticket.user.email,
              ticketId: ticket.id,
              subject: ticket.subject,
              senderName: "Support Team",
            });
          }
        }else {
          if (adminUser?.email) {
            await EmailService.sendSupportReplyEmail({
              to: adminUser.email,
              ticketId: ticket.id,
              subject: ticket.subject,
              senderName: `${sender?.firstName} ${sender?.lastName}`,
            });
          }
        }

      res.status(201).json(reply);

    } catch (error: any) {
      res.status(400).json({
        message: error.message,
      });
    }
  });
app.get("/api/admin/support", isAuthenticated, async (req, res) => {
  try {
    const page =
      Number(req.query.page) || 1;

    const limit =
      Number(req.query.limit) || 10;

    const status = req.query.status as string;

    const search = req.query.search as string;

    const userType = req.query.userType as string;

    const tickets =
      await storage.getAllSupportTickets(
        page,
        limit,
        status,
        search,
        userType
      );

    res.json(tickets);

  } catch (error: any) {
    res.status(500).json({
      message: error.message,
    });
  }
});
  app.put("/api/admin/support/:id/status", isAuthenticated, async (req, res) => {
    try {
      const status = req.body.status;
      const ticket =
        await storage.updateSupportTicketStatus(
          req.params.id,
          status
        );
        const adminUser = await storage.getAdminUser();
        const ticketOwner = await storage.getUser(ticket.userId);
        await storage.createNotification({
          userId: ticket.userId,
          triggeredBy: adminUser?.id || "",
          title: `Ticket ${status}`,
          message: `Your support ticket has been marked as ${status}`,
          type: status === "resolved"
              ? "support_resolved"
              : "support_closed",
          relatedSupportTicketId: ticket.id,
        });
        if (ticketOwner?.email) {
          await EmailService.sendTicketStatusEmail({
            to: ticketOwner.email,
            ticketId: ticket.id,
            status,
            subject: ticket.subject,
          });
        }

      res.json(ticket);

    } catch (error: any) {
      res.status(500).json({
        message: error.message,
      });
    }
  });
  app.patch( "/api/support/:id/read", isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);

      const user = await storage.getUser(userId);

      await storage.markSupportTicketRead(
        req.params.id,
        user.userType
      );

      res.json({
        success: true,
      });
    } catch (error: any) {
      res.status(500).json({
        message: error.message,
      });
    }
  }
);
app.get( "/api/chat-users", isAuthenticated, async (req, res) => {
      const userId = getUserId(req);
      if (!userId) {
            return res.status(401).json({ message: "Not authenticated" });
          }
      const currentUser = await storage.getUser(userId);
      if (!currentUser) {
            return res.status(401).json({ message: "Not authenticated" });
          }

    let users;

    if ( currentUser.userType === "vendor" ) {
      users = await storage.getUsersByType( "contractor" );
    } else {
      users = await storage.getUsersByType( "vendor" );
    }

    res.json(users);
  }
);


  const httpServer = createServer(app);
  return httpServer;
}

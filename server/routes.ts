import type { Express, RequestHandler } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { getSession } from "./session";
import { AuthService } from "./auth";
import { EmailService } from "./email";
import OpenAI from "openai";
import { z } from "zod";
import { insertUserSchema } from "@shared/schema";
import { pool } from "./db";
import { Description } from "@radix-ui/react-toast";
import multer from "multer";
import type { Request } from "express";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

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

if (!process.env.OPENAI_API_KEY) {
  throw new Error("OPENAI_API_KEY is missing");
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Custom authentication middleware for email/password sessions
const isAuthenticated: RequestHandler = async (req, res, next) => {
  const userId = (req.session as any)?.userId;
  
  if (!userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  
  next();
};

// Helper to get userId from custom auth session
const getUserId = (req: any): string | null => {
  return (req.session as any)?.userId || null;
};
const isAdmin: RequestHandler = async (req: any, res, next) => {
  const userId = getUserId(req);
  if (!userId) return res.status(401).json({ message: "Not authenticated" });

  const user = await storage.getUser(userId);
  if (user?.userType !== 'admin') {
    return res.status(403).json({ message: "Admin access only" });
  }

  next();
};

const getVendorsHandler = async (req: any, res: any) => {
  const userId = getUserId(req);
  if (!userId) {
    return res.status(401).json({ message: "Not authenticated" });
  }
  try {
    const vendors = await storage.getOnlyVendors();
    res.json(vendors);
  } catch (error) {
    console.error("Error fetching vendors:", error);
    res.status(500).json({ message: "Failed to fetch vendors" });
  }
};
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
      
      // Create user (using upsertUser which accepts all fields)
      const user = await storage.createUser({
        email: validatedData.email,
        password: hashedPassword,
        firstName: validatedData.firstName,
        lastName: validatedData.lastName,
        username: validatedData.username,
        profileImageUrl: validatedData.profileImageUrl,
        emailVerificationToken: verificationToken,
        emailVerificationExpiry: verificationExpiry,
        userType: intent,
        isEmailVerified: false,
      });
      
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
      subscriptionTier: 'freemium',
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

  // Reset assessment data (delete maturity profile, assessments, and journeys)
  app.delete('/api/reset-assessment', isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      // Delete all assessment-related data
      await storage.deleteUserMaturityProfile(userId);
      await storage.deleteUserAssessments(userId);
      await storage.deleteUserJourneys(userId);
      
      console.log(`[RESET] Assessment data reset for user ${userId}`);
      
      res.json({ message: "Assessment data reset successfully" });
    } catch (error) {
      console.error('[RESET] Error resetting assessment:', error);
      res.status(500).json({ message: "Failed to reset assessment" });
    }
  });
  // Skip assessment (explicit user intent)
app.post('/api/skip-assessment', isAuthenticated, async (req: any, res) => {
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
      subscriptionTier: 'freemium',
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


  // Get user journey for a specific process
  app.get('/api/journeys/:processId', isAuthenticated, async (req: any, res) => {
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

  // Toggle milestone completion
  app.post('/api/journeys/milestone', isAuthenticated, async (req: any, res) => {
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

  // Assessment routes
  app.post('/api/assessment/chat', isAuthenticated, async (req: any, res) => {
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

When ready to complete the assessment, respond with a JSON object in this exact format:
{
  "isComplete": true,
  "maturityStage": "startup" | "growth" | "scale",
  "readinessScore": 0-100,
  "aiAnalysis": "2-3 sentence summary of their current state and key strengths",
  "recommendations": ["recommendation 1", "recommendation 2", "recommendation 3"]
}

Maturity Stage Criteria:
- Startup (0-40 score): New to GovCon, limited/no contracts, basic registrations incomplete, small team, learning phase
- Growth (41-70 score): Some GovCon experience, 1-3 contracts, registrations complete, building capabilities, seeking more opportunities
- Scale (71-100 score): Established GovCon player, multiple contracts, strong past performance, specialized capabilities, scaling operations

Otherwise, continue the conversation by asking relevant follow-up questions.`;

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
          });

          // Create or update user maturity profile (only defined fields)
          const existingProfile = await storage.getUserMaturityProfile(userId);
          await storage.upsertUserMaturityProfile({
            userId,
            maturityStage: assessmentResult.maturityStage,
            readinessScore: assessmentResult.readinessScore,
            assessmentData: {
              status: 'completed',
              conversationHistory: updatedConversation,
              completedAt: new Date(),
            },
            currentFocus: existingProfile?.currentFocus || 'business_structure',
            subscriptionTier: existingProfile?.subscriptionTier || 'freemium',
          });

          console.log('[ASSESSMENT CHAT] Assessment complete:', assessmentResult.maturityStage, assessmentResult.readinessScore);

          return res.json({
            isComplete: true,
            result: assessmentResult,
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
      console.error("Error in assessment chat:", error);
      res.status(500).json({ message: "Failed to process assessment" });
    }
  });

  // Vendor routes — contractor only
  app.get("/api/vendors", async (req: any, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      const user = await storage.getUser(userId);
      if (user?.userType == "vendor") {
        return res.status(403).json({ message: "Access denied" });
      }

      const { category, location, verified } = req.query;
      const filters: any = {};

      if (category) filters.category = category as string;
      if (location) filters.location = location as string;
      if (verified !== undefined) filters.verified = verified === "true";

      const vendors = await storage.getVendors(filters);
      res.json(vendors);
    } catch (error) {
      console.error("Error fetching vendors:", error);
      res.status(500).json({ message: "Failed to fetch vendors" });
    }
  });


  app.get('/api/vendors/:id', async (req, res) => {
    try {
      const vendor = await storage.getVendorProfileById(req.params.id);
      if (!vendor) {
        return res.status(404).json({ message: "Vendor not found" });
      }
      res.json(vendor);
    } catch (error) {
      console.error("Error fetching vendor:", error);
      res.status(500).json({ message: "Failed to fetch vendor" });
    }
  });
  app.get('/api/contractors/:id', async (req, res) => {
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

  app.get('/api/vendors/:id/reviews', async (req, res) => {
    try {
      const vendorId = req.params.id;
      const vendor = await storage.getVendorProfileById(vendorId);
      if (!vendor) {
        return res.status(404).json({ message: "Vendor not found" });
      }
      const reviews = await storage.getReviewsByVendor(vendorId);
      res.json(reviews);
    } catch (error) {
      console.error("Error fetching vendor reviews:", error);
      res.status(500).json({ message: "Failed to fetch vendor reviews" });
    }
  });
  app.get('/api/contractor/:id/reviews', async (req, res) => {
    try {
      const contractorId = req.params.id;
      const vendor = await storage.getContractorById(contractorId);
      if (!vendor) {
        return res.status(404).json({ message: "Contractor not found" });
      }
      const reviews = await storage.getReviewsByContractor(contractorId);
      res.json(reviews);
    } catch (error) {
      console.error("Error fetching contractor reviews:", error);
      res.status(500).json({ message: "Failed to fetch contractor reviews" });
    }
  });
  app.post("/api/reviews", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      const { serviceRequestId, rating, comment } = req.body;

      const serviceRequest =
        await storage.getServiceRequest(serviceRequestId);

      if (!serviceRequest)
        return res.status(404).json({ message: "Not found" });

      const revieweeId =
        serviceRequest.vendorId === userId
          ? serviceRequest.contractorId
          : serviceRequest.vendorId;

      const review = await storage.createReview({
        serviceRequestId,
        reviewerId: userId,
        revieweeId,
        rating,
        comment,
      });

      res.json(review);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });


  app.get('/api/vendor-profile', isAuthenticated, async (req: any, res) => {
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

  app.post('/api/vendor-profile', isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      const profile = await storage.createVendorProfile(
        req.body,
        userId
      );
      res.json(profile);
    } catch (error) {
      console.error("Error creating vendor profile:", error);
      res.status(500).json({ message: "Failed to create vendor profile" });
    }
  });

  app.put('/api/vendor-profile/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      const profileId = req.params.id;

      // Ensure user owns this profile
      const existingProfile = await storage.getVendorProfile(userId);
      if (!existingProfile || existingProfile.id !== profileId) {
        return res.status(403).json({ message: "Unauthorized to edit this profile" });
      }
      
      const profile = await storage.updateVendorProfile(profileId, req.body);
      res.json(profile);
    } catch (error) {
      console.error("Error updating vendor profile:", error);
      res.status(500).json({ message: "Failed to update vendor profile" });
    }
  });

  // AI Vetting endpoint for new vendor applications
  app.post('/api/vendor-profile/vet', isAuthenticated, async (req: any, res) => {
    try {
      const { vendorId, applicationData } = req.body;

      console.log('[AI VETTING] Starting vendor application review...');

      // Prepare comprehensive application summary for AI review
      const applicationSummary = `
Vendor Application Review Request:

Company Name: ${applicationData.companyName}
Professional Title: ${applicationData.title}
Years of Experience: ${applicationData.yearsOfExperience || 'Not provided'}

Business Description:
${applicationData.description}

Service Categories: ${applicationData.categories.join(', ')}
Skills: ${applicationData.skills.join(', ')}
Location: ${applicationData.location}
Hourly Rate: $${applicationData.hourlyRate}/hour

Certifications: ${applicationData.certifications?.length > 0 ? applicationData.certifications.join(', ') : 'None provided'}
Business License: ${applicationData.businessLicense || 'Not provided'}
Insurance: ${applicationData.insuranceInfo || 'Not provided'}

Past Performance:
${applicationData.pastPerformance?.length > 0 
  ? applicationData.pastPerformance.map((p: any) => `- ${p.projectName} for ${p.client}`).join('\n') 
  : 'No past performance data provided'}
`;

      // Call OpenAI for application vetting
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `You are an AI vetting system for GovScale Alliance, an AI-powered platform helping government contractors scale their businesses. 

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
}`
          },
          {
            role: "user",
            content: applicationSummary
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.3,
      });

      const vettingResult = JSON.parse(completion.choices[0].message.content || '{}');
      console.log('[AI VETTING] Result:', vettingResult);

      // Update vendor profile approval status
      if (vettingResult.approved && vettingResult.confidence === 'high') {
        await storage.updateVendorProfile(vendorId, { isApproved: true });
        console.log('[AI VETTING] Vendor approved automatically');
      } else if (vettingResult.recommendManualReview) {
        console.log('[AI VETTING] Flagged for manual review');
        vettingResult.feedback = vettingResult.feedback + " Your application has been flagged for manual review by our team.";
      } else {
        console.log('[AI VETTING] Vendor not approved automatically');
      }

      res.json({
        approved: vettingResult.approved && vettingResult.confidence === 'high',
        confidence: vettingResult.confidence,
        reasoning: vettingResult.reasoning,
        feedback: vettingResult.feedback,
        requiresManualReview: vettingResult.recommendManualReview
      });
    } catch (error) {
      console.error("Error vetting vendor application:", error);
      res.status(500).json({ 
        message: "Failed to vet vendor application",
        approved: false,
        feedback: "Technical error during vetting. Our team will review your application manually."
      });
    }
  });

  // Service request routes
  app.post('/api/service-requests', isAuthenticated, async (req: any, res) => {
    try {
      const contractorId = getUserId(req);
      if (!contractorId) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      // const { vendorId, serviceId } = req.body;
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
        status: "pending",
      });
      const existingRequest = await storage.getServiceRequest(serviceRequest?.id);
      await storage.createRequestLog({
        serviceRequestId: serviceRequest.id,
        action: "SERVICE REQUEST CREATED",
        performedBy: contractorId,
        previousStatus: serviceRequest.status ?? 'pending',
        newStatus: "pending",
         metadata: {
          performedByName: existingRequest?.vendor
          ? `${existingRequest.vendor.firstName} ${existingRequest.vendor.lastName ?? ""}`.trim()
          : "Vendor",
          serviceTitle: existingRequest?.service?.name ?? 'Service Title',
          requestTitle: existingRequest?.title ?? 'Request Title'
        }
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

  app.get('/api/service-requests', isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      const user = await storage.getUser(userId);
      
      let requests: any[] = [];
      if (user?.userType === 'contractor') {
        requests = await storage.getServiceRequestsByContractor(userId);
      } else if (user?.userType === 'vendor') {
        requests = await storage.getServiceRequestsByVendor(userId);
      }
      
      res.json(requests);
    } catch (error: any) {
        console.error("Error fetching service requests:", error);
        res.status(500).json({ 
          message: error.message,
          stack: error.stack 
        });
      }
  });

  // Seed sample vendors (development only)
  app.post('/api/seed-vendors', async (req, res) => {
    try {
      console.log('[SEED] Starting vendor seed...');
      
      // First, create demo users
      const demoUsers = [
        { id: 'demo-user-1', email: 'sarah@demo.com', userType: 'vendor' as const },
        { id: 'demo-user-2', email: 'marcus@demo.com', userType: 'vendor' as const },
        { id: 'demo-user-3', email: 'jennifer@demo.com', userType: 'vendor' as const }
      ];
      
      for (const user of demoUsers) {
        try {
          await storage.upsertUser(user);
          console.log(`[SEED] Created/updated user: ${user.id}`);
        } catch (e) {
          console.log(`[SEED] User ${user.id} might already exist, continuing...`);
        }
      }
      
      const sampleVendors = [
        {
          userId: 'demo-user-1',
          title: 'Federal Contract Attorney',
          companyName: 'Johnson Legal Group',
          categories: ['legal'] as any[],
          skills: ['Contract Review', 'Compliance', 'FAR/DFARS', 'Proposal Support'],
          hourlyRate: 150,
          rating: 4.9,
          reviewCount: 127,
          location: 'Washington, DC',
          responseTime: '2-4 hours',
          description: 'Specialized in federal contract law with 15+ years experience helping government contractors navigate complex regulatory requirements and ensure compliance.',
          isApproved: true
        },
        {
          userId: 'demo-user-2',
          title: 'Cybersecurity Specialist',
          companyName: 'SecureGov Solutions',
          categories: ['cybersecurity'] as any[],
          skills: ['FISMA Compliance', 'Risk Assessment', 'Security Audits', 'NIST Framework'],
          hourlyRate: 125,
          rating: 4.8,
          reviewCount: 89,
          location: 'Virginia Beach, VA',
          responseTime: '1-2 hours',
          description: 'Expert in government cybersecurity standards including FISMA, NIST, and DoD requirements.',
          isApproved: true
        },
        {
          userId: 'demo-user-3',
          title: 'Government Proposal Writer',
          companyName: 'ProposalPro Inc',
          categories: ['marketing'] as any[],
          skills: ['Proposal Writing', 'Technical Writing', 'Capture Management', 'Win Strategies'],
          hourlyRate: 95,
          rating: 4.7,
          reviewCount: 156,
          location: 'Arlington, VA',
          responseTime: '4-6 hours',
          description: 'Professional proposal writer with proven track record of winning federal contracts.',
          isApproved: true
        }
      ];

      const created = [];
      for (const vendor of sampleVendors) {
        try {
          const result = await storage.createVendorProfile(vendor as any);
          console.log(`[SEED] Created vendor: ${result.id} - ${result.title}`);
          created.push(result);
        } catch (e: any) {
          console.error(`[SEED] Error creating vendor ${vendor.title}:`, e.message);
        }
      }

      console.log(`[SEED] Completed! Created ${created.length} vendors`);
      res.json({ message: 'Sample vendors created', count: created.length, vendors: created });
    } catch (error: any) {
      console.error("[SEED] Error seeding vendors:", error.message, error.stack);
      res.status(500).json({ message: "Failed to seed vendors", error: error.message });
    }
  });

  app.post('/api/ai-match', isAuthenticated, async (req: any, res) => {
    try {
      const { description, priority, budget, vendorId } = req.body;
      if (vendorId) {
        const vendors = await storage.getVendors();
        const vendor = vendors.find(v => v.id === vendorId);

        if (!vendor) {
          return res.json({ matches: [] });
        }

        // Return single vendor as "matched"
        return res.json({
          matches: [vendor]
        });
      }
      // Get all approved vendors
      const vendors = await storage.getVendors();
      const approvedVendors = vendors.filter(v => v.isApproved);
      
      if (approvedVendors.length === 0) {
        return res.json({ matches: [] });
      }

      // Create vendor context for AI
      const vendorContext = approvedVendors.map(v => ({
        id: v.id,
        title: v.title,
        company: v.companyName,
        categories: v.categories,
        skills: v.skills,
        hourlyRate: v.hourlyRate,
        rating: v.rating,
        description: v.description
      }));

      // Call OpenAI for matching
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `You are an AI assistant that matches government contractors with service providers. 
            Analyze the service request and recommend the top 3 most suitable vendors from the provided list.
            Consider: skills match, category alignment, budget fit, and expertise level.
            Return ONLY a valid JSON array of vendor IDs in order of best match. Example: ["id1", "id2", "id3"]`
          },
          {
            role: "user",
            content: `Service Request: ${description}
            Priority: ${priority}
            Budget: ${budget}
            
            Available Vendors:
            ${JSON.stringify(vendorContext, null, 2)}
            
            Return only the top 3 vendor IDs as a JSON array.`
          }
        ],
        temperature: 0.7,
        max_tokens: 200
      });

      const aiResponse = completion.choices[0]?.message?.content || "[]";
      let matchedVendorIds: string[] = [];
      
      try {
        matchedVendorIds = JSON.parse(aiResponse);
      } catch (e) {
        console.error("Failed to parse AI response:", aiResponse);
        // Fallback to top rated vendors
        matchedVendorIds = approvedVendors
          .sort((a, b) => Number(b.rating || 0) - Number(a.rating || 0))
          .slice(0, 3)
          .map(v => v.id);
      }

      // Get full vendor details for matched vendors
      const matches = matchedVendorIds
        .map(id => approvedVendors.find(v => v.id === id))
        .filter(Boolean);

      res.json({ matches });
    } catch (error) {
      console.error("Error in AI matching:", error);
      res.status(500).json({ message: "Failed to process AI matching" });
    }
  });
  app.post("/api/services", isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);

      if (!userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const service = await storage.createService(req.body, userId);

      res.json(service);
    } catch (error) {
      console.error("Error creating service:", error);
      res.status(500).json({ message: "Failed to create service" });
    }
  });
  app.get("/api/all-services", async (req: any, res) => {
    try {
      const services = await storage.getAllServices();
      res.json(services);
    } catch (error) {
      console.error("Error fetching services:", error);
      res.status(500).json({ message: "Failed to fetch services" });
    }
  });
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
      console.error("Error fetching service:", error);
      res.status(500).json({ message: "Failed to fetch service" });
    }
  });

  app.get("/api/services", isAuthenticated, async (req: any, res) => {
    try {
      const vendorId = getUserId(req);

      if (!vendorId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const services = await storage.getVendorServices(vendorId);

      res.json(services);
    } catch (error) {
      console.error("Error fetching services:", error);
      res.status(500).json({ message: "Failed to fetch services" });
    }
  });
  app.get("/api/vendors/:vendorId/services", async (req, res) => {
    try {
      const { vendorId } = req.params;

      const vendorServices = await storage.getServicesByVendorId(vendorId);

      res.json(vendorServices);
    } catch (error) {
      console.error("Error fetching vendor services:", error);
      res.status(500).json({ message: "Failed to fetch vendor services" });
    }
  });
  app.get('/api/admin/vendors', isAuthenticated, isAdmin, getVendorsHandler);
  app.get('/api/admin/vendor-stats',isAuthenticated,isAdmin,
    async (req, res) => {
      const stats = await storage.getVendorCounts();
      res.json(stats);
    }
  );
  app.patch('/api/admin/vendors/:id/approve', isAuthenticated, isAdmin, async (req, res) => {
    const { id } = req.params;
    const { approve } = req.body;

    try {
      await storage.updateVendorApproval(id, approve); // Implement this in storage
      res.json({ success: true });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Failed to update vendor status" });
    }
  });
  app.get("/api/marketplace/services", isAuthenticated, async (req: any, res) => {
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

      const services = await storage.getMarketplaceServicesByStage(stage);
      res.json(services);
    } catch (error) {
      console.error("Error fetching marketplace services:", error);
      res.status(500).json({ message: "Failed to fetch services" });
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

      const { serviceRequestId, content } = req.body;

      const serviceRequest = await storage.getServiceRequest(serviceRequestId);
      if (!serviceRequest) {
        return res.status(404).json({ message: "Service request not found" });
      }

      if (
        serviceRequest.vendorId !== userId &&
        serviceRequest.contractorId !== userId
      ) {
        return res.status(403).json({ message: "Not authorized" });
      }

      const receiverId =
        serviceRequest.vendorId === userId
          ? serviceRequest.contractorId
          : serviceRequest.vendorId;

      const message = await storage.createMessage({
        serviceRequestId,
        senderId: userId,
        receiverId,
        content,
        messageType: "text",
      });
      await storage.createNotification({
        userId: receiverId,
        triggeredBy: message.senderId,
        title: "New Message",
        message: content.length > 100 
          ? content.substring(0, 100) + "..." 
          : content,
        type: "new_review",
        referenceId: serviceRequestId,
        isRead: false,
      });

      res.json(message);
    } catch (error) {
      console.error("Send message error:", error);
      res.status(500).json({ message: "Failed to send message" });
    }
  });
  app.get("/api/service-requests/:id/messages", isAuthenticated,async (req, res) => {
    try {
        const userId = getUserId(req);
        if (!userId) {
          return res.status(401).json({ message: "Not authenticated" });
        }

        const serviceRequestId = req.params.id;

        const serviceRequest = await storage.getServiceRequest(serviceRequestId);
        if (!serviceRequest) {
          return res.status(404).json({ message: "Service request not found" });
        }

        if (
          serviceRequest.vendorId !== userId &&
          serviceRequest.contractorId !== userId
        ) {
          return res.status(403).json({ message: "Not authorized" });
        }

      return res.json({
        serviceRequest: {
          id: serviceRequest.id,
          title: serviceRequest.title,
          vendorId: serviceRequest.vendorId,
          contractorId: serviceRequest.contractorId,
        },
        service: serviceRequest.service
          ? {
              id: serviceRequest.service.id,
              title: serviceRequest.service.name,
            }
          : null,
        participants: {
          vendorName: serviceRequest.vendor?.firstName,
          contractorName: serviceRequest.contractor?.firstName,
        },
        messages: serviceRequest.messages,
      });
      } catch (error) {
        console.error("Error fetching messages:", error);
        return res.status(500).json({
          message: "Failed to fetch messages",
        });
      }
    }
  );


  app.patch("/api/service-requests/:id/status", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const { id } = req.params;
      const { status } = req.body;

      const allowedStatuses = [
        "pending",
        "matched",
        "in_progress",
        "completed",
        "cancelled",
      ];

      if (!allowedStatuses.includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
      }

      const serviceRequest = await storage.getServiceRequest(id);

      if (!serviceRequest) {
        return res.status(404).json({ message: "Service request not found" });
      }

      // Only vendor can approve/reject
      if (serviceRequest.vendorId !== userId && serviceRequest.contractorId !== userId) {
        return res.status(403).json({ message: "Not authorized" });
      }
      const previousStatus = serviceRequest.status ?? 'pending';
      const updated = await storage.updateServiceRequestStatus(id, status);
      await storage.createRequestLog({
        serviceRequestId: id,
        action: "STATUS_UPDATED",
        performedBy: userId,
        previousStatus,
        newStatus: status,
      });

      res.json(updated);
    } catch (error) {
      console.error("Update status error:", error);
      res.status(500).json({ message: "Failed to update status" });
    }
  });
  app.get("/api/conversations", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const data = await storage.getUserServiceRequests(userId);
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
      const { id } = req.params;

      const updated = await storage.markNotificationAsRead(id, userId);

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
      const request = await storage.getServiceRequest(req.params.id);

      if (!request) {
        return res.status(404).json({ message: "Not found" });
      }
      const userId = getUserId(req);

      const alreadyReviewed = request.reviews?.some(
        (review) => review.reviewerId === userId
      );

      res.json({
        ...request,
        alreadyReviewed,
      });
    } catch (err) {
      res.status(500).json({ message: "Failed to fetch request" });
    }
  });
  app.post("/api/service-requests/:id/deliver", isAuthenticated, async (req, res) => {
  try {
      const serviceRequestId = req.params.id;
      // const userId = req.user?.id;
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const { message, attachments } = req.body;

      if (!message) {
        return res.status(400).json({ message: "Message is required" });
      }

      const existingRequest = await storage.getServiceRequest(serviceRequestId);
      const previousStatus = existingRequest?.status ?? 'pending';
      if (!existingRequest) {
        return res.status(404).json({ message: "Service request not found" });
      }

      // Optional: ensure only vendor can deliver
      if (existingRequest.vendorId !== userId) {
        return res.status(403).json({ message: "Only assigned vendor can deliver" });
      }

      const delivery = await storage.createDelivery({
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
         isRead: false,
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
        stack: err.stack
      });
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
 app.get("/api/admin/request-logs", isAdmin, async (req, res) => {
  try {
    const { requestId, page = "1", limit = "10" } = req.query;

    const result = await storage.getRequestLogs({
      requestId: requestId as string | undefined,
      page: Number(page),
      limit: Number(limit),
    });

    res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch logs",
    });
  }
});




  const httpServer = createServer(app);
  return httpServer;
}

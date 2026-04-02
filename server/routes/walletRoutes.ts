import { RequestHandler, Router } from "express";
import { storage } from "server/storage";
import { walletStorage } from "server/storage/walletStorage";
import { stripe } from "server/lib/stripe";
import { processVendorImport } from "server/services/vendorImportService";
import multer from "multer";
import * as XLSX from "xlsx";
import { vendorImportQueue } from "server/queues/vendorImportQueue";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // ✅ 5MB limit
  },
});
const router = Router();
const getUserId = (req: any): string | null => {
  return (req.session as any)?.userId || null;
};
const isAuthenticated: RequestHandler = async (req, res, next) => {
  const userId = (req.session as any)?.userId;
  
  if (!userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  
  next();
};
router.get("/balance", async (req: any, res) => {
  try {
    const userId = (req.session as any)?.userId;
    const balance = await walletStorage.getWalletBalance(userId);
      res.json({ balance });
  } catch (error) {
    res.status(400).json({
      message: error instanceof Error ? error.message : "Error",
    });
  }
});
router.get("/transactions", isAuthenticated, async (req, res) => {
  try {
    const userId = (req.session as any)?.userId;
    const transactions = await walletStorage.getWalletTransactionsByUserId(userId);
    res.json(transactions);
  } catch (error) {
    console.error(error);
    res.status(400).json({
      message: error instanceof Error ? error.message : "Error",
    });
  }
});

router.get("/admin-transactions", isAuthenticated, async (req, res) => {
  try {
    const userId = (req.session as any)?.userId;

    const transactions =
      await walletStorage.getWalletTransactions();

    res.json(transactions);
  } catch (error) {
    console.error(error);
    res.status(400).json({
      message: error instanceof Error ? error.message : "Error",
    });
  }
});

router.get("/connect-status", isAuthenticated, async (req: any, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const vendor = await storage.getVendorProfile(userId);

    if (!vendor?.stripeAccountId) {
      return res.json({ connected: false });
    }

    const account = await stripe.accounts.retrieve(
      vendor.stripeAccountId
    );

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
      }
    });
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
});
router.post("/withdraw", isAuthenticated, async (req: any, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const { amount } = req.body;

    const vendor = await storage.getVendorProfile(userId);

    if (!vendor?.stripePayoutsEnabled) {
      throw new Error("Stripe account not ready for payouts");
    }

    // 1️⃣ Check wallet balance
    const balance = await walletStorage.getWalletBalance(userId);

    if (balance < amount) {
      throw new Error("Insufficient balance");
    }

    // 2️⃣ Transfer to vendor
    await stripe.transfers.create({
      amount: Math.round(amount * 100),
      currency: "usd",
      destination: vendor.stripeAccountId,
    });

    // 3️⃣ Deduct wallet
    await walletStorage.debitWallet(
      userId,
      amount,
      "withdrawal"
    );

    res.json({ success: true });
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
});
router.post("/connect-account", isAuthenticated, async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ message: "Unauthorized" });
    const user= await storage.getUser(userId);
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

      await walletStorage.updateVendorStripeAccount(userId, {
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
router.get("/vendor/earnings", isAuthenticated, async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const page = Number(req.query.page || 1);
    const limit = Number(req.query.limit || 5);

    const result = await walletStorage.getVendorEarnings(
      userId,
      page,
      limit
    );

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
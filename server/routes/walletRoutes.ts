import { RequestHandler, Router } from "express";
import { storage } from "server/storage";
import { walletStorage } from "server/storage/walletStorage";
import { stripe } from "server/lib/stripe";

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
      return res.json({ status: "not_connected" });
    }

    const account = await stripe.accounts.retrieve(
      vendor.stripeAccountId
    );
console.log("🔍 STRIPE ACCOUNT:", {
  details_submitted: account.details_submitted,
  payouts_enabled: account.payouts_enabled,
  charges_enabled: account.charges_enabled,
  requirements: account.requirements,
});
    if (!account.details_submitted) {
  return res.json({ status: "not_connected" });
}

if (account.details_submitted && !account.payouts_enabled) {
  return res.json({ status: "pending_verification" });
}

if (account.payouts_enabled) {
  return res.json({ status: "verified" });
}

    return res.json({ status: "verified" });
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

    let vendor = await storage.getVendorProfile(userId);
    if (!vendor) return res.status(401).json({ message: "No vendor profile" });

    let accountId = vendor.stripeAccountId;

    // ✅ ONLY create if not exists
    if (!accountId) {
      const account = await stripe.accounts.create({
        type: "express",
        country: "US",
        email: "test@test.com",
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
export default router;
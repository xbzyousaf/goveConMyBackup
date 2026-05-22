import "dotenv/config";
import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import path from "path";
import vendorRoutes from "./routes/vendor.routes";
import contractorRoutes from "./routes/contractor.routes";
import adminRoutes from "./routes/admin.routes";
import fs from "fs";  
import bodyParser from "body-parser";
import { stripe } from "./lib/stripe";
import { storage } from "./storage";
import Stripe from "stripe";

const app = express();
export default app;

/* =========================
   GLOBAL MIDDLEWARE (KEEP SAME)
========================= */
app.use((req, res, next) => {
  if (req.originalUrl === "/api/stripe/webhook") {
    next(); // ✅ DO NOT PARSE BODY FOR STRIPE
  } else {
    express.json()(req, res, next);
  }
});

app.use((req, res, next) => {
  if (req.originalUrl === "/api/stripe/webhook") {
    next();
  } else {
    express.urlencoded({ extended: false })(req, res, next);
  }
});

/* =========================
  UPLOADS
========================= */
const uploadsPath = path.resolve(process.cwd(), "uploads");
if (!fs.existsSync(uploadsPath)) {
  fs.mkdirSync(uploadsPath, { recursive: true });
}

app.use("/uploads", express.static(uploadsPath));

/* =========================
   LOGGING
========================= */
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }
      log(logLine);
    }
  });

  next();
});

/* =========================
   SETUP FUNCTION (NEW - IMPORTANT)
========================= */
export async function setupApp() {
  // Stripe webhook
app.post(
  "/api/stripe/webhook",
  bodyParser.raw({ type: "application/json" }),
  async (req, res) => {
    const sig = req.headers["stripe-signature"];

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        sig!,
        process.env.STRIPE_WEBHOOK_SECRET!
      );
    } catch (err: any) {
      console.log("❌ Signature verification failed:", err.message);
      return res.sendStatus(400);
    }

    try {
      // ✅ CHECKOUT COMPLETED (Initial subscription trigger)
      if (event.type === "checkout.session.completed") {
        const session = event.data.object as Stripe.Checkout.Session;

        if (!session.subscription || !session.client_reference_id) {
          return res.sendStatus(200);
        }

        const userId = session.client_reference_id;

        const subscription = (await stripe.subscriptions.retrieve(
          session.subscription as string
        )) as Stripe.Subscription;

        // ✅ GET PURCHASED PRICE ID
        const item = subscription.items.data[0];
        const priceId = item.price.id;

        // ✅ DETECT PLAN
        let subscriptionTier: "beta" | "pilot" = "beta";

        if (priceId === process.env.STRIPE_PILOT_PRICE_ID) {
          subscriptionTier = "pilot";
        }

        if (priceId === process.env.STRIPE_BETA_PRICE_ID) {
          subscriptionTier = "beta";
        }

        // ✅ SAVE CORRECT PLAN
        await storage.upsertUserMaturityProfile({
          userId,
          subscriptionTier,
          stripeCustomerId: session.customer as string,
          stripeSubscriptionId: subscription.id,
        });
      }

      // ✅ SUBSCRIPTION CREATED (backup safety)
      if (event.type === "customer.subscription.created") {
      const subscription = event.data.object as Stripe.Subscription & {
        current_period_start?: number;
        current_period_end?: number;
      };

      const item = subscription.items.data[0];

      // 🔥 CRITICAL: get userId from metadata
      const userId = subscription.metadata?.userId;
      if (!userId) {
        return res.sendStatus(200);
      }
      // const existing = await storage.getSubscriptionByStripeId(subscription.id);
      const existingUserSub = await storage.getSubscriptionByUserId(userId);
      const periodStart = item.current_period_start
        ? new Date(item.current_period_start * 1000)
        : null;

      const periodEnd = item.current_period_end
        ? new Date(item.current_period_end * 1000)
        : null;

     if (existingUserSub) {
      const product = await stripe.products.retrieve(
        item.price.product as string
      );

      await storage.updateSubscriptionDetails(
        existingUserSub.stripeSubscriptionId!,
        {
          status: subscription.status,
          cancelAtPeriodEnd: subscription.cancel_at_period_end,
          currentPeriodStart: periodStart,
          currentPeriodEnd: periodEnd,

          // 🔥 IMPORTANT
          priceId: item.price.id,
          productId: item.price.product as string,
          planName: product.name || "Beta",
          amount: ((item.price.unit_amount ?? 0) / 100).toFixed(2),
          currency: item.price.currency,
          interval: item.price.recurring?.interval ?? null,
        }
      );

      return res.sendStatus(200);
    }


      if (!userId) {
        return res.sendStatus(200);
      }
      const product = await stripe.products.retrieve(
        item.price.product as string
      );
      let planName = "beta";

      if (item.price.id === process.env.STRIPE_PILOT_PRICE_ID) {
        planName = "pilot";
      }

      if (item.price.id === process.env.STRIPE_BETA_PRICE_ID) {
        planName = "beta";
      }
      await storage.createSubscription({
        userId,

        stripeCustomerId: subscription.customer as string,
        stripeSubscriptionId: subscription.id,
        status: subscription.status,

        priceId: item.price.id,
        productId: item.price.product as string,
        planName,
        amount: ((item.price.unit_amount ?? 0) / 100).toFixed(2),
        currency: item.price.currency,

        interval: item.price.recurring?.interval ?? null,

        currentPeriodStart: periodStart,

        currentPeriodEnd: periodEnd,

        cancelAtPeriodEnd: subscription.cancel_at_period_end,
      });
    }

      // ✅ SUBSCRIPTION UPDATED (renewals, upgrades, etc.)
      if (event.type === "customer.subscription.updated") {
         const subscription = event.data.object as Stripe.Subscription;
          const item = subscription.items.data[0];

          const periodStart = item.current_period_start
            ? new Date(item.current_period_start * 1000)
            : null;

          const periodEnd = item.current_period_end
            ? new Date(item.current_period_end * 1000)
            : null;

          await storage.updateSubscriptionDetails(subscription.id, {
            status: subscription.status,
            cancelAtPeriodEnd: subscription.cancel_at_period_end,
            currentPeriodStart: periodStart,
            currentPeriodEnd: periodEnd,
          });
      }

      // ❌ SUBSCRIPTION CANCELLED
      if (event.type === "customer.subscription.deleted") {
        const subscription = event.data.object as Stripe.Subscription;

        console.log("⚠️ subscription.deleted:", subscription.id);

        const sub = await storage.getSubscriptionByStripeId(
          subscription.id
        );

        if (sub) {
          await storage.upsertUserMaturityProfile({
            userId: sub.userId,
            subscriptionTier: "beta",
          });

          await storage.updateSubscriptionStatus(
            subscription.id,
            "canceled"
          );
        }
      }

      // =====================================================
      // ❌ PAYMENT FAILED
      // =====================================================
      if (event.type === "invoice.payment_failed") {
        const invoice = event.data.object as Stripe.Invoice & {
          subscription?: string;
        };

        if (!invoice.subscription) return res.sendStatus(200);

        const sub = await storage.getSubscriptionByStripeId(
          invoice.subscription as string
        );

        if (sub) {
          await storage.updateSubscriptionStatus(
            sub.stripeSubscriptionId!,
            "past_due"
          );
        }
      }

      res.sendStatus(200);
    } catch (error) {
      console.log("❌ Webhook error:", error);
      res.sendStatus(200);
    }
  }
);

  const server = await registerRoutes(app);
  app.use("/api", vendorRoutes);
  app.use("/api", contractorRoutes);
  app.use("/api/admin", adminRoutes);
  

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // Vite / Static
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  return server;
}

/* =========================
   🚀 START SERVER (ONLY NON-TEST)
========================= */
async function startServer() {
  const server = await setupApp();

  const port = parseInt(process.env.PORT || "5000", 10);

  server.listen(port, () => {
    log(`serving on port ${port}`);
  });
}

// 🔥 THIS LINE IS KEY
if (process.env.NODE_ENV !== "test") {
  startServer();
}

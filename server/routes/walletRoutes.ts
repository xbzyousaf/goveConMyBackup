import { Router } from "express";
import { db } from "../db";
import { wallets } from "@shared/schema";
import { eq } from "drizzle-orm";

const router = Router();
const getUserId = (req: any): string | null => {
  return (req.session as any)?.userId || null;
};
router.get("/balance", async (req: any, res) => {
  const userId = getUserId(req);
 if (!userId) return res.status(401).json({ message: "Not authenticated" });
  const wallet = await db.query.wallets.findFirst({
    where: eq(wallets.userId, userId),
  });
 if (!wallet) return res.status(401).json({ message: "Wallet not authenticated" });
  res.json({
    balance: Number(wallet?.balance ?? 0),
  });
});

export default router;
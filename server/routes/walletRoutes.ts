import { RequestHandler, Router } from "express";
import { walletStorage } from "server/storage/walletStorage";

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

router.get("/api/transactions", isAuthenticated, async (req, res) => {
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
export default router;
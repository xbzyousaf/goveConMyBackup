import { RequestHandler } from "express";
import { getUserId } from "server/utills/auth.util";
import { storage } from "server/storage";

export const isAdmin: RequestHandler = async (req: any, res, next) => {
  const userId = getUserId(req);
  if (!userId) return res.status(401).json({ message: "Not authenticated" });

  const user = await storage.getUser(userId);
  if (user?.userType !== 'admin') {
    return res.status(403).json({ message: "Admin access only" });
  }

  next();
};
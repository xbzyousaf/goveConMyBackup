import { RequestHandler } from "express";
import { getUserId } from "../utills/auth.util";
import { storage } from "../storage";

export const isVendor: RequestHandler = async (req: any, res, next) => {
  const userId = getUserId(req);
  if (!userId) return res.status(401).json({ message: "Not authenticated" });

  const user = await storage.getUser(userId);
  if (user?.userType !== 'vendor') {
    return res.status(403).json({ message: "Vendor access only" });
  }

  next();
};
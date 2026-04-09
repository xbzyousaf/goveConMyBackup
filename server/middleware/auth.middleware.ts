import { RequestHandler } from "express";

export const isAuthenticated: RequestHandler = (req: any, res, next) => {
  const userId = req.session?.userId;

  if (!userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  next();
};
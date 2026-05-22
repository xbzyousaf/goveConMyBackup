import { Request, Response, NextFunction } from "express";
import { upload } from "../utills/upload.util";

export const uploadAvatar = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  upload.single("avatar")(req, res, (error: any) => {

    if (error?.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({
        message: "Image size must be less than 3MB",
      });
    }

    if (error) {
      return res.status(400).json({
        message: error.message || "File upload failed",
      });
    }

    next();
  });
};
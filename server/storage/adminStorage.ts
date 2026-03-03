import { users } from "@shared/schema";
import { db } from "../db";
import { eq } from "drizzle-orm";

export const adminStorage = {

  async getAdmins() {
    const admins = await db.query.users.findMany({
      where: eq(users.userType, "admin"),
    });

    return admins; // returns array
  },

// end===============================
};
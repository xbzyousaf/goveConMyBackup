import { storage } from "server/storage";
import { vendorStorage }    from "../storage/vendorStorage";

const CHUNK_SIZE = process.env.CHUNK_SIZE ? parseInt(process.env.CHUNK_SIZE) : 50;

export async function processVendorImport(importId: string, rows: any[]) {
  let processed = 0;
  let success = 0;
  let failed = 0;
  const errors: any[] = [];

  await vendorStorage.updateVendorImport(importId, {
    status: "processing",
    totalRecords: rows.length,
    progress: 0,
  });

  for (let i = 0; i < rows.length; i += CHUNK_SIZE) {
    const chunk = rows.slice(i, i + CHUNK_SIZE);

    for (let j = 0; j < chunk.length; j++) {
      const row = chunk[j];
      const rowIndex = i + j + 1;

      try {
        if (row.status !== "agree to participate") {
          processed++;
          continue;
        }

        if (!row.email) {
          throw new Error("Missing email");
        }
        if (!row.pocName) {
        throw new Error("Missing POC Name");
        }

       const existingUser = await storage.getUserByEmail(row.email);

        if (existingUser) {
            throw new Error("Email already exists"); // ✅ now counted as failed
        }
        // Always derive email prefix first
        const emailPrefix = row.email.split("@")[0].trim();
        // Clean incoming username
        const providedUsername = row.username?.trim();
        // Step 1: decide base
        let finalUsername = providedUsername || emailPrefix;
        let usernameChanged = false;
        // Step 2: if provided username exists → switch to email prefix
        if (providedUsername) {
            const exists = await storage.getUserByUsername(providedUsername);
            if (exists) {
                finalUsername = emailPrefix; // ✅ FORCE switch
                usernameChanged = true;
            }
        }

            // Step 3: ensure uniqueness (ONLY using email prefix)
        let counter = 1;
            while (await storage.getUserByUsername(finalUsername)) {
            finalUsername = `${emailPrefix}${counter}`; // ✅ ALWAYS email prefix
            counter++;
            usernameChanged = true;
        }

            // Step 4: log info
        if (usernameChanged) {
            errors.push({
                row: rowIndex,
                message: `Username "${providedUsername || emailPrefix}" already exists. Assigned "${finalUsername}" extracting from email.`,
                type: "info",
            });
        }

        // Split name
        const [firstName, ...rest] = row.pocName.split(" ");
        const lastName = rest.join(" ");

        const user = await storage.createUser({
            email: row.email.trim(),
            password: "$2b$10$nF1vNKDQ4ysfRPTUxliE2e7q.ikwx.xdLHSM17AQE57gNZuPpZUS6",
            firstName,
            lastName,
            userType: "vendor",
             username: finalUsername,
            isEmailVerified: true,
        });

        const existingProfile = await storage.getVendorProfile(user.id);

        if (!existingProfile) {
          await storage.createVendorProfile(
            {
              companyName: row.companyName?.split("\n")[0] || "Unknown",
              title: row.service || row.category,
              categories: [mapCategory(row.category)],
              skills: [row.service],
              description: `${row.category} - ${row.service}`,
            },
            user.id
          );
        }

        success++;
      } catch (err: any) {
        failed++;

        errors.push({
          row: rowIndex,
          message: err.message,
        });
      }

      processed++;
    }

    // ✅ Update after each chunk
    await vendorStorage.updateVendorImport(importId, {
      processedRecords: processed,
      successRecords: success,
      failedRecords: failed,
      errors,
      progress: Math.round((processed / rows.length) * 100),
    });
  }

  await vendorStorage.updateVendorImport(importId, {
    status: "completed",
    progress: 100, // ✅ FIX
  });
}

type ServiceCategory =
  | "legal"
  | "hr"
  | "finance"
  | "cybersecurity"
  | "marketing"
  | "business_tools";

function mapCategory(category: string): ServiceCategory {
  const normalized = category?.trim().toLowerCase();

  const map: Record<string, ServiceCategory> = {
    "hr and talent": "hr",
    "legal and compliance": "legal",
    "finance and accounting": "finance",
    "it": "cybersecurity",
    "marketing": "marketing",
    "insurance": "finance",
    "business tools": "business_tools",
    "proposal": "business_tools",
  };

  return map[normalized] ?? "business_tools";
}
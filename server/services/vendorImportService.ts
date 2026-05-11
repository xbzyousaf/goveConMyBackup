import { storage } from "../storage";
import { vendorStorage }    from "../storage/vendorStorage";
import { adminStorage }    from "../storage/adminStorage";
import { ServiceCategory } from "../../shared/types/service";

const CHUNK_SIZE = process.env.CHUNK_SIZE ? parseInt(process.env.CHUNK_SIZE) : 50;
function resolveCompanyName(companyName?: string, email?: string): string {
  if (!companyName) return deriveFromEmail(email);

  let cleaned = companyName.split("\n")[0].trim();

  // Detect URL or domain-like string
  if (
    cleaned.includes("http") ||
    cleaned.includes("www") ||
    cleaned.includes(".com") ||
    cleaned.includes(".net") ||
    cleaned.includes(".org")
  ) {
    try {
      const normalizedUrl = cleaned.startsWith("http")
        ? cleaned
        : `https://${cleaned}`;

      const url = new URL(normalizedUrl);

      let domain = url.hostname.replace("www.", "");

      // 🔥 remove TLD (.com, .net, etc.)
      domain = domain.split(".")[0];

      return capitalizeWords(domain);
    } catch {
      // fallback if URL parsing fails
      return capitalizeWords(
        cleaned.replace(/\.(com|net|org|io|co|gov).*/i, "")
      );
    }
  }

  return cleaned;
}
function deriveFromEmail(email?: string): string {
  if (!email) return "Unknown";

  const name = email.split("@")[0];
  return capitalizeWords(name);
}
function capitalizeWords(str: string): string {
  return str
    .replace(/[^a-zA-Z0-9 ]/g, " ")
    .split(" ")
    .filter(Boolean)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}
export async function processVendorImport(importId: string, rows: any[]) {
  let processed = 0;
  let success = 0;
  let failed = 0;
  const errors: any[] = [];

  await adminStorage.updateVendorImport(importId, {
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
        if (!user) {
          throw new Error("Failed to create user");
        }
        const existingProfile = await storage.getVendorProfile(user.id);

        if (!existingProfile) {
          
          await vendorStorage.createVendorProfile(
            {
              companyName: resolveCompanyName(row.companyName, row.email),
              title: row.service || row.category,
              categories: [mapCategory(row.category)],
              skills: [row.service],
              description: `${row.category} - ${row.service}`,
              isApproved: true,
              hourlyRate: '30.00',
            },
            user.id
          );
        }
        await vendorStorage.createService({
          vendorId: user.id,
          name: row.service || "General Service",
          description: `${row.category} - ${row.service}`,
          category: mapCategory(row.category),

          pricingModel: "hourly",
          priceMin: "20",
          priceMax: "30",

          isActive: true,
        }, user.id);

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
    await adminStorage.updateVendorImport(importId, {
      processedRecords: processed,
      successRecords: success,
      failedRecords: failed,
      errors,
      progress: Math.round((processed / rows.length) * 100),
    });
  }

  await adminStorage.updateVendorImport(importId, {
    status: "completed",
    progress: 100, // ✅ FIX
  });
}

function mapCategory(category: string): ServiceCategory {
  const normalized = category?.trim().toLowerCase();

  const map: Record<string, ServiceCategory> = {
    "hr and talent": "hr",
    "legal and compliance": "legal",
    "finance and accounting": "finance",
    "it": "cybersecurity",
    "marketing": "marketing",
    "insurance": "insurance",
    "business tools": "business_tools",
    "proposal": "business_tools",
  };

  return map[normalized] ?? "business_tools";
}
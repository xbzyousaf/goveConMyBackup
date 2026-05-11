import { Router } from "express";
import { isAuthenticated } from "../middleware/auth.middleware";
import { getUserId } from "../utills/auth.util";
import { isAdmin } from "../middleware/admin.middleware";
import { storage } from "../storage";
import type { RequestHandler } from "express";
import { vendorImportQueue } from "../queues/vendorImportQueue";
import { adminStorage } from "../storage/adminStorage";
import multer from "multer";
import * as XLSX from "xlsx";
import { processVendorImport } from "../services/vendorImportService";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // ✅ 5MB limit
  },
});
const router = Router();

const getVendorsHandler = async (req: any, res: any) => {
  const userId = getUserId(req);
  if (!userId) {
    return res.status(401).json({ message: "Not authenticated" });
  }
  try {
    const vendors = await adminStorage.getOnlyVendors();
    res.json(vendors);
  } catch (error) {
    console.error("Error fetching vendors:", error);
    res.status(500).json({ message: "Failed to fetch vendors" });
  }
};
router.get('/vendors', isAuthenticated, isAdmin, getVendorsHandler);
router.patch('/vendors/:id/approve', isAuthenticated, isAdmin, async (req, res) => {
    const { id } = req.params;
    const { approve } = req.body;

    try {
      await adminStorage.updateVendorApproval(id, approve); // Implement this in storage
      res.json({ success: true });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Failed to update vendor status" });
    }
  });
 router.get("/request-logs", isAuthenticated, isAdmin, async (req, res) => {
  try {
    const { requestId, page = "1", limit = "10" } = req.query;

    const result = await adminStorage.getRequestLogs({
      requestId: requestId as string | undefined,
      page: Number(page),
      limit: Number(limit),
    });

    res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch logs",
    });
  }
});

router.get("/all-services", isAuthenticated, isAdmin, async (req: any, res) => {
try {
    const services = await adminStorage.getAllServices();
    res.json(services);
} catch (error) {
    if (error instanceof Error) {
      return res.status(400).json({ message: error.message });
    }

    res.status(500).json({ message: "Internal server error" });
  }
});
router.patch("/services/:id/status", isAuthenticated, isAdmin, async (req: any, res) => {
  try {
    const userId = getUserId(req);
    
    if (!userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const { isActive } = req.body;
    const serviceId = req.params.id;

    if (typeof isActive !== "boolean") {
      return res.status(400).json({
        message: "isActive must be true or false",
      });
    }

    const service = await storage.updateServiceStatus(serviceId, isActive);

    res.json(service);
  } catch (error) {
    console.error("Error updating service status:", error);

    res.status(500).json({
      message: "Failed to update service status",
    });
  }
});
router.get('/vendor-stats',isAuthenticated, isAdmin, async (req, res) => {
    const stats = await adminStorage.getVendorCounts();
    res.json(stats);
}
);
router.get("/milestones", isAuthenticated, async (req, res) => {
  try {
    const stages = await adminStorage.getMilestones();
    res.json(stages);
  } catch (error) {
    console.error("Error fetching stages:", error);
    res.status(500).json({
      message: "Failed to fetch Mile Stones",
    });
  }
});
router.post("/milestones", isAuthenticated, isAdmin, async (req, res) => {
  try {
    const milestone = await adminStorage.createProcessMilestone(req.body);

    res.json(milestone);

  } catch (error) {
      if (error instanceof Error) {
        return res.status(400).json({
          message: error.message
        });
      }

      res.status(500).json({
        message: "Internal server error"
      });
    }
});
router.put("/milestones/:id", isAuthenticated, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const updated = await adminStorage.updateMilestone(id, req.body);

    res.json(updated);
  } catch (err: any) {
    res.status(400).json({
      message: err.message || "Failed to update milestone",
    });
  }
});
router.get("/milestones/:id", isAuthenticated, async (req, res) => {
  try {
    const { id } = req.params;

    const milestone = await adminStorage.getMilestoneById(id);

    res.json(milestone);
  } catch (error: any) {
        console.error("Error fetching service requests:", error);
        res.status(500).json({ 
          message: error.message,
          stack: error.stack 
        });
      }
});
router.get('/disputed-requests', isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      const user = await storage.getUser(userId);
      // pagination params
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 5;
      const offset = (page - 1) * limit;
      const status = req.query.status;
      let total = 0;
      let requests: any[] = [];

      if (user?.userType === 'admin') {
        requests = await adminStorage.getAllServiceRequestsWithDisputes(limit, offset);
        total = await adminStorage.countAllServiceRequestsWithDisputes();
      }

      res.json({
        page,
        limit,
        total,
        data: requests
      });
    } catch (error: any) {
        console.error("Error fetching service requests:", error);
        res.status(500).json({ 
          message: error.message,
          stack: error.stack 
        });
      }
  });
router.get("/admin-transactions", isAuthenticated, isAdmin, async (req, res) => {
  try {
    const userId = (req.session as any)?.userId;

    const transactions =
      await storage.getWalletTransactions();

    res.json(transactions);
  } catch (error) {
    console.error(error);
    res.status(400).json({
      message: error instanceof Error ? error.message : "Error",
    });
  }
});
// ✅ Save and Get vendor imports
router.post("/vendor/import", (req, res, next) => {upload.single("file")(req, res, function (err: any) 
{
      if (err) {
        return res.status(400).json({
          message:
            err.code === "LIMIT_FILE_SIZE"
              ? "File too large (max 5MB)"
              : err.message,
        });
      }
      next();
    });
  },
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "File required" });
      }

      const workbook = XLSX.read(req.file.buffer, { type: "buffer" });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(sheet);

      const importRecord = await adminStorage.createVendorImport({
        fileName: req.file.originalname,
        status: "pending",
      });

      // ✅ async background (non-blocking)
      setImmediate(async () => {
        try {
          await processVendorImport(importRecord.id, rows);
        } catch (err) {
          console.error("Import failed:", err);

          await adminStorage.updateVendorImport(importRecord.id, {
            status: "failed",
          });
        }
      });
      // await vendorImportQueue.add("import-job", {
      //   importId: importRecord.id,
      //   rows,
      // }, {
      //   attempts: 3,
      //   backoff: {
      //     type: "exponential",
      //     delay: 5000,
      //   },
      // });

      return res.json({
        message: "Import started",
        importId: importRecord.id,
      });
    } catch (err: any) {
      return res.status(500).json({
        message: err.message || "Import failed",
      });
    }
  }
);
router.get("/vendor/imports", async (req, res) => {
  try {
    const data = await adminStorage.getVendorImports();
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});
router.delete("/vendors/:id", isAuthenticated, isAdmin, async (req, res) => {
  try {
    const vendorId = req.params.id;

    // 1. Delete user (this will cascade everything)
    const result = await adminStorage.deleteVendor(vendorId);
    if (!result) {
      return res.status(404).json({ message: "Vendor not found/not deleted" });
    }

    return res.json({ success: true });
  } catch (error) {
      if (error instanceof Error) {
        return res.status(400).json({
          message: error.message
        });
      }

      res.status(500).json({
        message: "Internal server error"
      });
    }
});
router.delete("/services/:id", isAuthenticated, isAdmin, async (req, res) => {
  try {
    const serviceId = req.params.id;

    const result = await adminStorage.deleteService(serviceId);

    if (!result) {
      return res.status(404).json({ message: "Service not found" });
    }

    return res.json({ success: true });
  } catch (error) {
      if (error instanceof Error) {
        return res.status(400).json({
          message: error.message
        });
      }

      res.status(500).json({
        message: "Internal server error"
      });
    }
});
router.delete("/vendor/import/:id", isAuthenticated, isAdmin, async (req, res) => {
  try {
    const importId = req.params.id;

    const result = await adminStorage.deleteVendorImport(importId);

    if (!result) {
      return res.status(404).json({ message: "Import not found" });
    }

    return res.json({ success: true });
  } catch (error) {
      if (error instanceof Error) {
        return res.status(400).json({
          message: error.message
        });
      }

      res.status(500).json({
        message: "Internal server error"
      });
    }
});
// ================= CATEGORY ROUTES =================

// GET all categories
router.get("/categories", isAuthenticated, async (req, res) => {
  try {
    const data = await adminStorage.getCategories();
    res.json(data);
  } catch (error) {
      if (error instanceof Error) {
        return res.status(400).json({
          message: error.message
        });
      }

      res.status(500).json({
        message: "Internal server error"
      });
    }
});

// CREATE
router.post("/categories", isAuthenticated, isAdmin, async (req, res) => {
  try {
    const category = await adminStorage.createCategory(req.body);
    res.json(category);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
});

// UPDATE
router.put("/categories/:id", isAuthenticated, isAdmin, async (req, res) => {
  try {
    const category = await adminStorage.updateCategory(
      req.params.id,
      req.body
    );
    res.json(category);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
});
router.get("/categories/:id", isAuthenticated, isAdmin, async (req, res) => {
  try {
    const category = await adminStorage.getCategory(
      req.params.id
    );
    res.json(category);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
});

// DELETE
router.delete("/categories/:id", isAuthenticated, isAdmin, async (req, res) => {
  try {
    const success = await adminStorage.deleteCategory(req.params.id);

    if (!success) {
      return res.status(404).json({ message: "Category not found" });
    }

    res.json({ success: true });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
});

export default router;
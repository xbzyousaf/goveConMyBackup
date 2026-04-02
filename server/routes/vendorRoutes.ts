import { Router } from "express";
import { vendorStorage } from "server/storage/vendorStorage";
import multer from "multer";
import * as XLSX from "xlsx";
import { vendorImportQueue } from "server/queues/vendorImportQueue";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // ✅ 5MB limit
  },
});
const router = Router();

router.post("/import", (req, res, next) => {upload.single("file")(req, res, function (err: any) 
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

      const importRecord = await vendorStorage.createVendorImport({
        fileName: req.file.originalname,
        status: "pending",
      });

      // ✅ async background (non-blocking)
      await vendorImportQueue.add("import-job", {
        importId: importRecord.id,
        rows,
      }, {
        attempts: 3,
        backoff: {
          type: "exponential",
          delay: 5000,
        },
      });

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

// ✅ Get imports
router.get("/imports", async (req, res) => {
  try {
    const data = await vendorStorage.getVendorImports();
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
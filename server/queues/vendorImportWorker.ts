import "dotenv/config";
import { Worker } from "bullmq";
import { processVendorImport } from "../services/vendorImportService";

const worker = new Worker(
  "vendor-import",
  async (job) => {
    const { importId, rows } = job.data;
    await processVendorImport(importId, rows);
  },
  {
    connection: {
      host: "127.0.0.1",
      port: 6379,
    },
  }
);
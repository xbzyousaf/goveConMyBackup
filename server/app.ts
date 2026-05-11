import express from "express";

import vendorRoutes from "./routes/vendor.routes";
import contractorRoutes from "./routes/contractor.routes";
import adminRoutes from "./routes/admin.routes";

const app = express();

app.use(express.json());

app.use("/api", vendorRoutes);
app.use("/api", contractorRoutes);
app.use("/api/admin", adminRoutes);

export default app;
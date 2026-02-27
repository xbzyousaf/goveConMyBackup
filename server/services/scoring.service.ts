import { storage } from "../storage";

export const scoringService = {
  // ===============================
  // 1️⃣ NORMAL COMPLETION
  // ===============================
  async handleRequestCompletion(serviceRequest: any) {
    const vendorId = serviceRequest.vendorId;
    const contractorId = serviceRequest.contractorId;

    if (!vendorId) return;

    // 🔹 Update vendor counters
    await storage.incrementVendorMetrics(vendorId, {
      totalRequests: 1,
      completedRequests: 1,
      onTimeDeliveries:
        serviceRequest.deliveredAt &&
        serviceRequest.deliveryDeadline &&
        new Date(serviceRequest.deliveredAt) <=
          new Date(serviceRequest.deliveryDeadline)
          ? 1
          : 0,
    });

    // 🔹 Update contractor maturity profile
    if (contractorId) {
      await storage.incrementContractorScore(contractorId, 1);
    }

    // 🔹 Recalculate vendor score
    await this.recalculateVendorScore(vendorId);
  },

  // ===============================
  // 2️⃣ AUTO COMPLETION
  // ===============================
  async handleAutoCompletion(serviceRequest: any) {
    const vendorId = serviceRequest.vendorId;
    const contractorId = serviceRequest.contractorId;

    if (!vendorId) return;

    await storage.incrementVendorMetrics(vendorId, {
      totalRequests: 1,
      completedRequests: 1,
      autoCompletedRequests: 1,
    });

    if (contractorId) {
      await storage.incrementContractorScore(contractorId, -1);
      await storage.incrementAutoCompletionPenalty(contractorId);
    }

    await this.recalculateVendorScore(vendorId);
  },

  // ===============================
  // 3️⃣ DISPUTE RESOLUTION
  // ===============================
  async handleDisputeResolution(dispute: any) {
    const serviceRequest = await storage.getServiceRequest(
      dispute.serviceRequestId
    );
    if (!serviceRequest) return;

    const vendorId = serviceRequest.vendorId;
    const contractorId = serviceRequest.contractorId;

    if (dispute.resolution === "vendor_won") {
      if (contractorId) {
        await storage.incrementContractorScore(contractorId, -3);
      }
    }

    if (dispute.resolution === "contractor_won") {
      if (vendorId) {
        await storage.incrementVendorDisputesLost(vendorId);
        await this.recalculateVendorScore(vendorId);
      }

      if (contractorId) {
        await storage.incrementContractorScore(contractorId, 1);
      }
    }
  },

  // ===============================
  // 4️⃣ RE-CALCULATE VENDOR SCORE
  // ===============================
  async recalculateVendorScore(vendorId: string) {
    const profile = await storage.getVendorProfile(vendorId);
    if (!profile) return;

    const {
      totalRequests = 0,
      completedRequests = 0,
      onTimeDeliveries = 0,
      disputesLost = 0,
      rating = 0,
      responseTime = 0,
    } = profile;

    if (totalRequests === 0) {
      await storage.updateVendorScore(vendorId, 0);
      return;
    }

    const completionRate = completedRequests / totalRequests;
    const ratingNormalized = rating / 5;
    const onTimeRate =
      completedRequests === 0 ? 0 : onTimeDeliveries / completedRequests;
    const disputeRate = disputesLost / totalRequests;

    // Response score normalization (example logic)
    const responseScore =
      responseTime <= 1
        ? 1
        : responseTime <= 3
        ? 0.8
        : responseTime <= 6
        ? 0.6
        : 0.4;

    const finalScore =
      completionRate * 30 +
      ratingNormalized * 30 +
      onTimeRate * 20 +
      responseScore * 10 -
      disputeRate * 10;

    await storage.updateVendorScore(vendorId, Number(finalScore.toFixed(2)));
  },
};
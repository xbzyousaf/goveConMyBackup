// server/services/escrowService.ts

import { storage } from "../storage";
import { walletStorage } from "server/storage/walletStorage";
import { stripe } from "server/lib/stripe";

export async function releaseEscrow(
  serviceRequest: any,
  winner: "vendor" | "contractor" | "partial",
  vendorPercent?: number
) {

  const escrow = await storage.getEscrowByRequestId(serviceRequest.id);

  if (!escrow) {
    throw new Error("Escrow not found");
  }

  if (escrow.status !== "held" && escrow.status !== "disputed") {
    throw new Error("Escrow already processed");
  }
  if (!escrow.paymentIntentId) {
    throw new Error("Missing paymentIntentId");
  }

  if (!escrow.chargeId) {
    throw new Error("Missing chargeId");
  }

  const vendorEarning = Number(escrow.vendorEarning);
  const platformFee = Number(escrow.platformFee);

  // Vendor wins
  // if (winner === "vendor") {

  //   await walletStorage.creditWallet(
  //     serviceRequest.vendorId,
  //     vendorEarning,
  //     "escrow_release",
  //     serviceRequest.id
  //   );

  // }
  if (winner === "vendor") {
  const vendor = await storage.getVendorProfile(serviceRequest.vendorId);

  if (!vendor?.stripeAccountId) {
    throw new Error("Vendor not connected with Stripe");
  }

  await stripe.transfers.create({
    amount: Math.round(vendorEarning * 100),
    currency: "usd",
    destination: vendor.stripeAccountId,
    source_transaction: escrow.chargeId,
  }, {
    idempotencyKey: `escrow-${serviceRequest.id}-vendor`
  });
}

if (winner === "contractor") {
  await stripe.refunds.create({
    payment_intent: escrow.paymentIntentId,
  }, {
    idempotencyKey: `escrow-${serviceRequest.id}-refund`
  });
}

if (winner === "partial") {
  if (!vendorPercent) throw new Error("Vendor percent required");

  const vendorAmount = (vendorEarning * vendorPercent) / 100;
  const contractorAmount = vendorEarning - vendorAmount;

  if (vendorAmount > 0) {
    const vendor = await storage.getVendorProfile(serviceRequest.vendorId);

    if (!vendor?.stripeAccountId) {
      throw new Error("Vendor not connected");
    }

    await stripe.transfers.create({
      amount: Math.round(vendorAmount * 100),
      currency: "usd",
      destination: vendor.stripeAccountId,
      source_transaction: escrow.chargeId,
    }, {
      idempotencyKey: `escrow-${serviceRequest.id}-partial-vendor`
    });
  }

  if (contractorAmount > 0) {
    await stripe.refunds.create({
      payment_intent: escrow.paymentIntentId,
      amount: Math.round(contractorAmount * 100),
    }, {
      idempotencyKey: `escrow-${serviceRequest.id}-partial-refund`
    });
  }
}
  await storage.releaseEscrowByRequestId(
    serviceRequest.id,
    winner,
    vendorPercent
  );
}
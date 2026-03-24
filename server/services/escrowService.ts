// server/services/escrowService.ts

import { storage } from "../storage";
import { walletStorage } from "server/storage/walletStorage";

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

  const vendorEarning = Number(escrow.vendorEarning);
  const platformFee = Number(escrow.platformFee);

  // Vendor wins
  if (winner === "vendor") {

    await walletStorage.creditWallet(
      serviceRequest.vendorId,
      vendorEarning,
      "escrow_release",
      serviceRequest.id
    );

  }

  // Contractor wins
  if (winner === "contractor") {

    await walletStorage.creditWallet(
      serviceRequest.contractorId,
      vendorEarning + platformFee,
      "escrow_refund",
      serviceRequest.id
    );

  }

  // Partial win
  if (winner === "partial") {

    if (!vendorPercent) {
      throw new Error("Vendor percent required");
    }

    const vendorAmount = (vendorEarning * vendorPercent) / 100;
    const contractorAmount = vendorEarning - vendorAmount;

    if (vendorAmount > 0) {
      await walletStorage.creditWallet(
        serviceRequest.vendorId,
        vendorAmount,
        "escrow_release",
        serviceRequest.id
      );
    }

    if (contractorAmount > 0) {
      await walletStorage.creditWallet(
        serviceRequest.contractorId,
        contractorAmount,
        "escrow_refund",
        serviceRequest.id
      );
    }
  }

  await storage.releaseEscrowByRequestId(
    serviceRequest.id,
    winner,
    vendorPercent
  );
}
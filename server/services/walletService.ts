import { db } from "../db";
import { wallets, walletTransactions } from "@shared/schema";
import { eq } from "drizzle-orm";

export async function creditWallet(userId: string, amount: number, type: string, referenceId?: string) {
  const wallet = await db.query.wallets.findFirst({
    where: eq(wallets.userId, userId),
  });

  if (!wallet) throw new Error("Wallet not found");

  await db.transaction(async (tx) => {
    await tx
      .update(wallets)
      .set({
        balance: (Number(wallet.balance) + amount).toFixed(2),
      })
      .where(eq(wallets.id, wallet.id));

    await tx.insert(walletTransactions).values({
      walletId: wallet.id,
      amount: amount.toFixed(2),
      type,
      referenceId,
    });
  });
}

export async function debitWallet(userId: string, amount: number, type: string, referenceId?: string) {
  const wallet = await db.query.wallets.findFirst({
    where: eq(wallets.userId, userId),
  });

  if (!wallet) throw new Error("Wallet not found");

  if (Number(wallet.balance) < amount) {
    throw new Error("Insufficient balance");
  }

  await db.transaction(async (tx) => {
    await tx
      .update(wallets)
      .set({
        balance: (Number(wallet.balance) - amount).toFixed(2),
      })
      .where(eq(wallets.id, wallet.id));

    await tx.insert(walletTransactions).values({
      walletId: wallet.id,
      amount: amount.toFixed(2),
      type,
      referenceId,
    });
  });
}
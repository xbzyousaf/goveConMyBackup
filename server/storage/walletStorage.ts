import { db } from "../db";
import { wallets, walletTransactions } from "@shared/schema";
import { eq } from "drizzle-orm";

export const walletStorage = {
 async creditWallet(userId: string, amount: number, type: string, referenceId?: string) {
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
},

async debitWallet(userId: string, amount: number, type: string, referenceId?: string) {
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
},

async getWalletBalance(userId: string) {
  const wallet = await db.query.wallets.findFirst({
    where: eq(wallets.userId, userId),
  });

  if (!wallet) {
    throw new Error("Wallet not found");
  }

  return Number(wallet.balance ?? 0);
},

async getWalletTransactionsByUserId(userId: string) {
  const wallet = await db.query.wallets.findFirst({
    where: eq(wallets.userId, userId),
  });

  if (!wallet) throw new Error("Wallet not found");

  return await db.query.walletTransactions.findMany({
    where: eq(walletTransactions.walletId, wallet.id),
    orderBy: (walletTransactions, { desc }) => [
      desc(walletTransactions.createdAt),
    ],
  });
},
async getWalletByUserId(userId: string) {
  return await db.query.wallets.findFirst({
    where: eq(wallets.userId, userId),
  });
},


async getWalletTransactions() {
  return await db.query.walletTransactions.findMany({
    columns: {
      id: true,
      amount: true,
      type: true,
      referenceId: true,
      createdAt: true,
    },

    with: {
      wallet: {
        columns: {
          id: true,
          balance: true,
        },

        with: {
          user: {
            columns: {
              firstName: true,
              lastName: true,
            },
          },
        },
      },

      serviceRequests: {
        columns: {
          title: true,
          description: true,
        },
      },
    },

    orderBy: (wt, { desc }) => [desc(wt.createdAt)],
  });
}

  // end===============================
}
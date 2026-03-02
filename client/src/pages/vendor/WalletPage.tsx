import { useEffect, useState } from "react";

export default function WalletPage() {
  const [transactions, setTransactions] = useState([]);
  const [balance, setBalance] = useState(0);

  useEffect(() => {
    fetch("/api/wallet/balance", { credentials: "include" })
      .then(res => res.json())
      .then(data => setBalance(data.balance));

    fetch("/api/wallet/transactions", { credentials: "include" })
      .then(res => res.json())
      .then(data => setTransactions(data));
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Wallet</h1>

      <div className="mb-6 text-lg">
        Balance: ${balance}
      </div>

      <div className="space-y-3">
        {transactions.map((tx: any) => (
          <div
            key={tx.id}
            className="border p-3 rounded flex justify-between"
          >
            <div>
              <div className="font-medium">{tx.type}</div>
              <div className="text-sm text-gray-500">
                {new Date(tx.createdAt).toLocaleString()}
              </div>
            </div>

            <div
              className={
                tx.type.includes("release")
                  ? "text-green-600"
                  : "text-red-600"
              }
            >
              {tx.type.includes("release") ? "+" : "-"}
              ${tx.amount}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
import { useState } from "react";
import { AdminLayout } from "./AdminLayouts";
import { Header } from "@/components/Header";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";

export default function AdminRequestLogs() {
  const [page, setPage] = useState(1);
  const [requestId, setRequestId] = useState("");
  const limit = 10;

  const { data, isLoading } = useQuery({
    queryKey: ["request-logs", page, requestId],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
      });

      if (requestId) {
        params.append("requestId", requestId);
      }

      const res = await fetch(
        `/api/admin/request-logs?${params.toString()}`
      );

      if (!res.ok) throw new Error("Failed");

      return res.json();
    },
    keepPreviousData: true,
  });

  const logs = data?.data;
  const meta = data?.meta;

  return (
    <div>
      <Header />

      <AdminLayout>
        <div className="space-y-6">
          <h2 className="text-2xl font-bold">Request Audit Logs</h2>

          {/* 🔎 Search Filter */}
          <div className="flex gap-4 items-center">
            <input
              type="text"
              placeholder="Filter by Request ID"
              value={requestId}
              onChange={(e) => {
                setPage(1); // reset to first page when filtering
                setRequestId(e.target.value);
              }}
              className="border p-2 rounded w-64"
            />

            <button
              onClick={() => {
                setRequestId("");
                setPage(1);
              }}
              className="px-4 py-2 border rounded"
            >
              Clear
            </button>
          </div>

          {isLoading && <p>Loading...</p>}

          {!isLoading && logs?.length === 0 && (
            <p>No logs found.</p>
          )}

          {/* 🔹 Logs List */}
          {logs?.map((log: any) => (
            <Card key={log.id} className="p-4 space-y-1">
              <p className="font-semibold">{log.action}</p>

              <p className="text-sm text-muted-foreground">
                Request: {log.serviceRequestId}
              </p>

              {log.previousStatus && log.newStatus && (
                <p className="text-sm">
                  {log.previousStatus} → {log.newStatus}
                </p>
              )}

              {/* Metadata */}
              {log.metadata && (
                <div className="text-xs bg-gray-100 p-2 rounded mt-2">
                  <strong>Metadata:</strong>
                  <pre>
                    {JSON.stringify(log.metadata, null, 2)}
                  </pre>
                </div>
              )}

              <p className="text-xs text-muted-foreground">
                {new Date(log.createdAt).toLocaleString()}
              </p>
            </Card>
          ))}

          {/* 🔹 Pagination */}
          {meta && meta.totalPages > 1 && (
            <div className="flex gap-4 items-center pt-4">
              <button
                disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}
                className="px-4 py-2 border rounded"
              >
                Previous
              </button>

              <span>
                Page {meta.page} of {meta.totalPages}
              </span>

              <button
                disabled={page === meta.totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="px-4 py-2 border rounded"
              >
                Next
              </button>
            </div>
          )}
        </div>
      </AdminLayout>
    </div>
  );
}

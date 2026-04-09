import { useState, useEffect} from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Header } from "@/components/Header";
import { AdminLayout } from "./AdminLayouts";
import { useToast } from "@/hooks/use-toast";
import { useRef } from "react";

export default function AdminVendorImports() {
  const { toast } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [activeImportId, setActiveImportId] = useState<string | null>(null);
  const [notified, setNotified] = useState<string[]>(() => {
  const stored = localStorage.getItem("notifiedImports");
    return stored ? JSON.parse(stored) : [];
  });
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const fetchImports = async () => {
    const res = await fetch("/api/admin/vendor/imports");
    return res.json();
  };

  const uploadFile = async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch("/api/admin/vendor/import", {
      method: "POST",
      body: formData,
    });

     const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || "Upload failed"); // ✅ IMPORTANT
    }

    return data;
  };

  const { data, refetch } = useQuery({
    queryKey: ["vendor-imports"],
    queryFn: fetchImports,
    refetchInterval: (query) => {
      const data = query.state.data;
      if (!data) return false;
      const hasProcessing = data.some(
        (item: any) => item.status === "pending" || item.status === "processing"
      );
      return hasProcessing ? 900 : false;
    }
  });
  useEffect(() => {
      if (!data) return;

      let updated = [...notified];

      data.forEach((item: any) => {
        if (item.status === "completed" && item.id === activeImportId && !updated.includes(item.id)) {
          toast({
            title: `Import "${item.fileName}" completed`,
            description: "Vendor import status updates/completion.",
          });

          updated.push(item.id);
        }
      });

      if (updated.length !== notified.length) {
        setNotified(updated);
        localStorage.setItem("notifiedImports", JSON.stringify(updated)); // ✅ persist
      }
    }, [data, notified, toast]);

  const mutation = useMutation({
    mutationFn: uploadFile,
    onSuccess: (res) => {
      refetch();
      setActiveImportId(res.importId);
      toast({
        title: "Upload started",
        description: "Vendor import is processing...",
      });
      setFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    },
    onError: (error: any) => {
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive", // if your toast supports it
      });
    },
  });

  return (
    <div>
      <Header />
      <AdminLayout>
        <h2 className="text-2xl font-bold mb-4">Vendor Imports</h2>
      <div>
        <div className="flex justify-between items-center mb-4">
          {/* LEFT: File selector */}
          <div className="flex items-center gap-4">
            <label className="cursor-pointer bg-gray-100 border px-4 py-2 rounded hover:bg-gray-200">
              Choose File
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.xlsx"
                className="hidden"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
              />
            </label>

            <span className="text-sm text-gray-600">
              {file ? file.name : "No file chosen"}
            </span>
          </div>

          {/* RIGHT: Upload button */}
          <button
            disabled={!file || mutation.isPending}
            className="bg-blue-600 text-white px-4 py-2 rounded"
            onClick={() => file && mutation.mutate(file)}
          >
            {mutation.isPending ? "Uploading..." : "Upload CSV"}
          </button>
        </div>

        <hr />

        {data?.map((item: any) => (
          <div
            key={item.id}
            className="border rounded-xl p-4 mb-4 shadow-sm bg-white"
          >
            <div className="flex justify-between items-center">
              <h3 className="font-semibold">{item.fileName}</h3>
              <span
                className={`text-sm px-2 py-1 rounded ${
                  item.status === "completed"
                    ? "bg-green-100 text-green-700"
                    : item.status === "processing"
                    ? "bg-yellow-100 text-yellow-700"
                    : "bg-gray-100 text-gray-600"
                }`}
              >
                {item.status}
              </span>
            </div>

            {/* Progress bar */}
            <div className="mt-3">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-500 h-2 rounded-full transition-all"
                  style={{ width: `${item.progress || 0}%` }}
                />
              </div>
              <p className="text-sm mt-1 text-gray-600">
                {item.processedRecords || 0} / {item.totalRecords || 0} (
                {item.progress || 0}%)
              </p>
            </div>

            {/* Stats */}
            <div className="flex gap-4 text-sm mt-2">
              <span className="text-green-600">
                Success: {item.successRecords || 0}
              </span>
              <span className="text-red-600">
                Failed: {item.failedRecords || 0}
              </span>
            </div>

            {/* Errors */}
            {item.errors?.length > 0 && (
              <details className="mt-2 text-sm">
                <summary className="cursor-pointer text-red-500">
                  View Errors & Info ({item.errors.length})
                </summary>
                <div className="mt-2 max-h-40 overflow-auto">
                  {item.errors.map((e: any, i: number) => (
                    <p key={i} className="text-red-400">
                      Row {e.row}: {e.message}
                    </p>
                  ))}
                </div>
              </details>
            )}
          </div>
        ))}
      </div>
          </AdminLayout>
    </div>
  );
}